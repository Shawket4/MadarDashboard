// Share cards (1200×630) for every page in both languages → public/og/{lang}-{page}.jpg
// Rendered by a real browser so Arabic shapes correctly with the real fonts.
//   npm run og        (uses your installed Chrome, or CHROME_PATH=/path/to/chrome)
// Run it after changing a page title; the JPGs are committed, so CI doesn't need a browser.
import { chromium } from "playwright-core";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { en } from "../src/i18n/en.ts";
import { ar } from "../src/i18n/ar.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "..");
const out = path.join(site, "public/og");
const tmp = path.join(site, "node_modules/.og");
await mkdir(out, { recursive: true });
await mkdir(tmp, { recursive: true });

const font = (pkg, file) => pathToFileURL(path.join(site, "node_modules/@fontsource", pkg, "files", file)).href;
const shot = (lang, id) => {
  const p = path.join(site, "src/assets/shots", lang, `${id}.webp`);
  return pathToFileURL(existsSync(p) ? p : path.join(site, "src/assets/shots/en", `${id}.webp`)).href;
};
const svg = async (name) => (await readFile(path.join(site, "src/assets/brand", name), "utf8")).replace(/\swidth="[^"]*"\sheight="[^"]*"/, "");

const pages = {
  home: { copy: (c) => [c.hero.title, c.hero.sub], shot: "dash-recipe", frame: "browser" },
  features: { copy: (c) => [c.features.title, c.features.intro], shot: "dash-overview", frame: "browser" },
  pricing: { copy: (c) => [c.pricing.title, c.pricing.free.title], shot: "pos-close-till", frame: "ipad" },
  faq: { copy: (c) => [c.faq.title, c.faq.sub], shot: "order-track", frame: "iphone" },
  about: { copy: (c) => [c.about.title, c.about.partnerTitle], shot: "wallet-pass", frame: "iphone" },
};

const symbolPaper = await svg("symbol-reversed.svg");
const words = { en: await svg("wordmark-reversed.svg"), ar: await svg("arabic-plain-paper.svg") };

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : existsSync("/opt/pw-browsers") ? {} : { channel: "chrome" },
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

for (const [lang, c] of [["en", en], ["ar", ar]]) {
  for (const [key, cfg] of Object.entries(pages)) {
    const [title, sub] = cfg.copy(c);
    const rtl = lang === "ar";
    const shotBox =
      cfg.frame === "browser"
        ? `<div class="frame browser"><div class="bar"><i></i><i></i><i></i></div><img src="${shot(lang, cfg.shot)}"></div>`
        : `<div class="frame ${cfg.frame}"><img src="${shot(lang, cfg.shot)}"></div>`;
    const html = `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
      @font-face{font-family:Plex;font-weight:600;src:url(${font("ibm-plex-sans-arabic", "ibm-plex-sans-arabic-latin-600-normal.woff2")})}
      @font-face{font-family:Plex;font-weight:400;src:url(${font("ibm-plex-sans-arabic", "ibm-plex-sans-arabic-latin-400-normal.woff2")})}
      @font-face{font-family:PlexAr;font-weight:600;src:url(${font("ibm-plex-sans-arabic", "ibm-plex-sans-arabic-arabic-600-normal.woff2")})}
      @font-face{font-family:PlexAr;font-weight:400;src:url(${font("ibm-plex-sans-arabic", "ibm-plex-sans-arabic-arabic-400-normal.woff2")})}
      *{box-sizing:border-box;margin:0}
      svg{display:block}
      html,body{width:1200px;height:630px;overflow:hidden;background:#14181E}
      /* A clipping card rather than the body: in RTL, overflow on the body scrolls the viewport. */
      .card{position:relative;width:1200px;height:630px;overflow:hidden;color:#EFF3F4;font-family:${rtl ? "PlexAr,Plex" : "Plex,PlexAr"},sans-serif}
      .rings{position:absolute;inset-inline-end:-420px;top:-470px;width:1300px;height:1300px}
      .copy{position:absolute;inset-inline-start:72px;top:76px;width:${cfg.frame === "browser" ? 560 : 640}px}
      .logo{display:flex;align-items:center;gap:14px;height:44px}
      .logo .s{width:44px;height:44px}.logo .w{height:${rtl ? 38 : 30}px}.logo svg{height:100%;width:auto}
      h1{font-weight:600;font-size:${rtl ? 54 : 58}px;line-height:${rtl ? 1.3 : 1.04};letter-spacing:${rtl ? 0 : "-0.03em"};margin-top:64px}
      p{font-size:25px;line-height:1.45;color:#9AA6AD;margin-top:22px}
      .url{position:absolute;${rtl ? "right" : "left"}:72px;bottom:58px;font:500 20px/1 Plex,monospace;letter-spacing:.06em;color:#2E94A6;direction:ltr}
      .frame{position:absolute;overflow:hidden}
      .browser{inset-inline-end:-80px;top:120px;width:560px;border-radius:14px;background:#fff;box-shadow:0 30px 80px -20px rgba(0,0,0,.7)}
      .bar{height:30px;background:#e6ecee;display:flex;gap:7px;align-items:center;padding:0 12px}.bar i{width:9px;height:9px;border-radius:9px;background:#c2ccd1}
      .browser img{display:block;width:100%}
      .ipad{inset-inline-end:-60px;top:150px;width:470px;padding:11px;border-radius:26px;background:#0B0E12;box-shadow:0 0 0 1px #303842,0 30px 80px -20px rgba(0,0,0,.7)}
      .ipad img{display:block;width:100%;border-radius:15px}
      .iphone{inset-inline-end:90px;top:96px;width:250px;padding:9px;border-radius:40px;background:#0B0E12;box-shadow:0 0 0 1px #303842,0 30px 80px -20px rgba(0,0,0,.7)}
      .iphone img{display:block;width:100%;border-radius:32px}
    </style></head><body><main class="card">
      <svg class="rings" viewBox="0 0 1600 1600" fill="none"><g stroke="#EFF3F4" stroke-opacity=".1" stroke-width="2"><circle cx="800" cy="800" r="170"/><circle cx="800" cy="800" r="330"/><circle cx="800" cy="800" r="520"/><circle cx="800" cy="800" r="740"/></g><circle cx="800" cy="800" r="10" fill="#EFF3F4" fill-opacity=".85"/><circle cx="560" cy="540" r="13" fill="#0D6273"/></svg>
      ${shotBox}
      <div class="copy">
        <div class="logo"><span class="s">${symbolPaper}</span><span class="w">${words[lang]}</span></div>
        <h1>${title}</h1>
        <p>${sub}</p>
      </div>
      <div class="url">get.madar-pos.cloud</div>
    </main></body></html>`;
    const file = path.join(tmp, `${lang}-${key}.html`);
    await writeFile(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, `${lang}-${key}.jpg`), type: "jpeg", quality: 86 });
    console.log(`og/${lang}-${key}.jpg`);
  }
}
await browser.close();
