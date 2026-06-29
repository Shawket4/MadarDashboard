// Compress landing assets for the web:
//  • every public/screenshots/*.png → WebP (q80, sharp edges) and drop the PNG
//  • public/og.png → a downscaled, JPG-encoded og.jpg (share card; crawler-only)
// WebP is ~70% smaller than PNG for UI screenshots with no visible loss. Run after
// any capture:  node scripts/optimize-images.mjs
import { execFileSync } from "node:child_process";
import { readdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(__dirname, "../public/screenshots");
const PUB = path.resolve(__dirname, "../public");
const kb = (n) => `${Math.round(n / 1024)}KB`;

let before = 0;
let after = 0;
for (const f of readdirSync(SHOTS).filter((f) => f.endsWith(".png"))) {
  const png = path.join(SHOTS, f);
  const webp = png.replace(/\.png$/, ".webp");
  before += statSync(png).size;
  execFileSync("cwebp", ["-quiet", "-q", "80", "-sharp_yuv", png, "-o", webp]);
  after += statSync(webp).size;
  unlinkSync(png);
  console.log(`  → ${path.basename(webp)}  ${kb(statSync(webp).size)}`);
}

const og = path.join(PUB, "og.png");
if (existsSync(og)) {
  const ogJpg = path.join(PUB, "og.jpg");
  execFileSync("sips", [
    "-z", "630", "1200",
    "-s", "format", "jpeg",
    "-s", "formatOptions", "82",
    og, "--out", ogJpg,
  ]);
  unlinkSync(og);
  console.log(`  → og.jpg  ${kb(statSync(ogJpg).size)}  (was ${kb(before && statSync(ogJpg).size)})`);
}

if (before) {
  console.log(`screenshots: ${(before / 1048576).toFixed(2)}MB → ${(after / 1048576).toFixed(2)}MB`);
}
