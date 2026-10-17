// Motion verification harness (see MOTION_HANDOFF.md). Run against a mock dev
// server (`npm run dev:mock`). Needs Playwright's Chromium: `npx playwright install chromium`
// (or point CHROME_PATH at a Chromium/headless-shell binary).
// Motion verification harness: screenshots (EN/AR × light/dark), CLS, and frame
// timing under 4× CPU throttle, against a mock dev server.
//   node harness.mjs <baseUrl> <outDir> [--frames-only] [--shots-only]
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
const framesOnly = process.argv.includes("--frames-only");
const shotsOnly = process.argv.includes("--shots-only");
mkdirSync(out, { recursive: true });

const SCREENS = [
  { name: "home", path: "/" },
  { name: "orders", path: "/orders" },
  { name: "floor", path: "/floor" },
  { name: "reports", path: "/reports/operations" },
  { name: "settings", path: "/settings" },
  { name: "onboarding", path: "/onboarding" },
  { name: "signin", path: "/login", signedOut: true },
  { name: "signup", path: "/signup", signedOut: true },
];

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

async function context({ lang, theme, signedOut, reduced = false }) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduced ? "reduce" : "no-preference",
    colorScheme: theme,
  });
  await ctx.addInitScript(([l, t]) => {
    localStorage.setItem("madar.lang", l);
    localStorage.setItem("madar.theme", t);
    sessionStorage.setItem("madar.onboarding.skip", "1");
  }, [lang, theme]);
  if (signedOut) {
    // The mock seeds a session at boot; drop that line for signed-out screens.
    await ctx.route(/\/src\/data\/api\/mock\/enable\.ts/, async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace(/useAuthStore\.getState\(\)\.signIn\([^)]*\);/, "");
      await route.fulfill({ response: res, body });
    });
  }
  // Layout-shift accumulator from the first byte.
  await ctx.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  return ctx;
}

const settle = (page) => page.waitForLoadState("networkidle").catch(() => {}).then(() => page.waitForTimeout(1800));

const results = { cls: {}, frames: {} };

if (!framesOnly) {
  for (const lang of ["en", "ar"]) {
    for (const theme of ["light", "dark"]) {
      for (const s of SCREENS) {
        const ctx = await context({ lang, theme, signedOut: s.signedOut });
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        await page.goto(base + s.path);
        await settle(page);
        const cls = await page.evaluate(() => window.__cls);
        results.cls[`${s.name}.${lang}.${theme}`] = { cls: +cls.toFixed(4), errors };
        await page.screenshot({ path: `${out}/${s.name}-${lang}-${theme}.png` });
        await ctx.close();
      }
    }
  }
}

// Frame timing: 4× CPU throttle, measure a client-side navigation and a
// dialog/sheet open — the moments motion runs — by rAF intervals.
async function measure(page, act) {
  await page.evaluate(() => {
    window.__f = [];
    let last = performance.now();
    const tick = (t) => {
      window.__f.push(t - last);
      last = t;
      if (window.__f.length < 400) window.__frameRaf = requestAnimationFrame(tick);
    };
    window.__frameRaf = requestAnimationFrame(tick);
  });
  await act();
  await page.waitForTimeout(2000);
  const f = await page.evaluate(() => {
    cancelAnimationFrame(window.__frameRaf);
    return window.__f.slice(1);
  });
  const sorted = [...f].sort((a, b) => a - b);
  const p = (q) => +(sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0).toFixed(1);
  return { frames: f.length, p50: p(0.5), p95: p(0.95), max: p(1), over34: f.filter((x) => x > 34).length };
}

if (!shotsOnly) {
  const FLOWS = [
    { name: "nav:home→orders", start: "/", act: (pg) => pg.locator('a[href^="/orders"]').first().click() },
    { name: "nav:orders→reports", start: "/orders", act: (pg) => pg.locator('a[href^="/reports/operations"]').first().click() },
    { name: "nav:home→floor", start: "/", act: (pg) => pg.locator('a[href^="/floor"]').first().click() },
    { name: "nav:home→settings", start: "/", act: (pg) => pg.locator('a[href^="/settings?"]').first().click() },
    {
      name: "orders:open-sheet",
      start: "/orders",
      act: (pg) => pg.locator("table tbody tr").first().click(),
    },
  ];
  for (const flow of FLOWS) {
    const ctx = await context({ lang: "en", theme: "light" });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(base + flow.start);
    await settle(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    try {
      results.frames[flow.name] = await measure(page, () => flow.act(page));
      results.frames[flow.name].cls = +(await page.evaluate(() => window.__cls)).toFixed(4);
    } catch (e) {
      results.frames[flow.name] = { error: String(e).slice(0, 200) };
    }
    await ctx.close();
  }
}

await browser.close();
writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
