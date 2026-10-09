// Turns the captured PNGs into the site's WebP masters (src/assets/shots/{en,ar}/<id>.webp).
// Astro then makes WebP at several widths from these at build time.
//   npm run shots -- ~/Desktop/Madar
// After a recapture, point the config at the new run and run it again.
import { readFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "..");
const workspace = path.resolve(process.argv[2] ?? path.join(process.env.HOME ?? "", "Desktop/Madar"));
const cfg = JSON.parse(await readFile(path.join(here, "shots.config.json"), "utf8"));
const MAX_W = 2000;

const exists = (p) => access(p).then(() => true, () => false);
let made = 0, missing = [];
for (const lang of ["en", "ar"]) {
  const outDir = path.join(site, "src/assets/shots", lang);
  await mkdir(outDir, { recursive: true });
  for (const [id, s] of Object.entries(cfg.shots)) {
    const src = s.brochure
      ? path.join(workspace, cfg.brochure, `${s.brochure}${lang === "ar" ? "-ar" : ""}.png`)
      : path.join(workspace, cfg.captures[s.capture], s.path.replaceAll("{lang}", lang));
    if (!(await exists(src))) { missing.push(`${lang}/${id} ← ${src}`); continue; }
    let img = sharp(src);
    if (s.crop === "dashboard") {
      const meta = await img.metadata();
      const [x0, y0, x1, y1] = cfg.dashboardCrop[lang];
      if ((meta.width ?? 0) >= x1 && (meta.height ?? 0) >= y1) {
        img = img.extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 });
      }
    }
    await img
      .resize({ width: MAX_W, withoutEnlargement: true })
      .webp({ quality: 86, effort: 6, smartSubsample: true })
      .toFile(path.join(outDir, `${id}.webp`));
    made++;
  }
}
console.log(`made ${made} masters`);
if (missing.length) console.log(`missing:\n  ${missing.join("\n  ")}`);
