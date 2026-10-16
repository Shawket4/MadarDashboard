// Load-flash probe (see MOTION_HANDOFF.md). Finds "ghost" first frames: an
// element painted visible for at least one frame, then hidden by an inline
// opacity (GSAP's from-state), then animated in. Records cold loads and route
// navigations at 4x CPU throttle, phone and desktop, and saves a screencast
// strip of the first ~600 ms of each.
//   node ghost-probe.mjs <baseUrl> <outDir> [--reduced] [--no-frames]
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
const reduced = process.argv.includes("--reduced");
const frames = !process.argv.includes("--no-frames");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
mkdirSync(out, { recursive: true });

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const LOADS = [
  { name: "home", path: "/" },
  { name: "orders", path: "/orders" },
  { name: "reports", path: "/reports/operations" },
  { name: "signin", path: "/login", signedOut: true },
  { name: "signup", path: "/signup", signedOut: true },
];
// Navigations: load `from`, wait until idle, then go to `to` client-side.
const NAVS = [
  { name: "home-to-orders", from: "/", to: "/orders" },
  { name: "orders-to-reports", from: "/orders", to: "/reports/operations" },
  { name: "reports-to-home", from: "/reports/operations", to: "/" },
];

// Runs in the page before any script.
function detector() {
  const t0 = performance.now();
  const frameTimes = [];
  // The opacity each touched element was last drawn at (sampled every frame).
  const touched = new Set();
  const drawnAt = new WeakMap();
  const loop = (t) => {
    frameTimes.push(t);
    for (const el of touched) drawnAt.set(el, opacityOf(el.getAttribute("style")));
    if (t - t0 < 4000) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const connected = new WeakMap();
  const connectedAt = (el) => {
    for (let n = el; n; n = n.parentElement) if (connected.has(n)) return connected.get(n);
    return 0;
  };
  const ghosts = [];
  const opacityOf = (style) => {
    const m = /opacity:\s*([\d.]+)/.exec(style ?? "");
    return m ? parseFloat(m[1]) : 1;
  };
  const visibleNow = (el) => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth)) return false;
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.05) return false;
    }
    return true;
  };
  const describe = (el) => {
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 5).join(" ");
    const slot = el.getAttribute("data-slot");
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 50);
    return `${el.tagName.toLowerCase()}${slot ? `[data-slot=${slot}]` : ""}.${cls} "${text}"`;
  };
  new MutationObserver((records) => {
    const now = performance.now();
    for (const r of records) {
      if (r.type === "childList") {
        for (const n of r.addedNodes) if (n.nodeType === 1) connected.set(n, now);
        continue;
      }
      const el = r.target;
      const after = opacityOf(el.getAttribute("style"));
      const since = connectedAt(el);
      const painted = frameTimes.filter((f) => f > since && f < now).length;
      // What the last drawn frame showed: a sampled inline opacity, or at rest.
      const before = drawnAt.has(el) ? drawnAt.get(el) : 1;
      touched.add(el);
      if (!(before > 0.6 && after < 0.6)) continue;
      if (painted === 0 || !visibleNow(el)) continue;
      ghosts.push({ at: Math.round(now - t0), shownFor: painted, connected: Math.round(since - t0), what: describe(el), from: before, to: after });
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"], attributeOldValue: true });
  window.__ghosts = ghosts;
  window.__navMark = () => (window.__navAt = Math.round(performance.now() - t0));
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

async function newPage(vp, signedOut) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], reducedMotion: reduced ? "reduce" : "no-preference", deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    localStorage.setItem("madar.lang", "en");
    localStorage.setItem("madar.theme", "light");
    sessionStorage.setItem("madar.onboarding.skip", "1");
  });
  if (signedOut) {
    await ctx.route(/\/src\/data\/api\/mock\/enable\.ts/, async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace(/useAuthStore\.getState\(\)\.signIn\([^)]*\);/, "");
      await route.fulfill({ response: res, body });
    });
  }
  await ctx.addInitScript(detector);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, cdp };
}

async function record(cdp, name, ms) {
  if (!frames) return () => Promise.resolve(0);
  const shots = [];
  const onFrame = async (f) => {
    shots.push({ t: f.metadata.timestamp, data: f.data });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  };
  cdp.on("Page.screencastFrame", onFrame);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 50, everyNthFrame: 1, maxWidth: 480, maxHeight: 900 });
  return async () => {
    await cdp.send("Page.stopScreencast").catch(() => {});
    cdp.off("Page.screencastFrame", onFrame);
    if (!shots.length) return 0;
    const start = shots[0].t;
    const keep = shots.filter((s) => (s.t - start) * 1000 <= ms);
    mkdirSync(`${out}/${name}`, { recursive: true });
    keep.forEach((s, i) => writeFileSync(`${out}/${name}/${String(i).padStart(3, "0")}-${Math.round((s.t - start) * 1000)}ms.jpg`, Buffer.from(s.data, "base64")));
    return keep.length;
  };
}

const results = {};
for (const vp of Object.keys(VIEWPORTS)) {
  for (const l of LOADS.filter((x) => !only || x.name === only)) {
    const { ctx, page, cdp } = await newPage(vp, l.signedOut);
    // Warm the dev server's module graph once so a cold load measures the app, not Vite.
    await page.goto(base + l.path);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.goto("about:blank");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const stop = await record(cdp, `load-${l.name}-${vp}`, 5000);
    await page.goto(base + l.path);
    await page.waitForTimeout(5000);
    const n = await stop();
    results[`load.${l.name}.${vp}`] = { frames: n, ghosts: await page.evaluate(() => window.__ghosts) };
    await ctx.close();
  }
  for (const nv of NAVS.filter((x) => !only || x.name.startsWith(only))) {
    const { ctx, page, cdp } = await newPage(vp, false);
    await page.goto(base + nv.from);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.__ghosts.splice(0));
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const stop = await record(cdp, `nav-${nv.name}-${vp}`, 1000);
    await page.evaluate((to) => {
      window.__navMark();
      history.pushState({}, "", to);
      dispatchEvent(new PopStateEvent("popstate"));
    }, nv.to);
    await page.waitForTimeout(2500);
    const n = await stop();
    results[`nav.${nv.name}.${vp}`] = { frames: n, ghosts: await page.evaluate(() => window.__ghosts) };
    await ctx.close();
  }
}
await browser.close();
writeFileSync(`${out}/ghosts.json`, JSON.stringify(results, null, 2));
for (const [k, v] of Object.entries(results)) {
  console.log(`${k}: ${v.ghosts.length} ghost(s), ${v.frames} frames`);
  for (const g of v.ghosts.slice(0, 6)) console.log(`   +${g.at}ms shown ${g.shownFor} frame(s) [${g.from}->${g.to}] ${g.what}`);
}
