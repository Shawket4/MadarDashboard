// Madar marketing site: get.madar-pos.cloud
// Static output: every page is prerendered HTML, in English (/en/…) and Arabic (/ar/…).
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { copyFile, access, readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants as zlib } from "node:zlib";
import { execSync } from "node:child_process";
import { pack } from "./integrations/pack.mjs";
import { agentFiles } from "./scripts/agent-files.mjs";

export const SITE = "https://get.madar-pos.cloud";

/**
 * The get vhost serves the root page for / as `get.html` (`location = /`, see
 * deploy/nginx/get.madar-pos.cloud), so ship it under that name too, and publish the
 * sitemap as sitemap.xml (robots.txt points there) beside the integration's files.
 */
function rootAlias() {
  return {
    name: "madar-root-alias",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        await copyFile(`${out}index.html`, `${out}get.html`);
        const urls = `${out}sitemap-0.xml`;
        if (await access(urls).then(() => true, () => false)) await copyFile(urls, `${out}sitemap.xml`);
      },
    },
  };
}

/**
 * A <link rel="modulepreload"> in each page's <head> for every chunk its module scripts
 * import (Astro adds none), so the browser fetches them beside the script instead of a
 * round trip after it: the header's menu and the hero's figures wait on that graph
 * (about 400 ms later on a mid phone without it). Runs before the root alias and the
 * archive, so get.html and the archive's pages have them too.
 */
function modulePreload() {
  return {
    name: "madar-modulepreload",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        const graph = new Map();
        // A chunk's static imports, all the way down (dynamic import() is left to load late).
        const deps = async (file) => {
          if (graph.has(file)) return graph.get(file);
          graph.set(file, new Set());
          const code = await readFile(path.join(out, file), "utf8");
          const found = new Set();
          for (const [, rel] of code.matchAll(/\bimport\s*(?:[\w$*{},\s]+?\s*from\s*)?["'](\.\/[^"']+?\.js)["']/g)) {
            const dep = path.posix.join(path.posix.dirname(file), rel);
            found.add(dep);
            for (const d of await deps(dep)) found.add(d);
          }
          graph.set(file, found);
          return found;
        };
        async function* pages(d) {
          for (const entry of await readdir(d, { withFileTypes: true })) {
            const p = path.join(d, entry.name);
            if (entry.isDirectory()) yield* pages(p);
            else if (entry.name.endsWith(".html")) yield p;
          }
        }
        for await (const page of pages(out)) {
          const html = await readFile(page, "utf8");
          const want = new Set();
          for (const [, src] of html.matchAll(/<script type="module" src="\/([^"]+\.js)"/g)) for (const d of await deps(src)) want.add(d);
          if (!want.size) continue;
          const links = [...want].map((d) => `<link rel="modulepreload" href="/${d}">`).join("");
          await writeFile(page, html.replace("</head>", `${links}</head>`));
        }
      },
    },
  };
}

/**
 * The sitemap's <lastmod>: the date of the last commit that touched the site's source,
 * so it moves when the pages do and not on every rebuild. Falls back to the build date
 * where git history isn't there (a shallow CI clone whose head didn't touch site/).
 */
function lastModified() {
  try {
    const out = execSync("git log -1 --format=%cI -- src public", { cwd: fileURLToPath(new URL(".", import.meta.url)), stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (out) return new Date(out);
  } catch {}
  return new Date();
}

/**
 * Precompressed copies beside every text file (`.br` and `.gz`), as the old landing's
 * build made them: nginx can send them straight away (`brotli_static` / `gzip_static`)
 * instead of compressing on each request. The originals stay for clients that
 * want neither. Runs after the root alias, so get.html and sitemap.xml get theirs.
 */
function precompress() {
  const TEXT = /\.(html|css|js|mjs|json|svg|xml|txt|md|webmanifest|wasm)$/;
  const MIN = 1024; // smaller files aren't worth a second request path
  const br = promisify(brotliCompress);
  const gz = promisify(gzip);
  async function* walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(p);
      else if (TEXT.test(entry.name)) yield p;
    }
  }
  return {
    name: "madar-precompress",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        let files = 0, before = 0, after = 0;
        for await (const file of walk(fileURLToPath(dir))) {
          const body = await readFile(file);
          if (body.length < MIN) continue;
          const mode = file.endsWith(".wasm") ? zlib.BROTLI_MODE_GENERIC : zlib.BROTLI_MODE_TEXT;
          const [b, g] = await Promise.all([
            br(body, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11, [zlib.BROTLI_PARAM_MODE]: mode, [zlib.BROTLI_PARAM_SIZE_HINT]: body.length } }),
            gz(body, { level: 9 }),
          ]);
          // Only keep a copy that actually saves something.
          if (b.length < body.length * 0.95) await writeFile(`${file}.br`, b);
          if (g.length < body.length * 0.95) await writeFile(`${file}.gz`, g);
          files++; before += body.length; after += Math.min(b.length, body.length);
        }
        logger.info(`${files} files precompressed: ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB with brotli`);
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
    // nginx on the VPS serves /assets/ with a one-year immutable cache (the old
    // landing's folder) and everything else with no-store. Hashed files go there.
    assets: "assets",
  },
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en", ar: "ar" } },
      // Only the language pages: the root is a bilingual signpost to them, 404 isn't a page.
      filter: (page) => /\/(en|ar)\//.test(page),
      lastmod: lastModified(),
      // x-default: the English page, as each page's own hreflang says.
      serialize: (item) => ({ ...item, links: [...(item.links ?? []), { url: item.url.replace(/\/ar\//, "/en/"), lang: "x-default" }] }),
    }),
    modulePreload(),
    rootAlias(),
    // Markdown versions, /index.md and llms.txt, read back from the built pages.
    agentFiles(SITE),
    // The whole site as one archive and the service worker that serves it (before the
    // precompression, so sw.js gets its .br and .gz too).
    pack(),
    precompress(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Code shared with the dashboard (../shared): the family showcase's 3D engine.
      alias: { "@shared": fileURLToPath(new URL("../shared", import.meta.url)) },
      // The shared engine sits outside this package; its "three" is this package's.
      dedupe: ["three"],
    },
    server: {
      fs: { allow: [fileURLToPath(new URL(".", import.meta.url)), fileURLToPath(new URL("../shared", import.meta.url))] },
    },
  },
});
