// Capture dashboard feature shots for the expanded landing, in all 4 states:
// en/ar × light/dark. Mock server first: npm run dev:mock (5180).
// Then: node scripts/capture-feature-shots.mjs
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../public/screenshots");
const BASE = "http://localhost:5180";

// `clicks` is a list of selectors tried in order (covers EN + AR labels).
const SHOTS = [
  { key: "engineering", route: "/menu/engineering" },
  { key: "branches", route: "/analytics?tab=branches" },
  { key: "ingredients", route: "/inventory/items" },
  { key: "lowstock", route: "/inventory/reports" },
  {
    key: "variance",
    route: "/inventory/counts",
    clicks: ['button:has-text("View report")', 'button:has-text("عرض التقرير")', 'button:has-text("عرض")', "tbody tr"],
    clickWait: 1400,
  },
  {
    key: "recipes",
    route: "/menu/recipes",
    clicks: [':text-is("Latte")', ':text-is("لاتيه")', "text=Latte", "text=لاتيه"],
    clickWait: 1500,
  },
];

async function tryClicks(p, selectors) {
  for (const sel of selectors) {
    try {
      await p.click(sel, { timeout: 2500 });
      return sel;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function capture(browser, lang, theme) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    colorScheme: theme,
  });
  await ctx.addInitScript(
    ([l, t]) => {
      try {
        localStorage.setItem("madar.theme", t);
        localStorage.setItem("madar.lang", l);
        localStorage.setItem("madar.app", JSON.stringify({ state: { language: l }, version: 0 }));
      } catch (e) {}
    },
    [lang, theme],
  );
  const p = await ctx.newPage();
  for (const s of SHOTS) {
    const base = path.join(OUT, `dash-${s.key}-${lang}${theme === "dark" ? "-dark" : ""}`);
    await p.goto(BASE + s.route, { waitUntil: "networkidle", timeout: 45000 });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await p.waitForTimeout(1800);
    if (s.clicks) {
      const hit = await tryClicks(p, s.clicks);
      if (!hit) console.warn(`  ${s.key}/${lang}/${theme}: no click matched`);
      await p.waitForTimeout(s.clickWait || 1200);
    }
    await p.evaluate(() =>
      document
        .querySelectorAll('[class*="tsqd"],[class*="Devtools"]')
        .forEach((e) => e.style.setProperty("display", "none", "important")),
    );
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${base}.png` });
    execFileSync("cwebp", ["-quiet", "-q", "80", "-sharp_yuv", `${base}.png`, "-o", `${base}.webp`]);
    unlinkSync(`${base}.png`);
    console.log("saved", path.relative(process.cwd(), `${base}.webp`));
  }
  await ctx.close();
}

const browser = await chromium.launch();
for (const lang of ["en", "ar"]) for (const theme of ["light", "dark"]) await capture(browser, lang, theme);
await browser.close();
console.log("done");
