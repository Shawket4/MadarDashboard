// Basira scroll probe: the transcript must scroll inside its own pane, never
// the document. Run against `npm run dev:mock`:
//   node scripts/motion-harness/basira-scroll-probe.mjs http://localhost:5180 <outDir>
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let failed = false;

for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "phone", width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  // Requests the mock has no handler for fall through to the real API base;
  // a 401 from there signs the mock session out. Answer them empty instead.
  await ctx.route(/localhost:8081\//, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  const page = await ctx.newPage();
  await page.goto(`${base}/basira`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  // Stand in for a long conversation: 3000px of transcript.
  const m = await page.evaluate(() => {
    const pane = document.querySelector("[data-basira-transcript]");
    if (!pane) return { missing: true };
    const filler = document.createElement("div");
    filler.style.height = "3000px";
    pane.firstElementChild.appendChild(filler);
    return {
      docScroll: document.scrollingElement.scrollHeight - window.innerHeight,
      paneScroll: pane.scrollHeight - pane.clientHeight,
      composerBottom: document.querySelector("textarea")?.getBoundingClientRect().bottom ?? null,
      vh: window.innerHeight,
    };
  });
  if (m.missing) { console.log(vp.name, "transcript pane not found"); failed = true; continue; }
  // A wheel over the transcript must move the transcript.
  const box = await page.locator("[data-basira-transcript]").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => document.querySelector("[data-basira-transcript]").scrollTop);
  const ok = m.docScroll <= 1 && m.paneScroll > 0 && after > 0 && m.composerBottom !== null && m.composerBottom <= m.vh;
  console.log(vp.name, JSON.stringify({ ...m, paneScrollTopAfterWheel: after }), ok ? "OK" : "FAIL");
  if (!ok) failed = true;
  await page.screenshot({ path: `${out}/basira-${vp.name}.png` });
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
