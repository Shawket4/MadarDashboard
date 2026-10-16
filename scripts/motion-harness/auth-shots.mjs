// Motion verification harness (see MOTION_HANDOFF.md). Run against a mock dev
// server (`npm run dev:mock`). Needs Playwright's Chromium: `npx playwright install chromium`
// (or point CHROME_PATH at a Chromium/headless-shell binary).
import { createRequire } from "node:module";
const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");
const [base, out] = process.argv.slice(2);
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const sizes = { desk: { width: 1440, height: 900 }, tab: { width: 900, height: 1100 }, phone: { width: 390, height: 844 } };
const errs = [];
for (const [lang, theme, size] of [["en","light","desk"],["ar","dark","desk"],["en","light","phone"],["ar","dark","phone"],["en","dark","tab"],["ar","light","phone"]]) {
  const ctx = await b.newContext({ viewport: sizes[size], colorScheme: theme });
  await ctx.addInitScript(([l, t]) => { localStorage.setItem("madar.lang", l); localStorage.setItem("madar.theme", t); }, [lang, theme]);
  await ctx.route(/\/src\/data\/api\/mock\/enable\.ts/, async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, body: (await r.text()).replace(/useAuthStore\.getState\(\)\.signIn\([^)]*\);/, "") }); });
  for (const page of ["login", "signup"]) {
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(`${page}/${lang}/${size}: ${e}`));
    await p.goto(base + "/" + page);
    await p.waitForTimeout(3500);
    await p.screenshot({ path: `${out}/${page}-${size}-${lang}-${theme}.png`, fullPage: size !== "desk" });
    await p.close();
  }
  await ctx.close();
}
console.log(errs.length ? errs.join("\n") : "no page errors");
await b.close();
