// Rebuilds manifest.json from the directory layout  <root>/files/<product>/<version>/<file>
//   node scripts/manifest.mjs [root]        root defaults to /var/www/madar-downloads
// Writes <root>/files/manifest.json (atomically) and the stable "latest" symlinks
//   <root>/files/<product>/latest/<file with its version replaced by "latest">
// A <file>.sha256 beside a file (what CI uploads) is trusted; otherwise the hash is computed.
// scripts/manifest.py is the same thing for the box, which has no Node: keep them equal
// (scripts/manifest.test.mjs runs both and compares).
import { readdirSync, statSync, readFileSync, writeFileSync, renameSync, mkdirSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, existsSync, createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The git tag a product's version comes from (the page shows it; the default is "v"). */
export const TAG_PREFIX = { dawam: "staff-v", dashboard: "dash-v", kitchen: "kitchen-v" };

const SHA = /^[0-9a-f]{64}$/;
const visible = (n) => !n.startsWith(".") && !n.endsWith(".sha256") && !n.endsWith(".partial");
const iso = (ms) => new Date(Math.floor(ms / 1000) * 1000).toISOString().replace(".000Z", "Z");

/** 1.10.0 > 1.9.0 > 1.9.0-beta.1: numeric parts, then a release beats its pre-release. */
export function versionKey(v) {
  const [core, pre = ""] = v.split(/-(.*)/s);
  return [core.split(".").map((x) => parseInt(x, 10) || 0), pre];
}
export function compareVersions(a, b) {
  const [na, pa] = versionKey(a), [nb, pb] = versionKey(b);
  for (let i = 0; i < Math.max(na.length, nb.length); i++) if ((na[i] ?? 0) !== (nb[i] ?? 0)) return (na[i] ?? 0) - (nb[i] ?? 0);
  if (!pa !== !pb) return pa ? -1 : 1;
  return pa < pb ? -1 : pa > pb ? 1 : 0;
}

async function sha256(file) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(file)) h.update(chunk);
  return h.digest("hex");
}

export async function buildManifest(root) {
  const files = path.join(root, "files");
  const products = {};
  const dirs = (d) => readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
  for (const product of existsSync(files) ? dirs(files).sort() : []) {
    const releases = [];
    for (const version of dirs(path.join(files, product)).filter((v) => v !== "latest")) {
      const dir = path.join(files, product, version);
      const tag = `${TAG_PREFIX[product] ?? "v"}${version}`;
      const list = [];
      for (const name of readdirSync(dir).filter(visible).sort()) {
        const f = path.join(dir, name);
        const st = statSync(f);
        if (!st.isFile()) continue;
        const side = existsSync(`${f}.sha256`) ? readFileSync(`${f}.sha256`, "utf8").trim().split(/\s+/)[0].toLowerCase() : "";
        list.push({ name, size: st.size, sha256: SHA.test(side) ? side : await sha256(f), url: `/files/${product}/${version}/${name}`, date: iso(st.mtimeMs), tag });
      }
      if (list.length) releases.push({ version, tag, date: list.map((x) => x.date).sort().at(-1), files: list });
    }
    releases.sort((a, b) => compareVersions(b.version, a.version));
    if (releases.length) products[product] = { releases };
  }
  return { generated: iso(Date.now()), products };
}

/** Points files/<product>/latest/ at the newest stable release (else the newest one). */
export function linkLatest(root, manifest) {
  for (const [product, { releases }] of Object.entries(manifest.products)) {
    const rel = releases.find((r) => !r.version.includes("-")) ?? releases[0];
    const dir = path.join(root, "files", product, "latest");
    mkdirSync(dir, { recursive: true });
    const want = new Map();
    for (const f of rel.files) {
      if (!f.name.includes(rel.version)) continue; // a file without its version in the name has no stable twin
      const link = f.name.replace(rel.version, "latest");
      want.set(link, `../${rel.version}/${f.name}`);
      f.latest = `/files/${product}/latest/${link}`;
    }
    for (const [link, target] of want) {
      const p = path.join(dir, link);
      const cur = lstatSync(p, { throwIfNoEntry: false });
      if (cur?.isSymbolicLink() && readlinkSync(p) === target) continue;
      const tmp = `${p}.tmp`;
      if (lstatSync(tmp, { throwIfNoEntry: false })) unlinkSync(tmp);
      symlinkSync(target, tmp);
      renameSync(tmp, p); // atomic: a download in flight never sees a gap
    }
    for (const n of readdirSync(dir)) if (!want.has(n) && lstatSync(path.join(dir, n)).isSymbolicLink()) unlinkSync(path.join(dir, n));
  }
}

export async function run(root) {
  const manifest = await buildManifest(root);
  linkLatest(root, manifest);
  const out = path.join(root, "files", "manifest.json");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(`${out}.tmp`, JSON.stringify(manifest, null, 2) + "\n");
  renameSync(`${out}.tmp`, out);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? "/var/www/madar-downloads");
  const m = await run(root);
  const n = Object.values(m.products).reduce((a, p) => a + p.releases.reduce((b, r) => b + r.files.length, 0), 0);
  console.log(`manifest: ${Object.keys(m.products).length} products, ${n} files -> ${root}/files/manifest.json`);
}
