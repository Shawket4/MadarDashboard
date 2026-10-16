// Motion verification harness (see MOTION_HANDOFF.md). Run against a mock dev
// server (`npm run dev:mock`). Needs Playwright's Chromium: `npx playwright install chromium`
// (or point CHROME_PATH at a Chromium/headless-shell binary).
import { createRequire } from "node:module";
const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");
const [base, out, lang = "en"] = process.argv.slice(2);
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript((l) => { sessionStorage.setItem("madar.onboarding.skip", "1"); localStorage.setItem("madar.lang", l); }, lang);
const p = await ctx.newPage();
await p.goto(base + "/");
await p.waitForTimeout(5000);
const cdp = await ctx.newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const res = {};
for (const label of ["collapse", "expand"]) {
  await p.evaluate(() => { window.__f = []; let last = performance.now(); const t = (n) => { window.__f.push(n - last); last = n; if (window.__f.length < 200) window.__r = requestAnimationFrame(t); }; window.__r = requestAnimationFrame(t); });
  await p.keyboard.press("Meta+b");
  await p.waitForTimeout(160);
  await p.screenshot({ path: `${out}-${lang}-${label}-mid.png` });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}-${lang}-${label}-end.png` });
  const f = await p.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f.slice(1, 60); });
  const s = [...f].sort((a, b) => a - b);
  res[label] = { frames: f.length, p95: +s[Math.floor(s.length * 0.95)].toFixed(1), max: +s[s.length - 1].toFixed(1), over34: f.filter((x) => x > 34).length };
}
console.log(lang, JSON.stringify(res));
await b.close();
