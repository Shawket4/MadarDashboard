// The archive (site/README.md, "The archive"). After the build, every file a visit needs,
// in both languages, goes into one tar beside the hashed assets: assets/pack.<hash>.tar,
// with brotli and gzip copies for nginx to send as they are. Then the service worker that
// unpacks it (sw/sw.ts) is written to /sw.js, with the archive's manifest in front.
//
// In it: every page (not get.html, nginx's fallback), every script, style, font (woff2:
// every browser that runs a service worker reads it), Lottie file and the animation
// runtime, the icons, and each screenshot once: Astro makes seven widths of each, and the
// archive keeps the smallest at or above what the site shows (phones 720 px, wide screens
// 1280 px); the worker answers a request for any width with it.
// Not in it: the share images, the sitemaps and robots.txt, which pages don't load.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants as zlib } from "node:zlib";
import ts from "typescript";

/** Screenshot widths the archive keeps: the smallest at or above these. */
const PHONE = 720;
const WIDE = 1280;
/** A screenshot's widths share a group, "<name>.<hash>". The worker groups by the same pattern. */
const SHOT = String.raw`^\/assets\/(.+?\.[\w-]{8})(?:_[\w-]+)?\.webp$`;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** Width and height from a WebP header (lossy, lossless or extended). */
function webpSize(buf) {
  const kind = buf.toString("ascii", 12, 16);
  if (kind === "VP8X") return [buf.readUIntLE(24, 3) + 1, buf.readUIntLE(27, 3) + 1];
  if (kind === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  if (kind === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  throw new Error(`pack: not a WebP header (${kind})`);
}

/** A ustar header. The time is zero, so the same files always make the same archive. */
function header(name, size) {
  const h = Buffer.alloc(512);
  let base = name;
  let prefix = "";
  if (Buffer.byteLength(name) > 100) {
    const cut = name.lastIndexOf("/", 155);
    if (cut < 0 || Buffer.byteLength(name.slice(cut + 1)) > 100) throw new Error(`pack: name too long for tar: ${name}`);
    prefix = name.slice(0, cut);
    base = name.slice(cut + 1);
  }
  h.write(base, 0, 100, "utf8");
  h.write("0000644\0", 100);
  h.write("0000000\0", 108);
  h.write("0000000\0", 116);
  h.write(`${size.toString(8).padStart(11, "0")}\0`, 124);
  h.write("00000000000\0", 136);
  h.fill(0x20, 148, 156); // the checksum counts its own field as spaces
  h.write("0", 156);
  h.write("ustar\0", 257);
  h.write("00", 263);
  h.write(prefix, 345, 155, "utf8");
  let sum = 0;
  for (const b of h) sum += b;
  h.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
  return h;
}

export function pack() {
  return {
    name: "madar-pack",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const rel = (f) => path.relative(out, f).split(path.sep).join("/");
        const shot = new RegExp(SHOT);

        const files = []; // archive names, in the order they go in
        const groups = new Map(); // screenshot group → its widths
        for await (const file of walk(out)) {
          const name = rel(file);
          if (/\.(br|gz)$/.test(name)) continue;
          if (name === "index.html" || name === "404.html" || /^(en|ar)\/(.+\/)?index\.html$/.test(name)) files.push(name);
          else if (/^assets\/.+\.webp$/.test(name)) {
            const group = shot.exec(`/${name}`)?.[1];
            if (!group) throw new Error(`pack: a WebP outside the screenshot pattern: ${name}`);
            const [width, height] = webpSize(await readFile(file));
            (groups.get(group) ?? groups.set(group, []).get(group)).push({ name, width, height });
          } else if (/^assets\/.+\.(js|css|json|wasm|woff2|svg|png|jpe?g)$/.test(name)) files.push(name);
          else if (/^(favicon[^/]*\.(ico|svg|png)|apple-touch-icon\.png|icon-\d+\.png|site\.webmanifest)$/.test(name)) files.push(name);
        }
        const shots = {};
        for (const [group, sizes] of groups) {
          sizes.sort((a, b) => a.width - b.width);
          const master = sizes[sizes.length - 1];
          const want = master.height > master.width ? PHONE : WIDE;
          const pick = sizes.find((s) => s.width >= want) ?? master;
          files.push(pick.name);
          shots[group] = `/${pick.name}`;
        }

        // One order whatever order the folders list in: the same files, the same archive.
        files.sort();

        // What the worker answers: pages by their folder address, the rest by path.
        const address = (name) => `/${name.endsWith("index.html") ? name.slice(0, -"index.html".length) : name}`;
        const answers = new Set(files.map(address));
        const covered = (p) => answers.has(p) || (p.endsWith("/index.html") && answers.has(p.slice(0, -"index.html".length))) || Boolean(shots[shot.exec(p)?.[1] ?? ""]);

        // Every asset a page names must come from the archive: nothing else may load.
        const missing = new Set();
        for (const name of files.filter((n) => n.endsWith(".html"))) {
          const html = await readFile(path.join(out, name), "utf8");
          for (const [, value] of html.matchAll(/(?:src|href|srcset)="([^"]+)"/g)) {
            for (const part of value.split(",")) {
              const url = part.trim().split(/\s+/)[0] ?? "";
              if (url.startsWith("/assets/") && !covered(url.split(/[?#]/)[0])) missing.add(url);
            }
          }
        }
        if (missing.size) throw new Error(`pack: pages name assets the archive lacks: ${[...missing].slice(0, 5).join(", ")}`);

        // The archive, its hash and its compressed copies.
        const parts = [];
        for (const name of files) {
          const body = await readFile(path.join(out, name));
          parts.push(header(name, body.length), body, Buffer.alloc((512 - (body.length % 512)) % 512));
        }
        parts.push(Buffer.alloc(1024));
        const tar = Buffer.concat(parts);
        const version = createHash("sha256").update(tar).digest("hex").slice(0, 12);
        const url = `/assets/pack.${version}.tar`;
        const [br, gz] = await Promise.all([
          promisify(brotliCompress)(tar, {
            params: { [zlib.BROTLI_PARAM_QUALITY]: 11, [zlib.BROTLI_PARAM_LGWIN]: 24, [zlib.BROTLI_PARAM_SIZE_HINT]: tar.length },
          }),
          promisify(gzip)(tar, { level: 9 }),
        ]);
        await Promise.all([writeFile(path.join(out, url), tar), writeFile(path.join(out, `${url}.br`), br), writeFile(path.join(out, `${url}.gz`), gz)]);

        // The worker, with what the archive holds in front.
        const source = await readFile(fileURLToPath(new URL("../sw/sw.ts", import.meta.url)), "utf8");
        const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, removeComments: true } }).outputText;
        const manifest = { version, url, count: files.length, files: [...answers], shots, shot: SHOT };
        await writeFile(path.join(out, "sw.js"), `const PACK = ${JSON.stringify(manifest)};\n${js}`);

        const mb = (n) => `${(n / 1048576).toFixed(2)} MB`;
        logger.info(`archive ${url}: ${files.length} files, ${mb(tar.length)} → ${mb(br.length)} brotli (${mb(gz.length)} gzip)`);
      },
    },
  };
}
