// Surface probe: every open/close surface, opened AND closed by script at 4x
// CPU throttle on phone and desktop. For each it records whether the entrance
// and the exit actually animated: some element's computed opacity and/or
// transform took at least 3 different values across frames.
//   node surface-probe.mjs <baseUrl> <outDir> [--only=name]
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
mkdirSync(out, { recursive: true });

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const esc = (p) => p.keyboard.press("Escape");
const click = (sel) => (p) => p.locator(sel).filter({ visible: true }).first().click({ timeout: 6000 });

/** name, start path, viewports, open, close. */
const SURFACES = [
  { name: "sidebar-desktop", target: "[data-slot=sidebar-container], [data-slot=sidebar-inset]", start: "/", vps: ["desktop"], open: click("[data-sidebar=trigger]"), close: click("[data-sidebar=trigger]"), openFirst: "close" },
  { name: "sidebar-mobile-sheet", target: "[data-mobile=true], [data-slot=sheet-overlay]", start: "/", vps: ["phone"], open: click("[data-sidebar=trigger]"), close: (p) => p.mouse.click(380, 420) },
  { name: "sidebar-group-collapsible", target: "li.list-none, [data-slot=collapsible-content]", start: "/", vps: ["desktop"], open: click('[data-sidebar=menu-button]:has-text("more")'), close: click('[data-sidebar=menu-button]:has-text("fewer"), [data-sidebar=menu-button]:has-text("less")') },
  { name: "order-detail-sheet", target: "[data-slot=sheet-content], [data-slot=sheet-overlay]", start: "/orders", open: click("[data-row]"), close: (p) => p.mouse.click(12, 420) },
  { name: "command-palette", target: "[data-slot=dialog-content], [data-slot=dialog-overlay]", start: "/", open: (p) => p.keyboard.press("Control+k"), close: esc },
  { name: "account-dropdown", target: "[data-slot=dropdown-menu-content]", start: "/", open: click('[aria-haspopup=menu][aria-label="Account"]'), close: esc },
  { name: "date-popover", target: "[data-slot=popover-content]", start: "/", vps: ["desktop"], open: click('button:has-text("Last 30 days")'), close: esc },
  { name: "select", target: "[data-slot=select-content], [data-slot=popover-content]", start: "/orders", vps: ["desktop"], open: click("button[role=combobox]"), close: esc },
  { name: "row-actions-dropdown", target: "[data-slot=dropdown-menu-content]", start: "/orders", vps: ["desktop"], open: click('[data-row] [aria-haspopup=menu]'), close: esc },
  {
    name: "menu-item-dialog",
    target: "[data-slot=dialog-content], [data-slot=dialog-overlay], [data-slot=sheet-content]",
    start: "/menu",
    vps: ["desktop"],
    // The menu item dialog, as "Add item" opens it.
    open: click('button:has-text("Add item"), button:has-text("New item")'),
    close: esc,
  },
  {
    name: "confirm-dialog",
    target: "[data-slot=alert-dialog-content], [data-slot=alert-dialog-overlay], [data-slot=dialog-content]",
    start: "/menu",
    vps: ["desktop"],
    open: async (p) => {
      await click('main [aria-haspopup=menu]:not([aria-label])')(p);
      await p.waitForTimeout(600);
      await p.getByRole("menuitem", { name: /delete|archive|remove/i }).first().click({ timeout: 6000 });
    },
    close: esc,
  },
  {
    name: "tooltip",
    target: "[data-slot=tooltip-content]",
    start: "/",
    vps: ["desktop"],
    pre: async (p) => {
      await click("[data-sidebar=trigger]")(p);
      await p.waitForTimeout(1500);
      await p.mouse.move(700, 450);
    },
    open: (p) => p.locator("[data-sidebar=menu-button]").filter({ visible: true }).nth(2).hover(),
    close: (p) => p.mouse.move(1300, 880, { steps: 8 }),
  },
  { name: "toast", target: "[data-sileo-toast]", start: "/inventory/items", vps: ["desktop"], open: click('button:has-text("Export")'), close: async (p) => p.waitForTimeout(4500) },
];

function sampler() {
  const touched = new Set();
  const samples = new Map();
  const sample = (el) => {
    const cs = getComputedStyle(el);
    let set = samples.get(el);
    if (!set) samples.set(el, (set = new Set()));
    set.add(`${(+cs.opacity).toFixed(2)}|${cs.transform}|${cs.clipPath}|${cs.height}`);
  };
  const loop = () => {
    for (const el of touched) if (el.isConnected) sample(el);
    for (const a of document.getAnimations()) {
      const el = a.effect?.target;
      if (!el || a.constructor.name === "CSSAnimation") continue;
      touched.add(el);
      sample(el);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new MutationObserver((rs) => {
    for (const r of rs) if (r.type === "attributes") touched.add(r.target);
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
  const describe = (el) => `${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? el.getAttribute("role") ?? ""}] "${(el.textContent ?? "").trim().slice(0, 30)}"`;
  window.__surface = {
    reset() {
      samples.clear();
      touched.clear();
    },
    result(target) {
      const inside = (el) => !target || el.matches?.(target) || !!el.closest?.(target);
      const moved = [...samples].filter(([el, s]) => s.size >= 3 && inside(el)).map(([el]) => el);
      return { animated: moved.length, examples: moved.slice(0, 3).map(describe) };
    },
  };
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const rows = [];
for (const s of SURFACES.filter((x) => !only || x.name.startsWith(only))) {
  for (const vp of s.vps ?? ["desktop", "phone"]) {
    const ctx = await browser.newContext({ viewport: VIEWPORTS[vp] });
    await ctx.addInitScript(() => {
      localStorage.setItem("madar.lang", "en");
      localStorage.setItem("madar.theme", "light");
      sessionStorage.setItem("madar.onboarding.skip", "1");
    });
    await ctx.addInitScript(sampler);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const row = { surface: s.name, vp };
    try {
      await page.goto(base + s.start);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(3000);
      if (s.pre) await s.pre(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      // The sidebar starts open: its "open" is the expand after a collapse.
      const first = s.openFirst === "close" ? s.close : null;
      if (first) {
        await first(page);
        await page.waitForTimeout(1500);
      }
      await page.evaluate(() => window.__surface.reset());
      await s.open(page);
      await page.waitForTimeout(1500);
      row.enter = await page.evaluate((t) => window.__surface.result(t), s.target);
      await page.evaluate(() => window.__surface.reset());
      await s.close(page);
      await page.waitForTimeout(1500);
      row.exit = await page.evaluate((t) => window.__surface.result(t), s.target);
    } catch (e) {
      row.error = String(e).split("\n")[0].slice(0, 140);
    }
    rows.push(row);
    await ctx.close();
    const yn = (r) => (r ? (r.animated > 0 ? "yes" : "NO ") : "-  ");
    console.log(`${s.name.padEnd(26)} ${vp.padEnd(7)} enter ${yn(row.enter)} exit ${yn(row.exit)} ${row.error ?? ""} ${row.enter?.examples?.[0] ?? ""}`);
  }
}
await browser.close();
writeFileSync(`${out}/surfaces.json`, JSON.stringify(rows, null, 2));
