// Vitest global setup (referenced by vitest.config.ts `setupFiles`).
// Registers jest-dom matchers (toBeInTheDocument, etc.) for component tests.
import "@testing-library/jest-dom/vitest";

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
