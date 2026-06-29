// Capture the customer ordering phone shots (menu / customize / cart / track) for
// the landing's customer-journey section, in the storefront's DARK theme, EN + AR.
// Mock server first:  npm run dev:order   (port 5183)
// Then:  node scripts/capture-customer-shots.mjs [en|ar]
// Output: public/screenshots/order-<state>-<lang>-dark.webp  (804×1748, like the light set)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../public/screenshots");
const BASE = "http://localhost:5183";

// Cross-language matchers (item names + UI strings are localized in AR).
const RE = {
  continue: /Continue to menu|المتابعة إلى القائمة/i,
  latte: /Latte|لاتيه/, // first match = Latte (Hot Drinks precede the Iced variants)
};

const only = process.argv[2]; // optional: "en" | "ar"
const LANGS = only ? [only] : ["en", "ar"];

async function shoot(page, name) {
  const base = path.join(OUT, name);
  await page.screenshot({ path: `${base}.png` });
  execFileSync("cwebp", ["-quiet", "-q", "80", "-sharp_yuv", `${base}.png`, "-o", `${base}.webp`]);
  unlinkSync(`${base}.png`);
  console.log("saved", path.relative(process.cwd(), `${base}.webp`));
}

async function capture(browser, lang) {
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    colorScheme: "dark",
    geolocation: { latitude: 30.06, longitude: 31.22 },
    permissions: ["geolocation"],
    locale: lang === "ar" ? "ar-EG" : "en-US",
  });
  // Seed the dark storefront theme + skip the phone/OTP gate (device token + guest phone).
  await ctx.addInitScript((lg) => {
    try {
      localStorage.setItem("madar.order.theme", "dark");
      localStorage.setItem("madar.theme", "dark");
      localStorage.setItem("madar.lang", lg);
      localStorage.setItem("madar.app", JSON.stringify({ state: { language: lg }, version: 0 }));
      localStorage.setItem("madar_guest_phone:org_madar_demo", "201211116899");
      localStorage.setItem("madar_delivery_device:201211116899", "mock_device_token_abc123");
    } catch (e) {}
  }, lang);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/org_madar_demo/br_zamalek?channel=in_mall`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);

  // 1) location step → continue to the menu
  await page
    .getByRole("button")
    .filter({ hasText: RE.continue })
    .first()
    .click({ timeout: 6000 })
    .catch((e) => console.warn("continue:", e.message));
  await page.waitForTimeout(1800);
  // nudge-scroll so lazy item images decode, then back to top
  await page.evaluate(async () => {
    window.scrollTo(0, 280);
    await new Promise((r) => setTimeout(r, 250));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await shoot(page, `order-menu-${lang}-dark`);

  // 2) open the Latte customizer
  await page
    .locator("li button")
    .filter({ hasText: RE.latte })
    .first()
    .click({ timeout: 6000 })
    .catch((e) => console.warn("latte:", e.message));
  await page.waitForTimeout(1300);
  await shoot(page, `order-customize-${lang}-dark`);

  // 3) add to cart (the "Add · EGP …" button — the middot is language-agnostic),
  //    then open the cart from the bottom bg-foreground pill.
  await page
    .locator('button:has-text("·")')
    .last()
    .click({ timeout: 6000 })
    .catch((e) => console.warn("add:", e.message));
  await page.waitForTimeout(1300);
  await page
    .locator("button.bg-foreground") // the bottom cart pill — class is language-agnostic
    .last()
    .click({ timeout: 6000 })
    .catch((e) => console.warn("cartbar:", e.message));
  await page.waitForTimeout(1300);
  await shoot(page, `order-cart-${lang}-dark`);

  // 4) order tracking
  await page.goto(`${BASE}/track/ZAM-1031`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await shoot(page, `order-track-${lang}-dark`);

  await ctx.close();
}

const browser = await chromium.launch();
for (const lang of LANGS) await capture(browser, lang);
await browser.close();
console.log("done");
