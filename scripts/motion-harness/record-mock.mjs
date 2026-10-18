// Record a replay for latency-probe.mjs / tap-probe.mjs (`--replay=`): drive
// the mock dev server (`npm run dev:mock`, MSW) through the dashboard's pages
// and keep every API response it serves, plus the signed-in session's
// localStorage, as { ls, responses: [{ m, url, status, ct, body }] }.
//   node record-mock.mjs <mockBaseUrl> <out.json> [--api=https://api.madar-pos.cloud]
// Every sidebar target, every Settings pane, every Operations tab, and the
// first order's detail, at phone and desktop width, are visited.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
const api = process.argv.find((a) => a.startsWith("--api="))?.slice(6) ?? "https://api.madar-pos.cloud";

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const responses = new Map();
let ls = {};

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(() => {
    localStorage.setItem("madar.lang", "en");
    localStorage.setItem("madar.theme", "light");
    sessionStorage.setItem("madar.onboarding.skip", "1");
  });
  const page = await ctx.newPage();
  page.on("response", async (res) => {
    const url = res.url();
    if (!url.startsWith(api) || res.request().method() === "OPTIONS") return;
    const key = `${res.request().method()} ${url}`;
    if (responses.has(key)) return;
    try {
      responses.set(key, { m: res.request().method(), url, status: res.status(), ct: res.headers()["content-type"], body: await res.text() });
    } catch {
      /* a redirect or an aborted body */
    }
  });
  const settle = async () => {
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
  };
  await page.goto(base + "/");
  await settle();
  ls = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const targets = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => new URL(a.href).pathname))]);
  const settings = ["/settings/brand", "/settings/plan", "/settings/links", "/settings/payment-methods", "/settings/qr", "/settings/delivery", "/settings/delivery-zones", "/settings/kitchen-stations", "/settings/kitchen-routing", "/settings/bookings", "/settings/combos", "/settings/integrations", "/settings/loyalty", "/settings/staff-pool"];
  const ops = ["tables", "overview", "items", "tellers", "waiters", "branches"].map((t) => `/reports/operations?tab=${t}`);
  // With and without the branch: the scope is in the URL, and a request is keyed by it.
  const branch = await page.evaluate(() => new URL(location.href).searchParams.get("branchId"));
  const withScope = (p) => (branch ? `${p}${p.includes("?") ? "&" : "?"}branchId=${branch}&preset=today` : p);
  for (const p of [...targets, ...settings, ...ops, "/tills", "/orders"]) {
    await page.goto(base + withScope(p));
    await settle();
  }
  // An order's detail sheet.
  await page.goto(base + withScope("/orders"));
  await settle();
  await page.locator("[data-row]").first().click({ timeout: 5000 }).catch(() => {});
  await settle();
  await ctx.close();
}
await browser.close();
writeFileSync(out, JSON.stringify({ ls, responses: [...responses.values()] }));
console.log(`recorded ${responses.size} responses`);
