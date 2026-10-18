// Latency probe: how long content is held back after its data arrives.
// For every content element that mounts on screen after a data response
// (SkeletonSwap content `[data-arrive]`, table rows `[data-row]`, staggered
// items `[data-stagger] > *`) it records, relative to the last API response
// before it mounted:
//   legible  the first frame its effective opacity (its own times every
//            ancestor's) is at least 0.5
//   settled  the frame it reached opacity 1 with no transform, for good
// and for route changes the new page's first legible frame after the click.
// Each scenario runs `--runs` times (median), at 1x and 4x CPU.
// Cold loads also report first contentful paint, the largest contentful
// paint and a TTI-like "quiet" mark (the end of the last long task).
//   node latency-probe.mjs <baseUrl> <out.json> [--runs=3] [--only=name]
//     [--replay=recording.json] [--api=https://api.madar-pos.cloud] [--latency=120] [--first-visit]
// --replay serves a production build (`vite preview`) without a backend: the
// API origin is answered from a recording of the mock server ({ ls, responses:
// [{ m, url, status, ct, body }] }) after --latency ms, and the recording's
// localStorage (the signed-in session) is seeded first.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
const runs = Number(process.argv.find((a) => a.startsWith("--runs="))?.slice(7) ?? 3);
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const replay = arg("replay") ? JSON.parse(readFileSync(arg("replay"), "utf8")) : null;
const api = arg("api") ?? "https://api.madar-pos.cloud";
const latency = Number(arg("latency") ?? 120);
// A first visit: no warm-up load, so nothing is in the HTTP cache or IndexedDB.
const firstVisit = process.argv.includes("--first-visit");

async function serveReplay(ctx) {
  const exact = new Map();
  const byPath = new Map();
  for (const r of replay.responses) {
    // A request the mock let through to the real API failed there: fail it here too.
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

const go = (to) => (page) =>
  page.evaluate((path) => {
    window.__lat.navAt = performance.now();
    history.pushState({}, "", path);
    dispatchEvent(new PopStateEvent("popstate"));
  }, to);

const SCENARIOS = [
  { name: "load-home", load: "/" },
  { name: "load-orders", load: "/orders" },
  { name: "load-operations", load: "/reports/operations" },
  { name: "nav-home-orders", start: "/", act: go("/orders") },
  { name: "nav-orders-operations", start: "/orders", act: go("/reports/operations") },
];

function probe() {
  const lat = (window.__lat = { responses: [], els: new Map(), navAt: null, page: null });
  const now = () => performance.now();
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    this.addEventListener("loadend", () => lat.responses.push(now()));
    return open.apply(this, args);
  };
  const SEL = "[data-arrive], [data-row], [data-stagger] > *";
  const mounted = new WeakMap();
  new MutationObserver((rs) => {
    const t = now();
    for (const r of rs)
      for (const n of r.addedNodes) {
        if (n.nodeType !== 1) continue;
        mounted.set(n, t);
        for (const d of n.querySelectorAll("*")) mounted.set(d, t);
      }
  }).observe(document, { childList: true, subtree: true });
  const effective = (el) => {
    let o = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  };
  const still = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const tf = getComputedStyle(n).transform;
      if (tf !== "none" && tf !== "matrix(1, 0, 0, 1, 0, 0)") return false;
    }
    return true;
  };
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const loop = () => {
    const t = now();
    for (const el of document.querySelectorAll(SEL)) {
      if (el.closest("[aria-hidden=true]")) continue;
      let rec = lat.els.get(el);
      if (!rec) {
        if (!onScreen(el)) continue;
        const at = mounted.get(el) ?? t;
        // After a route change, only what the change brought in.
        if (lat.navAt != null && at < lat.navAt) continue;
        const data = lat.responses.filter((x) => x <= at).pop() ?? lat.navAt;
        rec = { at, data, legible: null, unsettled: t, kind: el.matches("[data-row]") ? "row" : el.matches("[data-arrive]") ? "swap" : "stagger" };
        lat.els.set(el, rec);
      }
      const o = effective(el);
      if (rec.legible == null && o >= 0.5) rec.legible = t;
      if (!(o >= 0.99 && still(el))) rec.unsettled = t;
    }
    const pageEl = document.querySelector("[data-page-width]");
    if (pageEl && lat.navAt != null) {
      if (!lat.page || lat.page.el !== pageEl) lat.page = { el: pageEl, legible: null, unsettled: t };
      const o = effective(pageEl);
      if (lat.page.legible == null && o >= 0.5) lat.page.legible = t;
      if (!(o >= 0.99 && still(pageEl))) lat.page.unsettled = t;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const vitals = (lat.vitals = { fcp: null, lcp: null, quiet: 0 });
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.name === "first-contentful-paint") vitals.fcp = e.startTime;
    }).observe({ type: "paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) vitals.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) vitals.quiet = Math.max(vitals.quiet, e.startTime + e.duration);
    }).observe({ type: "longtask", buffered: true });
  } catch {}
  lat.result = () => {
    const recs = [...lat.els.values()].filter((r) => r.data != null);
    const legible = recs.map((r) => (r.legible ?? now()) - r.data);
    const settled = recs.map((r) => r.unsettled + 16.7 - r.data);
    // Mount to legible: what the motion alone holds back (render time excluded).
    const hold = recs.map((r) => (r.legible ?? now()) - r.at);
    return {
      fcp: vitals.fcp,
      lcp: vitals.lcp,
      quiet: Math.max(vitals.quiet, vitals.fcp ?? 0),
      items: recs.length,
      firstLegible: legible.length ? Math.min(...legible) : null,
      lastLegible: legible.length ? Math.max(...legible) : null,
      lastSettled: settled.length ? Math.max(...settled) : null,
      holdMax: hold.length ? Math.max(...hold) : null,
      // Data landing on a skeleton (SkeletonSwap): mount to first legible frame.
      holdSwap: recs.some((r) => r.kind === "swap")
        ? Math.max(...recs.filter((r) => r.kind === "swap").map((r) => (r.legible ?? now()) - r.at))
        : null,
      page:
        lat.navAt != null && lat.page
          ? { legible: (lat.page.legible ?? now()) - lat.navAt, settled: lat.page.unsettled + 16.7 - lat.navAt }
          : null,
    };
  };
  lat.reset = () => {
    lat.els.clear();
    lat.responses.length = 0;
  };
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const median = (xs) => {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? Math.round(v[Math.floor(v.length / 2)]) : null;
};
const results = {};
for (const rate of [1, 4]) {
  for (const s of SCENARIOS.filter((x) => !only || x.name.startsWith(only))) {
    const samples = [];
    for (let i = 0; i < runs; i++) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addInitScript(() => {
        localStorage.setItem("madar.lang", "en");
        localStorage.setItem("madar.theme", "light");
        sessionStorage.setItem("madar.onboarding.skip", "1");
      });
      if (replay) await serveReplay(ctx);
      await ctx.addInitScript(probe);
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      try {
        if (s.load) {
          if (!firstVisit) {
            await page.goto(base + s.load);
            await page.waitForLoadState("networkidle").catch(() => {});
            await page.goto("about:blank");
          }
          await cdp.send("Emulation.setCPUThrottlingRate", { rate });
          await page.goto(base + s.load);
          await page.waitForTimeout(rate === 4 ? 7000 : 4000);
          if (process.env.LAT_DEBUG) {
            await page.screenshot({ path: `${out}.${s.name}.png` });
            console.log(await page.evaluate(() => ({ url: location.href, responses: window.__lat.responses.length, els: window.__lat.els.size })));
            console.log(await page.evaluate(() => [...window.__lat.els.entries()].map(([el, r]) => `${r.kind} at ${Math.round(r.at)} legible +${Math.round((r.legible ?? 0) - r.at)} data ${Math.round(r.data ?? -1)} "${(el.textContent ?? "").trim().slice(0, 24)}"`).join("\n")));
          }
        } else {
          await page.goto(base + s.start);
          await page.waitForLoadState("networkidle").catch(() => {});
          await page.waitForTimeout(2500);
          await page.evaluate(() => window.__lat.reset());
          await cdp.send("Emulation.setCPUThrottlingRate", { rate });
          await s.act(page);
          await page.waitForTimeout(rate === 4 ? 5000 : 3000);
        }
        samples.push(await page.evaluate(() => window.__lat.result()));
      } catch (e) {
        samples.push({ error: String(e).split("\n")[0] });
      }
      await ctx.close();
    }
    const ok = samples.filter((x) => !x.error);
    const r = {
      items: median(ok.map((x) => x.items)),
      firstLegible: median(ok.map((x) => x.firstLegible)),
      lastLegible: median(ok.map((x) => x.lastLegible)),
      lastSettled: median(ok.map((x) => x.lastSettled)),
      holdMax: median(ok.map((x) => x.holdMax)),
      holdSwap: median(ok.map((x) => x.holdSwap)),
      pageLegible: median(ok.map((x) => x.page?.legible)),
      pageSettled: median(ok.map((x) => x.page?.settled)),
      fcp: s.load ? median(ok.map((x) => x.fcp)) : null,
      lcp: s.load ? median(ok.map((x) => x.lcp)) : null,
      quiet: s.load ? median(ok.map((x) => x.quiet)) : null,
      errors: samples.filter((x) => x.error).map((x) => x.error),
    };
    results[`${s.name}@${rate}x`] = r;
    console.log(
      `${(s.name + "@" + rate + "x").padEnd(28)} items ${String(r.items).padStart(3)}  legible first ${r.firstLegible}ms last ${r.lastLegible}ms  settled ${r.lastSettled}ms  hold≤${r.holdMax}ms swap≤${r.holdSwap}ms` +
        (r.fcp != null ? `  FCP ${r.fcp} LCP ${r.lcp} quiet ${r.quiet}` : "") +
        (r.pageLegible != null ? `  page legible ${r.pageLegible}ms settled ${r.pageSettled}ms` : "") +
        (r.errors.length ? `  errors ${r.errors.length}` : ""),
    );
  }
}
await browser.close();
writeFileSync(out, JSON.stringify(results, null, 2));
