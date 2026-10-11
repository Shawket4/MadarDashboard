#!/usr/bin/env node
// Load pages in headless Chromium and list every Content-Security-Policy
// violation (enforced or report-only) and console error. Exit 1 on any
// violation.
//
//   node scripts/csp-check.mjs https://order.madar-pos.cloud/<org>      # the live headers
//   node scripts/csp-check.mjs --inject public  http://localhost:4173/  # a page before it ships
//   node scripts/csp-check.mjs --inject dashboard https://madar-pos.cloud/
//
// --inject reads the policy from deploy/nginx/madar-csp-<name>.conf (the file
// nginx includes, so the check tests exactly what is served) and enforces it
// on every document of the page's own host. The dashboard's snippet is
// report-only; injected, it is enforced, which is stricter.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const args = process.argv.slice(2);
let policy = null;
const at = args.indexOf("--inject");
if (at >= 0) {
  const name = args.splice(at, 2)[1];
  const file = join(dirname(fileURLToPath(import.meta.url)), `../deploy/nginx/madar-csp-${name}.conf`);
  const m = readFileSync(file, "utf8").match(/add_header Content-Security-Policy(?:-Report-Only)? "([^"]*)"/);
  if (!m) throw new Error(`no policy in ${file}`);
  // report-uri is meaningless here; the violations are read in the page.
  policy = m[1].replace(/;\s*report-uri [^;]*/, "");
}
if (args.length === 0) {
  console.error("usage: node scripts/csp-check.mjs [--inject public|dashboard] <url>...");
  process.exit(2);
}

const browser = await chromium.launch();
let total = 0;
for (const url of args) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const host = new URL(url).host;
  if (policy) {
    await page.route("**/*", async (route) => {
      const req = route.request();
      if (new URL(req.url()).host !== host || req.resourceType() !== "document") return route.continue();
      const resp = await route.fetch();
      await route.fulfill({ response: resp, headers: { ...resp.headers(), "content-security-policy": policy } });
    });
  }
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.__csp.push(`${e.disposition} ${e.violatedDirective} ${e.blockedURI} @ ${e.sourceFile}:${e.lineNumber}`),
    );
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`));
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch((e) => errors.push(`goto: ${e.message}`));
  await page.waitForTimeout(2_500);
  const violations = await page.evaluate(() => window.__csp).catch(() => []);
  total += violations.length;
  console.log(`\n${url}\n  violations: ${violations.length ? `\n    ${violations.join("\n    ")}` : "none"}`);
  for (const e of errors) console.log(`  console: ${e}`);
  await ctx.close();
}
await browser.close();
process.exit(total ? 1 : 0);
