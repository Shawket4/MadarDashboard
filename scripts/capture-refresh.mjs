// Dashboard refresh screenshots — every authenticated route, across
// en/ar × light/dark × desktop/tablet/phone. Needs `npm run dev:mock` (5180).
//   node scripts/capture-refresh.mjs <outDir> [--routes=/orders,/menu/items]
//        [--langs=en,ar] [--themes=light,dark] [--sizes=desktop,tablet,phone]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:5180";
const args = Object.fromEntries(
  process.argv.slice(3).map((a) => {
    const [k, v] = a.replace(/^--/, "").split(/=(.*)/s);
    return [k, v.split(",")];
  }),
);
const OUT = path.resolve(process.argv[2] ?? "docs/design/shots");
mkdirSync(OUT, { recursive: true });

export const ROUTES = [
  "/", "/analytics", "/basira", "/bookings", "/branches", "/discounts", "/floor", "/orders", "/orgs",
  "/qr", "/users", "/access/users", "/access/roles", "/delivery/channels", "/delivery/zones",
  "/delivery/settings", "/insights/sales", "/insights/profitability", "/insights/tables",
  "/insights/inventory-reports", "/inventory/today", "/inventory/items", "/inventory/counts",
  "/inventory/purchasing", "/inventory/transfers", "/inventory/waste", "/inventory/reports",
  "/inventory/settings", "/kitchen/stations", "/kitchen/routing", "/menu/items",
  "/menu/pricing", "/menu/recipes", "/menu/overrides", "/settings/brand", "/settings/integrations",
  "/settings/loyalty", "/settings/whatsapp", "/settings/bookings", "/staff/employees",
  "/staff/attendance", "/staff/shifts", "/staff/requests", "/staff/rules", "/shifts", "/tills",
];
const SIZES = { desktop: [1440, 900], tablet: [1024, 1366], phone: [390, 844] };

const routes = args.routes ?? ROUTES;
const langs = args.langs ?? ["en"];
const themes = args.themes ?? ["light"];
const sizes = args.sizes ?? ["desktop"];

const browser = await chromium.launch();
for (const lang of langs)
  for (const theme of themes)
    for (const size of sizes) {
      const [width, height] = SIZES[size];
      const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", colorScheme: theme });
      await ctx.addInitScript(
        ([l, t]) => {
          try {
            localStorage.setItem("madar.theme", t);
            localStorage.setItem("madar.lang", l);
            const app = JSON.parse(localStorage.getItem("madar.app") ?? '{"state":{},"version":0}');
            app.state.language = l;
            localStorage.setItem("madar.app", JSON.stringify(app));
            sessionStorage.setItem("madar.onboarding.skip", "1");
          } catch {
            /* ignore */
          }
        },
        [lang, theme],
      );
      const p = await ctx.newPage();
      p.on("pageerror", (e) => console.warn(`  pageerror ${e.message.slice(0, 120)}`));
      for (const r of routes) {
        const slug = r.split("?")[0];
        const name = `${slug === "/" ? "home" : slug.slice(1).replaceAll("/", "-")}-${size}-${lang}-${theme}.png`;
        try {
          await p.goto(BASE + r, { waitUntil: "networkidle", timeout: 45000 });
          await p.evaluate(() => document.fonts && document.fonts.ready);
          await p.waitForTimeout(1200);
          for (let i = 0; i < 3 && (await p.locator("text=Failed to fetch dynamically").count()); i++) {
            await p.reload({ waitUntil: "networkidle" });
            await p.waitForTimeout(1500);
          }
          await p.evaluate(() =>
            document
              .querySelectorAll('[class*="tsqd"],[class*="Devtools"],.tsr-devtools')
              .forEach((e) => e.style.setProperty("display", "none", "important")),
          );
          await p.screenshot({ path: path.join(OUT, name), fullPage: false });
          console.log("ok", name);
        } catch (e) {
          console.warn("fail", name, e.message.slice(0, 100));
        }
      }
      await ctx.close();
    }
await browser.close();
