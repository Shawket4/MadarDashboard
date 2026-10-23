// Vitest global setup (referenced by vitest.config.ts `setupFiles`).
// Registers jest-dom matchers (toBeInTheDocument, etc.) for component tests.
import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, beforeEach } from "vitest";

import { initRules } from "@/lib/rules";
import { urlSearch } from "@/test/url-search-mock";
import * as fullRules from "@/lib/rules/wasm/full/madar_web.js";
import { initMenuRules } from "@/lib/rules/menu";
import * as menuRulesPkg from "@/lib/rules/wasm/menu/madar_menu.js";
import { initCardRules } from "@/lib/rules/card";
import * as cardRulesPkg from "@/lib/rules/wasm/card/madar_card.js";

// The madar-shared rules (WebAssembly), as the dashboard's main.tsx loads them
// before its first render; Node cannot fetch it, so it gets the bytes.
await initRules(fullRules, readFileSync(resolve(__dirname, "../lib/rules/wasm/full/madar_web_bg.wasm")));
// The menu import's own package (loaded on demand in the app).
await initMenuRules(menuRulesPkg, readFileSync(resolve(__dirname, "../lib/rules/wasm/menu/madar_menu_bg.wasm")));
// The Rewards card designer's package (loaded on demand in the app).
await initCardRules(cardRulesPkg, readFileSync(resolve(__dirname, "../lib/rules/wasm/card/madar_card_bg.wasm")));

// The locales load lazily in the app (src/i18n); a test renders synchronously,
// so both are handed to its loader up front (also for a module re-imported
// after vi.resetModules), and a switch inside a test is immediate.
(globalThis as { __MADAR_LOCALES__?: Record<string, unknown> }).__MADAR_LOCALES__ = {
  en: JSON.parse(readFileSync(resolve(__dirname, "../i18n/locales/en.json"), "utf8")),
  ar: JSON.parse(readFileSync(resolve(__dirname, "../i18n/locales/ar.json"), "utf8")),
};

// jsdom implements no media queries at all, and `window.matchMedia` is simply
// absent. Anything that reaches the theme store (`lib/theme`) or the mobile
// breakpoint hook therefore throws on IMPORT, which turns a unit test of a pure
// helper in the same module into a failed suite. Report "not dark, not mobile"
// and let a test that cares override it.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom has no ResizeObserver either; DataTable observes its scroller for the
// overflow fade, so any page test that renders a table needs a no-op one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// URL-bound list filters (useListFilters) read a module-level search object in
// tests that mock the router; start every test from an empty URL.
afterEach(() => urlSearch.reset());

// Toasts are spied and silent in every test; assert on `toast.error` etc. from
// @/components/ui/toast (src/test/toast.ts). No test mocks a toast module itself.
// Imported here, after the locales above: the toast module loads i18n.
const { quietToasts } = await import("@/test/toast");
quietToasts();
beforeEach(() => quietToasts());
