import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BASE = "http://localhost:5181";
const ORG_ID = "685f6bfa-0d44-4a9f-bb3e-50eec96d50c9";
const BRANCH_ID = "1e4cfcf1-67df-4e19-8efb-de5e6dd766e9"; // Arkan, otp_required=false
const TRACK_ID = "70e48c70-cccd-4bee-b07d-3a95e3607bbf";   // received order
const GUEST_PHONE = "01061856523"; // Peter — has real orders
const OUT = new URL(".", import.meta.url).pathname;
const VIEWPORT = { width: 390, height: 844 };
const SCALE = 3; // 1170×2532 native

mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await page.waitForTimeout(800);
  const buf = await page.screenshot({ type: "png" });
  writeFileSync(join(OUT, `${name}.png`), buf);
  console.log(`✓ ${name}.png`);
}

async function setLang(page, lang) {
  await page.evaluate((l) => {
    const raw = localStorage.getItem("sufrix.app");
    const store = raw ? JSON.parse(raw) : {};
    store.state = store.state ?? {};
    store.state.language = l;
    localStorage.setItem("sufrix.app", JSON.stringify(store));
  }, lang);
}

async function clearGuest(page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sufrix_guest_phone") || k.startsWith("sufrix_delivery_device"))
      .forEach((k) => localStorage.removeItem(k));
  });
}

async function waitReady(page, ms = 1800) {
  await page.waitForLoadState("networkidle").catch(() => {});
  // Wait for all images to finish loading
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.every((img) => img.complete);
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function clickButton(page, pattern) {
  await page.evaluate((p) => {
    const re = new RegExp(p, "i");
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => re.test(b.textContent ?? "")
    );
    btn?.click();
  }, pattern);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();

  // Proxy image URLs from remote → local backend
  // rue-pos.ddns.net/api/uploads/... → localhost:8081/uploads/...
  await page.route("**/*.{jpg,jpeg,png,webp,gif,svg}", async (route) => {
    const orig = route.request().url();
    if (!orig.includes("rue-pos.ddns.net") && !orig.includes("sufrix.duckdns.org") && !orig.includes("sufrix.ddns")) {
      return route.continue();
    }
    const local = orig
      .replace(/https?:\/\/rue-pos\.ddns\.net\/api/, "http://localhost:8081")
      .replace(/https?:\/\/sufrix\.(duckdns\.org|ddns\.(org|net))\/api/, "http://localhost:8081")
      .replace(/https?:\/\/rue-pos\.ddns\.net/, "http://localhost:8081")
      .replace(/https?:\/\/sufrix\.(duckdns\.org|ddns\.(org|net))/, "http://localhost:8081");
    try {
      const res = await route.fetch({ url: local });
      await route.fulfill({ response: res });
    } catch {
      await route.abort();
    }
  });

  // Seed localStorage on first hit
  await page.goto(BASE);
  await page.waitForTimeout(1200);

  for (const lang of ["en", "ar"]) {
    // ── setup ──────────────────────────────────────────────────────────────
    await setLang(page, lang);
    await clearGuest(page);
    const pfx = lang === "en" ? "en" : "ar";

    // 1. Channel step
    await page.goto(`${BASE}/order/${ORG_ID}?branch=${BRANCH_ID}`);
    await waitReady(page);
    await shot(page, `${pfx}-01-channel`);

    // 2. Phone step (outside channel, no pre-filled phone)
    await page.goto(`${BASE}/order/${ORG_ID}?branch=${BRANCH_ID}&channel=outside`);
    await waitReady(page);
    await shot(page, `${pfx}-02-phone`);

    // 3. Fill phone → continue → location step
    await page.fill('input[inputmode="tel"]', GUEST_PHONE).catch(() => {});
    await clickButton(page, lang === "en" ? "Continue" : "متابعة");
    await waitReady(page);
    await shot(page, `${pfx}-03-location`);

    // 4. Continue to menu
    await clickButton(page, lang === "en" ? "Continue to menu" : "المتابعة إلى القائمة");
    await waitReady(page);
    await shot(page, `${pfx}-04-menu`);

    // 5. Open order history drawer
    await page.evaluate(() => {
      const btn =
        document.querySelector('button[aria-label="My orders"]') ??
        document.querySelector('button[aria-label="طلباتي"]') ??
        Array.from(document.querySelectorAll("button")).find((b) =>
          /order|طلب/i.test(b.getAttribute("aria-label") ?? "")
        );
      btn?.click();
    });
    await page.waitForTimeout(700);
    await shot(page, `${pfx}-05-history`);

    // 5b. Expand first receipt — scoped to the open drawer only
    await page.evaluate(() => {
      // Vaul drawer sets data-state="open"; fallback to [role="dialog"]
      const drawer =
        document.querySelector('[data-vaul-drawer][data-state="open"]') ??
        document.querySelector('[role="dialog"][data-state="open"]') ??
        document.querySelector('[data-state="open"]');
      const container = drawer ?? document;
      const btns = Array.from(container.querySelectorAll("li button, ol button"));
      btns[0]?.click();
    });
    await page.waitForTimeout(400);
    await shot(page, `${pfx}-06-history-receipt`);

    // 6. Tracking page
    await page.goto(`${BASE}/track/${TRACK_ID}`);
    await waitReady(page);
    await shot(page, `${pfx}-07-tracking`);
  }

  await browser.close();
  console.log("\nAll screenshots saved to screenshots/");
})();
