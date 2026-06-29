// One-off: capture fresh dashboard screenshots from the MSW mock harness.
// Run the mock server first:  npm run dev:mock   (port 5180)
// Then:  node scripts/capture-shots.mjs [routeKey]
// Saves PNGs into public/screenshots/. Deterministic mock data → stable shots.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../public/screenshots");
const BASE = "http://localhost:5180";

// 16:10 desktop, retina. 1440×900 → 2880×1800 PNG.
const VIEW = { width: 1440, height: 900 };
const DSF = 2;

// Routes worth showcasing (data-rich under the mock harness).
const SHOTS = [
  { key: "overview", route: "/", hero: true },
  { key: "orders", route: "/orders", hero: true },
  { key: "analytics", route: "/analytics", hero: true },
  { key: "inventory", route: "/inventory/items", hero: false },
  { key: "recipes", route: "/menu/recipes", hero: false, click: "text=Latte" },
];

const only = process.argv[2];
const targets = only ? SHOTS.filter((s) => s.key === only) : SHOTS;

function initScript(lang) {
  // Force light theme + language before the app boots. The mock harness signs
  // the session in itself; we only steer theme + locale here.
  return `
    try {
      localStorage.setItem('madar.theme', 'light');
      localStorage.setItem('i18nextLng', '${lang}');
      localStorage.setItem('madar.app', JSON.stringify({ state: { language: '${lang}' }, version: 0 }));
    } catch (e) {}
  `;
}

async function capture(browser, lang) {
  const ctx = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: DSF,
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  await ctx.addInitScript(initScript(lang));
  const page = await ctx.newPage();

  for (const shot of targets) {
    // Heroes get -en/-ar variants; non-heroes only EN.
    if (!shot.hero && lang === "ar") continue;
    const suffix = lang === "ar" ? "-ar" : shot.hero ? "-en" : "";
    const file = path.join(OUT, `dash-${shot.key}${suffix}.png`);
    await page.goto(BASE + shot.route, { waitUntil: "networkidle", timeout: 45000 });
    // Let fonts + Recharts entrance settle.
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(1800);
    if (shot.click) {
      try {
        await page.click(shot.click, { timeout: 4000 });
        await page.waitForTimeout(900);
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
    await page.screenshot({ path: file });
    console.log("saved", path.relative(process.cwd(), file), `(${lang})`);
  }
  await ctx.close();
}

const browser = await chromium.launch();
await capture(browser, "en");
if (!only || targets.some((t) => t.hero)) await capture(browser, "ar");
await browser.close();
console.log("done");
