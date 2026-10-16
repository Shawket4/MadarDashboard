// Play probe (positive motion check). For cold loads, route changes, a dialog,
// a sheet and a tab switch, at 4x CPU throttle on phone and desktop, it counts
// the elements that actually animated (computed opacity and/or transform took
// at least 3 different values across frames) and the "ghosts" (painted
// visible, then hidden, then animated back in). Every scenario must have its
// main content animate, with zero ghosts. Saves screencast frames per scenario.
//   node play-probe.mjs <baseUrl> <outDir> [--only=name] [--no-frames] [--reduced]
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
const frames = !process.argv.includes("--no-frames");
const reduced = process.argv.includes("--reduced");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
mkdirSync(out, { recursive: true });

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };

const go = (to) => (page) =>
  page.evaluate((path) => {
    history.pushState({}, "", path);
    dispatchEvent(new PopStateEvent("popstate"));
  }, to);
const click = (selector) => (page) => page.locator(selector).first().click({ timeout: 5000 });

const SCENARIOS = [
  { name: "load-home", load: "/" },
  { name: "load-orders", load: "/orders" },
  { name: "load-reports", load: "/reports/operations" },
  { name: "load-settings", load: "/settings" },
  { name: "load-floor", load: "/floor" },
  { name: "load-signin", load: "/login", signedOut: true },
  { name: "load-signup", load: "/signup", signedOut: true },
  { name: "nav-home-orders", start: "/", act: go("/orders") },
  { name: "nav-orders-reports", start: "/orders", act: go("/reports/operations") },
  { name: "nav-home-settings", start: "/", act: go("/settings") },
  { name: "nav-home-floor", start: "/", act: go("/floor") },
  { name: "dialog-new-booking", start: "/bookings", act: click('button:has-text("New booking")') },
  { name: "sheet-order", start: "/orders", act: click("table tbody tr, [data-slot=list-card] > *") },
  { name: "tab-reports", start: "/reports/operations", act: click('[role=tab][data-state=inactive]') },
];

function detector() {
  const t0 = performance.now();
  const frameTimes = [];
  const touched = new Set();
  const drawnAt = new WeakMap();
  const samples = new Map(); // el -> Set of "opacity|transform"
  const opacityOf = (style) => {
    const m = /opacity:\s*([\d.]+)/.exec(style ?? "");
    return m ? parseFloat(m[1]) : 1;
  };
  const sample = (el) => {
    if (!el.isConnected) return;
    const cs = getComputedStyle(el);
    let set = samples.get(el);
    if (!set) samples.set(el, (set = new Set()));
    set.add(`${(+cs.opacity).toFixed(2)}|${cs.transform}`);
  };
  const loop = (t) => {
    frameTimes.push(t);
    for (const el of touched) {
      drawnAt.set(el, opacityOf(el.getAttribute("style")));
      sample(el);
    }
    // Web Animations (not CSS loops or hover transitions).
    for (const a of document.getAnimations()) {
      if (a.constructor.name === "CSSAnimation" || a.constructor.name === "CSSTransition") continue;
      const el = a.effect?.target;
      if (el) {
        touched.add(el);
        sample(el);
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const connected = new WeakMap();
  const connectedAt = (el) => {
    for (let n = el; n; n = n.parentElement) if (connected.has(n)) return connected.get(n);
    return 0;
  };
  const ghosts = [];
  const ghostEls = [];
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
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 4).join(" ");
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}.${cls} "${text}"`;
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
      const before = drawnAt.has(el) ? drawnAt.get(el) : 1;
      touched.add(el);
      if (!(before > 0.6 && after < 0.6) || painted === 0 || !visibleNow(el)) continue;
      ghostEls.push(el);
      ghosts.push({ at: Math.round(now - t0), what: describe(el) });
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"], attributeOldValue: true });
  const CONTENT = "[data-page-width], [role=dialog], [role=alertdialog], main";
  window.__probe = {
    reset() {
      ghosts.length = 0;
      ghostEls.length = 0;
      samples.clear();
    },
    result() {
      let animated = 0;
      let content = 0;
      const examples = [];
      for (const [el, set] of samples) {
        if (set.size < 3) continue;
        animated++;
        if (el.closest?.(CONTENT)) {
          content++;
          if (examples.length < 3) examples.push(describe(el));
        }
      }
      return { animated, content, examples, ghosts: ghosts.filter((_, i) => ghostEls[i].isConnected) };
    },
  };
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

async function newPage(vp, signedOut) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], reducedMotion: reduced ? "reduce" : "no-preference" });
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
  return { ctx, page, cdp: await ctx.newCDPSession(page) };
}

async function record(cdp, name, ms) {
  if (!frames) return async () => 0;
  const shots = [];
  const onFrame = async (f) => {
    shots.push({ t: f.metadata.timestamp, data: f.data });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  };
  cdp.on("Page.screencastFrame", onFrame);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 55, everyNthFrame: 1, maxWidth: 720, maxHeight: 900 });
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
  for (const s of SCENARIOS.filter((x) => !only || x.name.startsWith(only))) {
    const { ctx, page, cdp } = await newPage(vp, s.signedOut);
    const key = `${s.name}.${vp}`;
    try {
      if (s.load) {
        // Warm Vite's module graph once, then a cold load at 4x.
        await page.goto(base + s.load);
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.goto("about:blank");
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        const stop = await record(cdp, `${s.name}-${vp}`, 6000);
        await page.goto(base + s.load);
        await page.waitForTimeout(6000);
        results[key] = { ...(await page.evaluate(() => window.__probe.result())), frames: await stop() };
      } else {
        await page.goto(base + s.start);
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(3000);
        await page.evaluate(() => window.__probe.reset());
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        const stop = await record(cdp, `${s.name}-${vp}`, 2500);
        await s.act(page);
        await page.waitForTimeout(2500);
        results[key] = { ...(await page.evaluate(() => window.__probe.result())), frames: await stop() };
      }
    } catch (e) {
      results[key] = { error: String(e).split("\n")[0].slice(0, 160) };
    }
    await ctx.close();
  }
}
await browser.close();
writeFileSync(`${out}/play.json`, JSON.stringify(results, null, 2));
let failed = 0;
for (const [k, v] of Object.entries(results)) {
  if (v.error) {
    console.log(`${k}: ERROR ${v.error}`);
    failed++;
    continue;
  }
  const ok = (reduced || v.content > 0) && v.ghosts.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${k}: animated ${v.animated} (content ${v.content}), ghosts ${v.ghosts.length}  ${v.examples[0] ?? ""}`);
}
console.log(failed ? `${failed} scenario(s) failed` : "all scenarios animate, no ghosts");
