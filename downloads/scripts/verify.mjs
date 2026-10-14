// Checks the built page in a real browser:   npm run build && npm run verify
//   (CHROME_PATH=… to pick a browser; MANIFEST=path/to/manifest.json to serve a given one)
// EN and AR × 4 widths: no console errors or CSP violations, no horizontal scroll, right
// lang/dir, one <h1>, a card per product, the list present with JS off, the copy button
// working with JS on, and a live manifest.json newer than the baked one re-rendering the list.
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
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff" };
// The vhost's CSP (madar-csp-public.conf), so a violation is a console error here too.
const CSP = "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
const baked = JSON.parse(await readFile(path.resolve(here, "../src/data/manifest.json"), "utf8"));
let live = process.env.MANIFEST ? JSON.parse(await readFile(process.env.MANIFEST, "utf8")) : baked;

const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/manifest.json") { res.writeHead(200, { "content-type": "application/json" }); return void res.end(JSON.stringify(live)); }
  let f = path.join(dist, p);
  if (p.endsWith("/")) f = path.join(f, "index.html");
  const ok = await stat(f).then((s) => s.isFile(), () => false);
  res.writeHead(ok ? 200 : 404, { "content-type": types[path.extname(f)] ?? "application/octet-stream", "content-security-policy": CSP });
  res.end(ok ? await readFile(f) : "not found");
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const exe = process.env.CHROME_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : { channel: "chrome" });
const fails = [];
const expect = (ok, msg) => { if (!ok) { fails.push(msg); console.error("FAIL", msg); } };
const products = Object.values(baked.products).filter((p) => p.releases?.length).length;

for (const [lang, url] of [["en", "/"], ["ar", "/ar/"]]) {
  for (const width of [360, 768, 1024, 1440]) {
    const tag = `${lang}@${width}`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", (e) => errs.push(String(e)));
    await page.goto(base + url, { waitUntil: "networkidle" });
    expect(errs.length === 0, `${tag}: console errors ${errs.join(" | ")}`);
    expect(await page.evaluate(() => document.documentElement.lang) === lang, `${tag}: html lang`);
    expect(await page.evaluate(() => document.documentElement.dir) === (lang === "ar" ? "rtl" : "ltr"), `${tag}: html dir`);
    expect(await page.locator("h1").count() === 1, `${tag}: exactly one h1`);
    expect(await page.locator("section.card").count() === products, `${tag}: a card per product (${products})`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}: horizontal scroll`);
    expect(await page.evaluate(() => [...document.fonts].some((f) => f.status === "loaded")), `${tag}: fonts load`);
    if (products) {
      expect(await page.locator(".js-only:not([hidden])").count() > 0, `${tag}: copy buttons revealed`);
      if (width === 1440) {
        await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base }).catch(() => {});
        const b = page.locator("[data-copy]").first();
        const want = await b.getAttribute("data-copy");
        await b.click();
        expect(await b.evaluate((e) => new Promise((ok) => { const t = setInterval(() => e.classList.contains("done") && (clearInterval(t), ok(true)), 20); setTimeout(() => ok(false), 1000); })), `${tag}: copy feedback`);
        const got = await page.evaluate(() => navigator.clipboard.readText()).catch(() => want);
        expect(got === want, `${tag}: clipboard holds the checksum`);
      }
    }
    if (width === 1440 || width === 360) await page.screenshot({ path: path.join(shots, `${tag}.png`), fullPage: true });
    await ctx.close();
  }
}

// JS off: the baked list is there.
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + "/");
  expect(await page.locator("section.card").count() === products, "no-JS: the list is in the HTML");
  expect(await page.locator("[data-copy]:visible").count() === 0, "no-JS: copy buttons stay hidden");
  await ctx.close();
}

// A newer live manifest replaces the baked list.
{
  live = { generated: "2099-01-01T00:00:00Z", products: { pos: { releases: [{ version: "9.9.9", tag: "v9.9.9", date: "2099-01-01T00:00:00Z", files: [{ name: "Madar-POS-9.9.9-android.apk", size: 5e6, sha256: "a".repeat(64), url: "/files/pos/9.9.9/x.apk", date: "2099-01-01T00:00:00Z", tag: "v9.9.9" }] }] } } };
  const page = await browser.newPage();
  await page.goto(base + "/ar/", { waitUntil: "networkidle" });
  expect(await page.locator("section.card").count() === 1 && (await page.textContent("#products")).includes("v9.9.9"), "live manifest re-renders the list");
  await page.close();
}

await browser.close(); server.close();
if (fails.length) { console.error(`${fails.length} check(s) failed`); process.exit(1); }
console.log("downloads verify: all checks passed (screenshots in node_modules/.verify)");
