import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { AA, brandTokens, contrast, PAGE_GROUND } from "./brand-color";
import { useBrandSkin } from "./use-brand-skin";
import { usePublicTheme } from "./use-public-theme";

const root = () => document.documentElement;

afterEach(() => {
  root().classList.remove("brand-surface");
  root().removeAttribute("style");
  act(() => usePublicTheme.getState().setMode("light"));
});

describe("brandTokens", () => {
  it("fills the kit's tokens with the shop's colour, legible on each theme's ground", () => {
    // A pale mint: unreadable on paper as-is, and too light for white labels.
    for (const mode of ["light", "dark"] as const) {
      const t = brandTokens("#9BE3C8", mode)!;
      expect(contrast(t["--primary"]!, PAGE_GROUND[mode])).toBeGreaterThanOrEqual(AA);
      expect(t["--brand"]).toBe(t["--primary"]);
      expect(t["--ring"]).toBe(t["--primary"]);
      expect(t["--brand-foreground"]).toBe(t["--primary-foreground"]);
    }
  });

  it("keeps a colour that already reads, untouched", () => {
    expect(brandTokens("#7B1E3A", "light")!["--primary"]).toBe("#7B1E3A");
  });

  it("labels the fill with whichever of white and ink reads better", () => {
    const light = brandTokens("#7B1E3A", "light")!;
    expect(light["--primary-foreground"]).toBe("#FFFFFF");
    const dark = brandTokens("#7B1E3A", "dark")!;
    expect(contrast(dark["--primary-foreground"]!, dark["--primary"]!)).toBeGreaterThanOrEqual(AA);
  });

  it("leaves Madar's own teal, and anything unpaintable, to the storefront tokens", () => {
    expect(brandTokens("#0D6273", "light")).toBeNull();
    expect(brandTokens("#0d6273", "dark")).toBeNull();
    expect(brandTokens("teal", "light")).toBeNull();
    expect(brandTokens(null, "light")).toBeNull();
  });
});

describe("useBrandSkin", () => {
  it("paints the shop's colour on <html>, where portals inherit it, and removes it after", () => {
    root().classList.add("brand-surface");
    const { unmount } = renderHook(() => useBrandSkin("#7B1E3A"));
    expect(root().style.getPropertyValue("--primary")).toBe("#7B1E3A");
    expect(root().style.getPropertyValue("--brand")).toBe("#7B1E3A");
    unmount();
    expect(root().style.getPropertyValue("--primary")).toBe("");
  });

  it("re-walks the colour when the visitor switches theme", () => {
    root().classList.add("brand-surface");
    renderHook(() => useBrandSkin("#7B1E3A"));
    act(() => usePublicTheme.getState().setMode("dark"));
    const primary = root().style.getPropertyValue("--primary");
    expect(primary).not.toBe("#7B1E3A");
    expect(contrast(primary, PAGE_GROUND.dark)).toBeGreaterThanOrEqual(AA);
  });

  it("does nothing outside a storefront, so a dashboard preview never recolours the tool", () => {
    renderHook(() => useBrandSkin("#7B1E3A"));
    expect(root().style.getPropertyValue("--primary")).toBe("");
  });
});
