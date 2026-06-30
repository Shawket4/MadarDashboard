// One-off: capture fresh dashboard screenshots from the MSW mock harness, in BOTH
// light and dark themes (the landing loads the variant matching the active theme).
// Run the mock server first:  npm run dev:mock   (port 5180)
// Then:  node scripts/capture-shots.mjs [routeKey]
// Saves WebP into public/screenshots/. Deterministic mock data → stable shots.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../public/screenshots");
const BASE = "http://localhost:5180";

// 16:10 desktop, retina. 1440×900 → 2880×1800.
const VIEW = { width: 1440, height: 900 };
const DSF = 2;
const THEMES = ["light", "dark"];

// Routes the landing showcases (data-rich under the mock harness). Analytics uses
// the Revenue tab (charts over time); recipes opens Latte to show the costing.
const SHOTS = [
  { key: "overview", route: "/", hero: true },
  { key: "orders", route: "/orders", hero: true },
  { key: "analytics", route: "/analytics?tab=revenue", hero: true },
];

const only = process.argv[2];
const targets = only ? SHOTS.filter((s) => s.key === only) : SHOTS;

function initScript(lang, theme) {
  // Force theme + language before the app boots. The mock harness signs the
  // session in itself; we only steer theme + locale here.
  return `
    try {
      localStorage.setItem('madar.theme', '${theme}');
      localStorage.setItem('madar.lang', '${lang}');
      localStorage.setItem('madar.app', JSON.stringify({ state: { language: '${lang}' }, version: 0 }));
    } catch (e) {}
  `;
}

// Suffix mirrors the landing's lookup: -en/-ar on heroes, none on EN-only shots,
// plus -dark for the dark variant.  overview → dash-overview-en[-dark].webp etc.
function suffixFor(shot, lang, theme) {
  const langPart = lang === "ar" ? "-ar" : shot.hero ? "-en" : "";
  return langPart + (theme === "dark" ? "-dark" : "");
}

async function capture(browser, lang, theme) {
  const ctx = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: DSF,
    reducedMotion: "reduce",
    colorScheme: theme,
  });
  await ctx.addInitScript(initScript(lang, theme));
  const page = await ctx.newPage();

  for (const shot of targets) {
    // Heroes get -en/-ar variants; non-heroes only EN.
    if (!shot.hero && lang === "ar") continue;
    const base = path.join(OUT, `dash-${shot.key}${suffixFor(shot, lang, theme)}`);
    const png = `${base}.png`;
    await page.goto(BASE + shot.route, { waitUntil: "networkidle", timeout: 45000 });
    // Let fonts + Recharts entrance settle.
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(1800);
    if (shot.click) {
      try {
        await page.click(shot.click, { timeout: 4000 });
        await page.waitForTimeout(1600);
      } catch (e) {
        console.warn("click skipped:", shot.click, e.message);
      }
    }
    // Strip dev-only devtools widgets (React Query + Router badges) for clean shots.
    await page.evaluate(() => {
      const kill = new Set();
      document.querySelectorAll("body *").forEach((el) => {
        const cls = (el.className && el.className.toString && el.className.toString()) || "";
        if (/tsqd|TanStackRouterDevtools|react-query-devtools/i.test(cls)) kill.add(el);
      });
      document.querySelectorAll("button, a, div").forEach((el) => {
        if (/TanStack|Devtools/i.test(el.textContent || "")) {
          const r = el.getBoundingClientRect();
          if (r.bottom > window.innerHeight - 140 && r.width < 360) kill.add(el);
        }
      });
      kill.forEach((el) => el.style.setProperty("display", "none", "important"));
    });
    await page.waitForTimeout(150);
    await page.screenshot({ path: png });
    // Compress to WebP immediately (per-file, so we never touch other captures).
    execFileSync("cwebp", ["-quiet", "-q", "80", "-sharp_yuv", png, "-o", `${base}.webp`]);
    unlinkSync(png);
    console.log("saved", path.relative(process.cwd(), `${base}.webp`), `(${lang}/${theme})`);
  }
  await ctx.close();
}

const browser = await chromium.launch();
for (const theme of THEMES) {
  await capture(browser, "en", theme);
  if (!only || targets.some((t) => t.hero)) await capture(browser, "ar", theme);
}
await browser.close();
console.log("done");
