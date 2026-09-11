import { beforeEach, describe, expect, it, vi } from "vitest";

const boot = async () => {
  vi.resetModules();
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
  const mod = await import("./use-public-theme");
  mod.initPublicTheme();
  return document.documentElement;
};

/** A phone set to dark mode. */
const deviceIsDark = (dark: boolean) =>
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (q: string) => ({
      matches: dark && q.includes("dark"),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });

describe("a storefront's theme", () => {
  beforeEach(() => localStorage.clear());

  /**
   * A storefront should look the same to every customer. The guest bundles used
   * to import the dashboard's theme module, whose boot side effect painted the
   * DEVICE preference — so a customer opening a menu on a dark phone got a dark
   * storefront, and the OS listener then fought the page's own light theme for
   * as long as it was open.
   */
  it("is light on a dark phone", async () => {
    deviceIsDark(true);
    const html = await boot();
    expect(html.classList.contains("dark")).toBe(false);
    expect(html.style.colorScheme).toBe("light");
  });

  it("is light on a light phone", async () => {
    deviceIsDark(false);
    const html = await boot();
    expect(html.classList.contains("dark")).toBe(false);
  });

  it("keeps a visitor's own choice", async () => {
    deviceIsDark(false);
    localStorage.setItem("madar.public.theme", "dark");
    const html = await boot();
    expect(html.classList.contains("dark")).toBe(true);
    expect(html.style.colorScheme).toBe("dark");
  });
});
