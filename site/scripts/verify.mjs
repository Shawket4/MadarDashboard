// Checks the built site in a real browser.
//   npm run build && npm run verify            (CHROME_PATH=… to pick a browser)
//
// 1. Every page × language × width (WIDTHS=390,1440 to narrow, REDUCED=1 for reduced
//    motion). Fails on console errors, a horizontal scrollbar, a missing image, wrong
//    lang/dir, missing title/description/canonical/hreflang, or not exactly one <h1>.
//    Screenshots land in node_modules/.verify/ for a visual pass.
//    Also fails when a split heading's word would be cut off by its mask.
// 2. The flows, against two servers: one that opens folders (index.html), and one
//    that behaves like today's nginx on the VPS (`try_files $uri /get.html`, no
//    folder lookup): language pick, folder addresses, links, # addresses and # links,
//    404, pricing terms, sheet.
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");
const shots = path.resolve(here, "../node_modules/.verify");
await mkdir(shots, { recursive: true });

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".wasm": "application/wasm", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };
const isFile = (f) => stat(f).then((s) => s.isFile(), () => false);
const isDir = (f) => stat(f).then((s) => s.isDirectory(), () => false);

/** folders: "open" serves a folder's index.html (404.html otherwise); "nginx-today" mimics the VPS. */
function serve(folders) {
  const server = createServer(async (req, res) => {
    const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    let file = path.join(dist, p);
    let status = 200;
    if (folders === "open") {
      if (await isDir(file)) file = path.join(file, "index.html");
      if (!(await isFile(file))) { file = path.join(dist, "404.html"); status = 404; }
    } else if (p.startsWith("/assets/")) {
      if (!(await isFile(file))) { res.writeHead(404); res.end("404 Not Found"); return; }
    } else if (!(await isFile(file))) {
      file = path.join(dist, "get.html");
    }
    res.writeHead(status, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  });
  return new Promise((r) => server.listen(0, () => r({ server, base: `http://localhost:${server.address().port}` })));
}

const exe = process.env.CHROME_PATH ?? (existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : { channel: "chrome" });
const problems = [];

// 1. Pages ─────────────────────────────────────────────────────────────────────────
const open = await serve("open");
const pages = ["", "features/", "pricing/", "faq/", "about/"];
const widths = (process.env.WIDTHS ?? "390,768,1280,1440").split(",").map(Number);
let views = 0;
for (const lang of ["en", "ar"]) {
  for (const p of pages) {
    for (const w of widths) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(`${open.base}/${lang}/${p}`, { waitUntil: "networkidle" });
      // Walk down the page so lazy images and scroll scenes run.
      await page.evaluate(async () => {
        const step = Math.round(innerHeight * 0.8);
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
        scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 300));
      });
      // Let the lazy images the walk started finish, so the screenshots show them.
      await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 10000 }).catch(() => {});
      const r = await page.evaluate(() => {
        const d = document.documentElement;
        return {
          lang: d.lang,
          dir: d.dir,
          overflow: d.scrollWidth - innerWidth,
          broken: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
          h1: document.querySelectorAll("h1").length,
          title: document.title,
          desc: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
          hreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
        };
      });
      // Split headings: every word's ink inside its (padded) mask, so no descender,
      // Arabic tail or mark is cut off while the words rise or after they land.
      const cut = await page.evaluate(() => {
        const c = document.createElement("canvas").getContext("2d");
        const bad = [];
        for (const mask of document.querySelectorAll(".split-word-mask")) {
          const word = mask.firstElementChild;
          if (!word?.textContent) continue;
          const cs = getComputedStyle(word);
          c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          c.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
          c.direction = cs.direction;
          const m = c.measureText(word.textContent);
          const ms = getComputedStyle(mask);
          const r = mask.getBoundingClientRect();
          const baseline = r.top + parseFloat(ms.paddingTop) + (parseFloat(cs.lineHeight) - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
          const x = cs.direction === "rtl" ? r.right - parseFloat(ms.paddingRight) : r.left + parseFloat(ms.paddingLeft);
          const over = Math.max(r.top - (baseline - m.actualBoundingBoxAscent), baseline + m.actualBoundingBoxDescent - r.bottom, r.left - (x - m.actualBoundingBoxLeft), x + m.actualBoundingBoxRight - r.right);
          if (over > 0.5) bad.push(`"${word.textContent}" by ${over.toFixed(1)}px`);
        }
        return bad;
      });
      const tag = `${lang}/${p || "home/"}@${w}`;
      if (cut.length) problems.push(`${tag}: heading text cut off: ${cut.slice(0, 4).join(", ")}`);
      if (r.lang !== lang) problems.push(`${tag}: lang=${r.lang}`);
      if (r.dir !== (lang === "ar" ? "rtl" : "ltr")) problems.push(`${tag}: dir=${r.dir}`);
      if (r.overflow > 1) problems.push(`${tag}: horizontal overflow ${r.overflow}px`);
      if (r.broken.length) problems.push(`${tag}: broken images ${r.broken.join(", ")}`);
      if (r.h1 !== 1) problems.push(`${tag}: ${r.h1} <h1>`);
      if (!r.title || !r.desc || !r.canonical || r.hreflang < 3) problems.push(`${tag}: meta missing`);
      if (errors.length) problems.push(`${tag}: console ${errors.slice(0, 3).join(" | ")}`);
      if (w === 390 || w === 1440) await page.screenshot({ path: path.join(shots, `${lang}-${(p || "home/").replace("/", "")}-${w}.jpg`), fullPage: true, type: "jpeg", quality: 60 });
      await ctx.close();
      views++;
    }
  }
}
open.server.close();

// 2. Flows ─────────────────────────────────────────────────────────────────────────
for (const folders of ["open", "nginx-today"]) {
  const { server, base } = await serve(folders);
  const check = (ok, what) => { if (!ok) problems.push(`flow (${folders}): ${what}`); };
  const visit = async (url, locale = "en-US") => {
    const ctx = await browser.newContext({ locale, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + url, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    return { ctx, page, errors, path: new URL(page.url()).pathname, lang: await page.evaluate(() => document.documentElement.lang) };
  };

  let v = await visit("/", "ar-EG");
  check(v.path === "/ar/" && v.lang === "ar", `root in Arabic → ${v.path} (${v.lang})`);
  await v.ctx.close();

  v = await visit("/?utm_source=x", "en-GB");
  check(v.path === "/en/" && v.lang === "en" && v.page.url().includes("utm_source=x"), `root in English keeps the query → ${v.page.url()}`);
  await v.ctx.close();

  v = await visit("/ar/pricing/");
  check(v.path === "/ar/pricing/" && v.lang === "ar", `folder address /ar/pricing/ → ${v.path}`);
  // Links work whichever way the server answers: follow one.
  await v.page.locator('header a[href*="/ar/faq/"]').filter({ visible: true }).first().click();
  await v.page.waitForLoadState("networkidle");
  await v.page.waitForTimeout(300);
  const faqPath = new URL(v.page.url()).pathname;
  check(faqPath === "/ar/faq/" && (await v.page.evaluate(() => document.querySelectorAll("details").length)) > 5, `nav link to FAQ → ${faqPath}`);
  check(!v.errors.length, `errors ${v.errors.join(" | ")}`);
  await v.ctx.close();

  v = await visit("/en/no-such-page/");
  check((await v.page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute("content"))) === "noindex" && /404/.test(await v.page.content()), `missing page → ${v.path}`);
  await v.ctx.close();

  // A # address (a link from another page) and a # link on the page land on their
  // section, and what's there is showing: nothing waits on what the jump passed.
  const landing = (id) => v.page.evaluate((id) => {
    const t = document.getElementById(id);
    const hidden = Array.from(document.querySelectorAll("[data-reveal], [data-split]")).filter((e) => {
      const r = e.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight * 0.8 && Number(getComputedStyle(e).opacity) < 0.9;
    }).length;
    return { path: location.pathname, hash: location.hash, top: Math.round(t?.getBoundingClientRect().top ?? -1), hidden };
  }, id);
  v = await visit("/en/features/#loyalty");
  await v.page.waitForTimeout(1200);
  let at = await landing("loyalty");
  check(at.path === "/en/features/" && at.hash === "#loyalty" && at.top > 0 && at.top < 260 && at.hidden === 0, `# address → ${JSON.stringify(at)}`);
  await v.ctx.close();

  v = await visit("/en/");
  const card = v.page.locator('a.card[href="#stage-rush"]').first();
  await card.scrollIntoViewIfNeeded();
  await v.page.waitForTimeout(500);
  await card.click();
  await v.page.waitForTimeout(2200);
  at = await landing("stage-rush");
  check(at.hash === "#stage-rush" && Math.abs(at.top - 88) < 6 && at.hidden === 0, `# link on the page → ${JSON.stringify(at)}`);
  await v.ctx.close();

  // The pricing terms switch both plans.
  v = await visit("/en/pricing/");
  await v.page.click("[data-terms] label:last-child");
  await v.page.waitForTimeout(1400);
  const prices = await v.page.$$eval("[data-price-block] .price-term:not([hidden]) .font-mono", (els) => els.map((e) => e.textContent?.trim()));
  check(prices.join(",") === "30,000,35,000", `yearly prices → ${prices.join(",")}`);
  // "Talk to us" opens the contact sheet.
  await v.page.locator("header [data-open-contact]").filter({ visible: true }).first().click();
  check(await v.page.evaluate(() => document.getElementById("contact-dialog")?.open === true), "contact sheet opens");
  await v.ctx.close();
  server.close();
}

await browser.close();
if (problems.length) {
  console.log(`✗ ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ ${views} page views, and the flows on both server setups, clean`);
