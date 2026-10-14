// Fetches the manifest the page is baked from into src/data/manifest.json.
//   MANIFEST_SRC=/path/to/manifest.json | https://…/manifest.json   (default: the live one)
// An unreachable source is not a failed build: the page bakes its empty state, and its
// script fills the list in from the live manifest.json anyway.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const src = process.env.MANIFEST_SRC || "https://downloads.madar-pos.cloud/manifest.json";
const out = fileURLToPath(new URL("../src/data/manifest.json", import.meta.url));
let manifest = { generated: null, products: {} };
try {
  const text = /^https?:/.test(src) ? await fetch(src, { signal: AbortSignal.timeout(15000) }).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))) : await readFile(src, "utf8");
  manifest = JSON.parse(text);
  if (typeof manifest.products !== "object" || !manifest.products) throw new Error("no products object");
  const n = Object.values(manifest.products).reduce((a, p) => a + p.releases.length, 0);
  console.log(`manifest: ${Object.keys(manifest.products).length} products, ${n} releases from ${src}`);
} catch (e) {
  console.warn(`manifest: could not read ${src} (${e.message}); baking the empty state`);
}
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(manifest));
