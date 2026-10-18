// Tap-to-content probe: on a touch-emulated phone, how long from the finger
// landing (pointerdown) to the destination's content being on screen, legible
// and free of skeletons — the number intent prefetch exists to shrink. Plus a
// storm check: how many API requests 10 s of a mouse wandering over the
// sidebar and a table sends (desktop).
//   node tap-probe.mjs <baseUrl> <out.json> --replay=recording.json
//     [--latency=120] [--runs=5] [--rate=4] [--press=80] [--only=name]
// Serves a production build (`vite preview`) from a recording of the mock
// server (record-mock.mjs), each API answer after --latency ms. A tap is a
// real touch sequence (CDP touchStart, --press ms, touchEnd): the browser makes
// the pointer events and the click from it, as on a phone.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const replay = JSON.parse(readFileSync(arg("replay"), "utf8"));
const api = arg("api") ?? "https://api.madar-pos.cloud";
const latency = Number(arg("latency") ?? 120);
const runs = Number(arg("runs") ?? 5);
const rate = Number(arg("rate") ?? 4);
const press = Number(arg("press") ?? 80);
const only = arg("only");

async function serveReplay(ctx, counter) {
  const exact = new Map();
  const byPath = new Map();
  for (const r of replay.responses) {
    if (!r.status) continue;
    const u = new URL(r.url);
    exact.set(`${r.m} ${u.pathname}${u.search}`, r);
    if (!byPath.has(`${r.m} ${u.pathname}`)) byPath.set(`${r.m} ${u.pathname}`, r);
  }
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
  await ctx.route(`${api}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const u = new URL(req.url());
    if (u.pathname.includes("/realtime/")) return route.abort();
    counter?.(req.method(), u.pathname + u.search);
    const hit = exact.get(`${req.method()} ${u.pathname}${u.search}`) ?? byPath.get(`${req.method()} ${u.pathname}`);
    await new Promise((r) => setTimeout(r, latency));
    if (!hit) return route.abort("failed");
    return route.fulfill({ status: hit.status, headers: { ...cors, "content-type": hit.ct ?? "application/json" }, body: hit.body });
  });
  await ctx.route(/^https:\/\/sentry\./, (route) => route.fulfill({ status: 200, body: "" }));
  await ctx.addInitScript((ls) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    for (const [k, v] of Object.entries(ls)) if (!localStorage.getItem(k)) localStorage.setItem(k, v);
  }, replay.ls);
}

/** In the page: first frame (after the tap) where `done()` holds. */
function probe() {
  const effective = (el) => {
    let o = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  };
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  window.__tap = {
    t0: null,
    done: null,
    // Content is ready: the region is legible and holds no skeleton still showing.
    ready(region) {
      if (!region || effective(region) < 0.5) return false;
      for (const s of region.querySelectorAll('[data-slot="skeleton"]')) {
        if (s.closest("[aria-hidden=true]")) continue;
        if (onScreen(s) && effective(s) > 0.1) return false;
      }
      return true;
    },
  };
  addEventListener("pointerdown", () => { if (window.__tap.t0 == null) window.__tap.t0 = performance.now(); }, true);
}

/** Each scenario: where it starts, what it taps (a locator, after an optional setup), and when the content is there. */
const SCENARIOS = [
  {
    name: "ops-tab",
    start: "/reports/operations",
    target: (page) => page.getByRole("tab", { name: "Items" }),
    // The Items tab is selected, in the URL, and its body has landed.
    done: () => location.search.includes("tab=items") && window.__tap.ready(document.querySelector("[data-page-width]")),
  },
  {
    name: "settings-section",
    start: "/settings",
    setup: async (page) => {
      await page.getByRole("combobox", { name: "Settings section" }).tap();
      await page.getByRole("option", { name: "Links page", exact: true }).waitFor({ timeout: 5000 });
      await page.waitForTimeout(400);
    },
    target: (page) => page.getByRole("option", { name: "Links page", exact: true }),
    done: () => location.pathname === "/settings/links" && !!document.querySelector("[data-page-width] h2") && window.__tap.ready(document.querySelector("[data-page-width]")),
  },
  {
    name: "home-tile",
    start: "/",
    // The "Keep building" tile on the home page opens the set-up checklist.
    target: (page) => page.getByRole("button", { name: "Keep building" }),
    done: () => location.pathname === "/onboarding" && !!document.querySelector("h1, h2") && window.__tap.ready(document.body),
  },
  {
    name: "orders-row",
    start: "/orders",
    target: (page) => page.locator("[data-row] button, button[data-row]").first(),
    done: () => {
      const sheet = document.querySelector('[data-slot="sheet-content"]');
      return !!sheet && sheet.textContent.trim().length > 0 && window.__tap.ready(sheet);
    },
  },
];

async function touchTap(cdp, page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await locator.boundingBox();
  if (!box) throw new Error("target has no box");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await page.waitForTimeout(press);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

const median = (xs) => {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? Math.round(v[Math.floor(v.length / 2)]) : null;
};

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const results = {};

for (const s of SCENARIOS.filter((x) => !only || x.name.startsWith(only))) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => {
      localStorage.setItem("madar.lang", "en");
      localStorage.setItem("madar.theme", "light");
      sessionStorage.setItem("madar.onboarding.skip", "1");
    });
    await serveReplay(ctx);
    await ctx.addInitScript(probe);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    try {
      // Warm-up load (the HTTP cache and the shell, as for a returning user), then the start page.
      await page.goto(base + s.start);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      await page.goto(base + s.start);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
      if (s.setup) await s.setup(page);
      const target = s.target(page);
      await target.waitFor({ state: "visible", timeout: 8000 });
      await page.evaluate(() => { window.__tap.t0 = null; });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate });
      await page.evaluate((fn) => {
        const done = new Function(`return (${fn})()`);
        const loop = () => {
          if (window.__tap.t0 != null && window.__tap.done == null && done()) window.__tap.done = performance.now();
          if (window.__tap.done == null) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }, s.done.toString());
      await touchTap(cdp, page, target);
      await page.waitForFunction(() => window.__tap.done != null, null, { timeout: 15000 });
      const t = await page.evaluate(() => window.__tap.done - window.__tap.t0);
      samples.push(t);
    } catch (e) {
      samples.push(null);
      console.log(`  ${s.name} run ${i}: ${String(e).split("\n")[0]}`);
      if (process.env.TAP_DEBUG) await page.screenshot({ path: `${out}.${s.name}.${i}.png` });
    }
    await ctx.close();
  }
  results[s.name] = { median: median(samples), samples: samples.map((x) => (x == null ? null : Math.round(x))) };
  console.log(`${s.name.padEnd(18)} tap→content median ${results[s.name].median} ms  [${results[s.name].samples.join(", ")}]`);
}

// Storm: 10 s of a mouse wandering over the sidebar and the orders table (desktop, no throttle).
if (!only || "storm".startsWith(only)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    localStorage.setItem("madar.lang", "en");
    localStorage.setItem("madar.theme", "light");
    sessionStorage.setItem("madar.onboarding.skip", "1");
  });
  let counting = false;
  const seen = [];
  await serveReplay(ctx, (m, url) => { if (counting) seen.push(`${m} ${url}`); });
  const page = await ctx.newPage();
  await page.goto(base + "/orders");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2500);
  const side = await page.locator('[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }).filter(([, y]) => y > 0 && y < innerHeight));
  const rows = await page.locator("tr[data-row]").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }).filter(([, y]) => y > 0 && y < innerHeight));
  counting = true;
  const end = Date.now() + 10_000;
  let pass = 0;
  while (Date.now() < end) {
    const path = pass % 2 === 0 ? side : rows;
    const seq = pass % 4 < 2 ? path : [...path].reverse();
    for (const [x, y] of seq) {
      if (Date.now() >= end) break;
      // A hand passing over: ~25 ms per row, never resting.
      await page.mouse.move(x, y, { steps: 3 });
      await page.waitForTimeout(20);
    }
    pass++;
  }
  // What the last move sent lands inside the count.
  await page.waitForTimeout(500);
  counting = false;
  results.storm = { requests: seen.length, sidebarTargets: side.length, rows: rows.length, byPath: seen.reduce((m, k) => ({ ...m, [k]: (m[k] ?? 0) + 1 }), {}) };
  console.log(`storm: ${seen.length} API requests in 10 s over ${side.length} sidebar rows and ${rows.length} table rows`);
  await ctx.close();
}

await browser.close();
writeFileSync(out, JSON.stringify(results, null, 2));
