import { describe, expect, it } from "vitest";

import { resolveBrand } from "./brand";

/** The AA floor both sides of the wire hold to. */
const AA = 4.5;

const luminance = (hex: string): number => {
  const ch = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(1) + 0.0722 * ch(2);
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("resolveBrand", () => {
  it("keeps a readable foreground the backend derived", () => {
    const b = resolveBrand(
      {
        org_name: "RUE Coffee",
        program_name: "Rewards",
        program_name_ar: null,
        logo_url: null,
        logo_is_mark: false,
        background_color: "#7B1E3A",
        foreground_color: "#EFF3F4",
        label_color: "#C8607F",
      },
      "en",
    );
    expect(b.foreground).toBe("#EFF3F4");
    expect(b.background).toBe("#7B1E3A");
  });

  it("never trades a readable ink for a worse one on a mid-dark ground", () => {
    // The regression this exists for. Near-black ink clears AA on this ground
    // and white does not. The old rule compared a LUMINANCE GAP against 0.3,
    // found the ink's gap too small, and substituted white — a cruder rule
    // overriding a stricter one, and the customer reading 2.6:1.
    const ground = "#8A9AA3";
    const ink = "#12222A";
    expect(contrast(ink, ground)).toBeGreaterThanOrEqual(AA);
    expect(contrast("#EFF3F4", ground)).toBeLessThan(AA);

    const b = resolveBrand(
      {
        org_name: "X",
        program_name: "Rewards",
        program_name_ar: null,
        logo_url: null,
        logo_is_mark: false,
        background_color: ground,
        foreground_color: ink,
        label_color: null,
      },
      "en",
    );
    expect(b.foreground).toBe(ink);
  });

  it("refuses an unreadable foreground whatever the row says", () => {
    const b = resolveBrand(
      {
        org_name: "X",
        program_name: "Rewards",
        program_name_ar: null,
        logo_url: null,
        logo_is_mark: false,
        // Two darks: 1.3:1. A row written before the palette work could hold this.
        background_color: "#0D6273",
        foreground_color: "#12222A",
        label_color: null,
      },
      "en",
    );
    expect(b.foreground).not.toBe("#12222A");
    expect(contrast(b.foreground, b.background)).toBeGreaterThanOrEqual(AA);
  });

  it("picks a readable fallback rather than assuming a dark ground", () => {
    // Luminance 0.31 reads as "dark" to a 0.5 pivot, and white on it is 2.6:1.
    // With no foreground given at all, the card must still be legible.
    const ground = "#8A9AA3";
    const b = resolveBrand(
      {
        org_name: "X",
        program_name: "Rewards",
        program_name_ar: null,
        logo_url: null,
        logo_is_mark: false,
        background_color: ground,
        foreground_color: null,
        label_color: null,
      },
      "en",
    );
    expect(contrast(b.foreground, b.background)).toBeGreaterThanOrEqual(AA);
    // And the secondary ink follows the text, not the ground: dark text must
    // not be paired with a white-tinted muted.
    expect(b.isDark).toBe(false);
  });

  it("gives a shop that configured nothing a finished card", () => {
    const b = resolveBrand(undefined, "en");
    expect(b.orgName).toBe("Madar");
    expect(contrast(b.foreground, b.background)).toBeGreaterThanOrEqual(AA);
  });
});
