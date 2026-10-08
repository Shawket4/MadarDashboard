// Checks the built site in a real browser.
//   npm run build && npm run verify            (CHROME_PATH=… to pick a browser)
//
// 1. Every page × language × width, and the root page (WIDTHS=390,1440 to narrow,
//    REDUCED=1 for reduced motion). Fails on console errors, a horizontal scrollbar, a missing image, wrong
//    lang/dir, missing title/description/canonical/hreflang, or not exactly one <h1>.
//    Screenshots land in node_modules/.verify/ for a visual pass.
//    Also fails when a split heading's word would be cut off by its mask.
// 2. The flows, against two servers: one that opens folders (index.html), and one
//    that behaves like the get vhost on the VPS (deploy/nginx/get.madar-pos.cloud):
//    / serves get.html, …/index.html, …/<folder>.html and folder addresses without the
//    slash 301 to the folder address, /pricing, /about and the other short addresses
//    301 to their pages, unknown paths are a real 404 with 404.html (404.md for
//    Accept: text/markdown), and Accept: text/markdown gets a folder's index.md. The
//    root page (a page, never a redirect), folder addresses, links, # addresses and #
//    links, 404, pricing terms, sheet, and (nginx) the redirects, the Markdown
//    versions and llms.txt.
//    (1 and 2 run without the service worker: they check the pages and the servers.)
//    SERVE=1 npm run verify starts only the nginx mimic, for curl and Lighthouse.
// 3. The archive (sw/sw.ts): a first visit unpacks it; after that, pages in both
//    languages reach the server for nothing but the browser's own update check; and
//    with the server gone, every page opens whole, and an unknown one gets the 404.
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

const types = { ".md": "text/markdown; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".wasm": "application/wasm", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };
const isFile = (f) => stat(f).then((s) => s.isFile(), () => false);
const isDir = (f) => stat(f).then((s) => s.isDirectory(), () => false);

/** The get vhost's short addresses (deploy/nginx/get.madar-pos.cloud). */
const LEGAL = "https://legal.madar-pos.cloud";
const ALIASES = {
  pricing: "/en/pricing/", features: "/en/features/", faq: "/en/faq/", about: "/en/about/", contact: "/en/contact/",
  privacy: `${LEGAL}/privacy-policy.html`, terms: `${LEGAL}/terms-of-service.html`,
};

/**
 * folders: "open" serves a folder's index.html (404.html otherwise); "nginx" mimics the
 * get vhost. `seen` collects the paths asked for; `down()` drops every connection from
 * then on, as if the network were gone.
 */
function serve(folders, port = 0) {
  const seen = [];
  let gone = false;
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const p = decodeURIComponent(url.pathname);
    if (gone) return void req.socket.destroy();
    seen.push(p);
    const md = /text\/markdown/i.test(req.headers.accept ?? "");
    let file = path.join(dist, p);
    let status = 200;
    const redirect = (to) => { res.writeHead(301, { location: to.startsWith("/") ? to + url.search : to }); res.end(); };
    if (folders === "open") {
      if (await isDir(file)) file = path.join(file, "index.html");
      if (!(await isFile(file))) { file = path.join(dist, "404.html"); status = 404; }
    } else {
      const alias = ALIASES[/^\/([a-z]+)\/?$/.exec(p)?.[1] ?? ""];
      const html = /^(\/.+)\.html$/.exec(p)?.[1];
      if (alias) return redirect(alias);
      if (html && (await isDir(path.join(dist, html)))) return redirect(`${html}/`);
      if (/\/index\.html$/.test(p)) return redirect(p.slice(0, -10));
      if (p === "/") file = path.join(dist, md && (await isFile(path.join(dist, "index.md"))) ? "index.md" : "get.html");
      else if (!p.endsWith("/") && (await isDir(file))) return redirect(`${p}/`);
      else if (await isFile(file)) { /* the file itself */ }
      else if (p.endsWith("/") && md && (await isFile(path.join(file, "index.md")))) file = path.join(file, "index.md");
      else if (p.endsWith("/") && (await isFile(path.join(file, "index.html")))) file = path.join(file, "index.html");
      else { file = path.join(dist, md ? "404.md" : "404.html"); status = 404; }
    }
    const vary = folders === "nginx" && !p.startsWith("/assets/") ? { vary: "Accept" } : {};
    res.writeHead(status, { "content-type": types[path.extname(file)] ?? "application/octet-stream", ...vary });
    res.end(await readFile(file));
  });
  return new Promise((r) => server.listen(port, () => r({ server, base: `http://localhost:${server.address().port}`, seen, down: () => void (gone = true) })));
}

// SERVE=1: only the get-vhost mimic, for curl or Lighthouse (PORT=… to pick the port).
if (process.env.SERVE) {
  console.log(`get vhost mimic: ${(await serve("nginx", Number(process.env.PORT ?? 0))).base}`);
  await new Promise(() => {});
}

const exe = process.env.CHROME_PATH ?? (existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : { channel: "chrome" });
const problems = [];

// 1. Pages ─────────────────────────────────────────────────────────────────────────
const open = await serve("open");
const pages = ["", "features/", "pricing/", "faq/", "about/", "contact/"];
const widths = (process.env.WIDTHS ?? "390,768,1280,1440").split(",").map(Number);
// The root page (both languages, <html lang="en">), then every language page.
const targets = [
  { lang: "en", url: "/", name: "root", shot: "root" },
  ...["en", "ar"].flatMap((lang) => pages.map((p) => ({ lang, url: `/${lang}/${p}`, name: `${lang}/${p || "home/"}`, shot: `${lang}-${(p || "home/").replace("/", "")}` }))),
];
let views = 0;
for (const { lang, url, name, shot } of targets) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference", serviceWorkers: "block" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(open.base + url, { waitUntil: "networkidle" });
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
    const tag = `${name}@${w}`;
    if (cut.length) problems.push(`${tag}: heading text cut off: ${cut.slice(0, 4).join(", ")}`);
    if (r.lang !== lang) problems.push(`${tag}: lang=${r.lang}`);
    if (r.dir !== (lang === "ar" ? "rtl" : "ltr")) problems.push(`${tag}: dir=${r.dir}`);
    if (r.overflow > 1) problems.push(`${tag}: horizontal overflow ${r.overflow}px`);
    if (r.broken.length) problems.push(`${tag}: broken images ${r.broken.join(", ")}`);
    if (r.h1 !== 1) problems.push(`${tag}: ${r.h1} <h1>`);
    if (!r.title || !r.desc || !r.canonical || r.hreflang < 3) problems.push(`${tag}: meta missing`);
    if (errors.length) problems.push(`${tag}: console ${errors.slice(0, 3).join(" | ")}`);
    if (w === 390 || w === 1440) await page.screenshot({ path: path.join(shots, `${shot}-${w}.jpg`), fullPage: true, type: "jpeg", quality: 60 });
    await ctx.close();
    views++;
  }
}
open.server.close();

// 2. Flows ─────────────────────────────────────────────────────────────────────────
for (const folders of ["open", "nginx"]) {
  const { server, base } = await serve(folders);
  const check = (ok, what) => { if (!ok) problems.push(`flow (${folders}): ${what}`); };
  const visit = async (url, locale = "en-US") => {
    const ctx = await browser.newContext({ locale, viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + url, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    return { ctx, page, errors, path: new URL(page.url()).pathname, lang: await page.evaluate(() => document.documentElement.lang) };
  };

  // The root is a page in both languages: it stays put whatever the browser's
  // language (no script, no refresh), and its buttons lead to /en/ and /ar/.
  let v = await visit("/", "ar-EG");
  const root = await v.page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    main: document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim().length ?? 0,
    ar: document.querySelectorAll('section[lang="ar"][dir="rtl"] h2').length,
    refresh: !!document.querySelector('meta[http-equiv="refresh" i]'),
  }));
  check(v.path === "/" && v.lang === "en" && root.h1 === 1 && root.main > 1200 && root.ar === 1 && !root.refresh, `root page in an Arabic browser → ${v.path} ${JSON.stringify(root)}`);
  await v.page.click('main nav a[hreflang="ar"]');
  await v.page.waitForLoadState("networkidle");
  check(new URL(v.page.url()).pathname === "/ar/", `root's Arabic button → ${v.page.url()}`);
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

  if (folders === "nginx") {
    // The redirects, the Markdown versions and llms.txt, as the VPS serves them.
    const get = (u, accept) => fetch(base + u, { redirect: "manual", headers: accept ? { accept } : {} });
    let r = await get("/en/pricing/index.html");
    check(r.status === 301 && r.headers.get("location") === "/en/pricing/", `/en/pricing/index.html → ${r.status} ${r.headers.get("location")}`);
    r = await get("/ar/pricing");
    check(r.status === 301 && r.headers.get("location") === "/ar/pricing/", `/ar/pricing → ${r.status} ${r.headers.get("location")}`);
    for (const [u, needle] of [["/en/pricing/", "3,000 EGP"], ["/ar/faq/", "### "], ["/", "](https://get.madar-pos.cloud/ar/)"]]) {
      r = await get(u, "text/markdown, text/html;q=0.9");
      const body = await r.text();
      check(r.ok && /text\/markdown/.test(r.headers.get("content-type") ?? "") && body.includes(needle), `Markdown for ${u} → ${r.status} ${r.headers.get("content-type")}`);
    }
    for (const u of ["/llms.txt", "/llms-full.txt", "/robots.txt", "/sitemap.xml"]) {
      r = await get(u);
      check(r.ok, `${u} → ${r.status}`);
    }
    r = await get("/no-such-page");
    check(r.status === 404 && /text\/html/.test(r.headers.get("content-type") ?? ""), `unknown path → ${r.status} ${r.headers.get("content-type")}`);
    // The root as HTML (a page, not a hop), and both answers vary by Accept.
    r = await get("/", "text/html");
    let body = await r.text();
    check(r.ok && /text\/html/.test(r.headers.get("content-type") ?? "") && r.headers.get("vary") === "Accept" && (body.match(/<h1[\s>]/g) ?? []).length === 1 && !/http-equiv="refresh"/i.test(body), `/ as HTML → ${r.status} ${r.headers.get("content-type")} vary=${r.headers.get("vary")}`);
    r = await get("/", "text/markdown");
    check(r.headers.get("vary") === "Accept", `/ as Markdown varies by Accept → ${r.headers.get("vary")}`);
    // An unknown address asked for as Markdown: 404, the Markdown 404.
    r = await get("/no-such-page", "text/markdown");
    body = await r.text();
    check(r.status === 404 && r.headers.get("content-type") === "text/markdown; charset=utf-8" && r.headers.get("vary") === "Accept" && body.includes("/llms.txt") && body.includes("/ar/"), `unknown path as Markdown → ${r.status} ${r.headers.get("content-type")}`);
    // Short addresses, and …/<folder>.html, 301 to the page.
    for (const [u, to] of [
      ["/pricing", "/en/pricing/"], ["/pricing/", "/en/pricing/"], ["/features", "/en/features/"], ["/faq/", "/en/faq/"],
      ["/about", "/en/about/"], ["/contact/", "/en/contact/"],
      ["/privacy", `${LEGAL}/privacy-policy.html`], ["/terms/", `${LEGAL}/terms-of-service.html`],
      ["/en/pricing.html", "/en/pricing/"], ["/ar/about.html", "/ar/about/"],
    ]) {
      r = await get(u);
      check(r.status === 301 && r.headers.get("location") === to, `${u} → ${r.status} ${r.headers.get("location")} (want ${to})`);
    }
    r = await get("/no-such-page.html");
    check(r.status === 404, `/no-such-page.html → ${r.status}`);
    r = await get("/get.html");
    check(r.status === 200, `a real .html file (/get.html) → ${r.status}`);
  }

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

// 3. The archive ───────────────────────────────────────────────────────────────────
{
  const { server, base, seen, down } = await serve("nginx");
  const check = (ok, what) => { if (!ok) problems.push(`archive: ${what}`); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  // (The missing page's own 404 is expected.)
  page.on("console", (m) => { if (m.type() === "error" && !m.location().url.includes("no-such-page")) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  const unpacked = async () => {
    for (let i = 0; i < 300; i++) {
      const done = await page.evaluate(async () => {
        for (const k of await caches.keys()) if (k.startsWith("madar-pack-") && (await (await caches.open(k)).match("/__madar-pack"))) return true;
        return false;
      }).catch(() => false);
      if (done) return true;
      await page.waitForTimeout(200);
    }
    return false;
  };
  const walk = async () => {
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.7)) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
    });
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
    return page.evaluate(() => Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).length);
  };

  await page.goto(`${base}/en/`, { waitUntil: "load" });
  check(await unpacked(), "a first visit never finished unpacking the archive");
  check(seen.filter((p) => p.startsWith("/assets/pack.")).length === 1, `the archive should come as one file: ${seen.filter((p) => p.startsWith("/assets/pack.")).join(", ")}`);

  seen.length = 0;
  for (const url of ["/en/features/", "/ar/", "/ar/pricing/", "/en/faq/"]) {
    await page.goto(base + url, { waitUntil: "load" });
    const broken = await walk();
    check(!broken, `${url}: ${broken} broken images`);
  }
  const asked = [...new Set(seen)].filter((p) => p !== "/sw.js");
  check(!asked.length, `after the archive, pages still asked the server for ${asked.slice(0, 5).join(", ")}`);

  down();
  for (const url of ["/en/", "/ar/features/", "/en/pricing/", "/ar/about/", "/en/no-such-page/"]) {
    const res = await page.goto(base + url, { waitUntil: "load" }).catch(() => null);
    const want = url.includes("no-such") ? 404 : 200;
    check(res?.status() === want, `offline ${url}: ${res?.status() ?? "no answer"} (want ${want})`);
    if (res?.status() === 200) {
      const broken = await walk();
      check(!broken, `offline ${url}: ${broken} broken images`);
    }
  }
  check(!errors.length, `console ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
  server.close();
}

await browser.close();
if (problems.length) {
  console.log(`✗ ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ ${views} page views, the flows on both server setups, and the archive online and offline, clean`);
