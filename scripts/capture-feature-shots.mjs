// Capture the dashboard feature shots for the expanded landing (EN, light+dark).
// Mock server first: npm run dev:mock (5180). Then: node scripts/capture-feature-shots.mjs
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../public/screenshots");
const BASE = "http://localhost:5180";
const SHOTS = [
  { key: "engineering", route: "/menu/engineering" },
  { key: "branches", route: "/analytics?tab=branches" },
  { key: "ingredients", route: "/inventory/items" },
  { key: "lowstock", route: "/inventory/reports" },
  { key: "variance", route: "/inventory/counts", click: 'button:has-text("View report")', clickWait: 1400 },
];
async function capture(browser, theme) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce", colorScheme: theme });
  await ctx.addInitScript((t) => { try { localStorage.setItem("madar.theme", t); localStorage.setItem("madar.lang", "en"); localStorage.setItem("madar.app", JSON.stringify({ state: { language: "en" }, version: 0 })); } catch (e) {} }, theme);
  const p = await ctx.newPage();
  for (const s of SHOTS) {
    const base = path.join(OUT, `dash-${s.key}${theme === "dark" ? "-dark" : ""}`);
    await p.goto(BASE + s.route, { waitUntil: "networkidle", timeout: 45000 });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await p.waitForTimeout(1800);
    if (s.click) { await p.click(s.click, { timeout: 5000 }).catch((e) => console.warn(" click:", e.message.slice(0, 40))); await p.waitForTimeout(s.clickWait || 1200); }
    await p.evaluate(() => document.querySelectorAll('[class*="tsqd"],[class*="Devtools"]').forEach((e) => e.style.setProperty("display", "none", "important")));
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${base}.png` });
    execFileSync("cwebp", ["-quiet", "-q", "80", "-sharp_yuv", `${base}.png`, "-o", `${base}.webp`]);
    unlinkSync(`${base}.png`);
    console.log("saved", path.relative(process.cwd(), `${base}.webp`), `(${theme})`);
  }
  await ctx.close();
}
const browser = await chromium.launch();
for (const t of ["light", "dark"]) await capture(browser, t);
await browser.close();
console.log("done");
