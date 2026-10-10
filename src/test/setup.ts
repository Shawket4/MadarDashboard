// Vitest global setup (referenced by vitest.config.ts `setupFiles`).
// Registers jest-dom matchers (toBeInTheDocument, etc.) for component tests.
import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { initRules } from "@/lib/rules";
import * as fullRules from "@/lib/rules/wasm/full/madar_web.js";

// The madar-shared rules (WebAssembly), as the dashboard's main.tsx loads them
// before its first render; Node cannot fetch it, so it gets the bytes.
await initRules(fullRules, readFileSync(resolve(__dirname, "../lib/rules/wasm/full/madar_web_bg.wasm")));

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
