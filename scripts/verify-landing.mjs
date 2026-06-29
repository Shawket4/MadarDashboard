// Verify the rebuilt landing page across locale × theme × viewport.
// Captures full-page PNGs into /tmp/landing-verify/ for review (not shipped).
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:5181/landing";
const OUT = "/tmp/landing-verify";
fs.mkdirSync(OUT, { recursive: true });

function init(lang, theme) {
  return `
    try {
      localStorage.setItem('madar.theme', '${theme}');
      localStorage.setItem('i18nextLng', '${lang}');
      localStorage.setItem('madar.app', JSON.stringify({ state: { language: '${lang}' }, version: 0 }));
    } catch (e) {}
  `;
}

const browser = await chromium.launch();
const matrix = [
  { lang: "en", theme: "light", width: 1440, reduced: false, name: "en-light" },
  { lang: "ar", theme: "light", width: 1440, reduced: false, name: "ar-light" },
  { lang: "en", theme: "dark", width: 1440, reduced: false, name: "en-dark" },
  { lang: "en", theme: "light", width: 390, reduced: false, name: "en-light-mobile" },
  { lang: "en", theme: "light", width: 1440, reduced: true, name: "en-light-reduced" },
];

for (const m of matrix) {
  const ctx = await browser.newContext({
    viewport: { width: m.width, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: m.reduced ? "reduce" : "no-preference",
    colorScheme: m.theme,
  });
  await ctx.addInitScript(init(m.lang, m.theme));
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${m.name}.png`, fullPage: true });
  console.log(`${m.name}: saved` + (errors.length ? ` | ERRORS: ${errors.slice(0,3).join(" ¦ ")}` : " | no console errors"));
  await ctx.close();
}
await browser.close();
console.log("done →", OUT);
