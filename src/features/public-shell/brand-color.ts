/**
 * The colour arithmetic every public page shares: WCAG contrast, and the walk
 * that makes a shop's colour legible on the page around it.
 *
 * It lives in `public-shell` because ordering, reservations and loyalty are
 * separately built bundles, and all three paint with a shop's colour. Pure
 * functions on `#RRGGBB` strings — no React, no tokens.
 */

/** WCAG 2.1 AA for body text, and the floor `branding::ensure_readable` holds to. */
export const AA = 4.5;

export const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Relative luminance, per WCAG. Used to decide whether text should be light or
 * dark — a tenant picks a background and we must not leave their customers
 * reading dark grey on navy.
 */
export const luminance = (hex: string): number => {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
};

/** Contrast ratio between two colours, per WCAG. 1 = identical, 21 = max. */
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Mix two colours, `t` of the way from `a` to `b`. */
const mix = (a: string, b: string, t: number): string => {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = (i: number) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t);
  return `#${[0, 1, 2].map((i) => c(i).toString(16).padStart(2, "0")).join("")}`;
};

/**
 * A brand colour that is legible as TEXT on the page it is printed on.
 *
 * The card can use a shop's accent freely — it sits on that shop's own ground,
 * and the pair is contrast-checked at the source. The PAGE is a different
 * problem: it follows the reader's light/dark preference, so the same accent
 * has to read on white and on near-black, and plenty of real brand colours read
 * on neither. A pale mint headline on white is not a design choice, it is an
 * unreadable one.
 *
 * So the hue is kept and the lightness is walked towards the page's ink until
 * it clears AA. Nudged in steps rather than solved analytically because the
 * answer only has to be right, and this is a handful of arithmetic on a colour
 * that changes when a shop uploads a new logo.
 */
export const readableOn = (color: string, ground: string): string => {
  if (!HEX.test(color) || !HEX.test(ground)) return color;
  // Legible already: hand back the shop's own value, untouched. Mixing by zero
  // would return an equal colour spelled differently, and a caller comparing
  // strings would think we had changed it.
  if (contrast(color, ground) >= AA) return color;
  // Toward the opposite end from the ground: darker on a light page, lighter on
  // a dark one, which is the direction that keeps the hue recognisable.
  const target = luminance(ground) > 0.5 ? "#000000" : "#ffffff";
  let out = color;
  for (let t = 0.08; t <= 1.0001; t += 0.08) {
    out = mix(color, target, t);
    if (contrast(out, ground) >= AA) return out;
  }
  return out;
};

/**
 * The page ground each storefront theme paints — `--background` from
 * `globals.css`, as hex, because the AA arithmetic works on hex and a CSS token
 * is not a value until the browser resolves it. KEEP IN STEP with those tokens.
 *
 * The dark one used to be #0B0B0C, near-black, while the page actually paints
 * a blue-grey some four times as luminous. Contrast is a ratio against the
 * REAL ground: an accent that cleared 4.5:1 against the constant could land at
 * 3.7:1 on the page, and nothing would have said so.
 */
export const PAGE_GROUND = { light: "#EFF3F4", dark: "#14181E" } as const;

/** Madar's own mark colour — `branding::MADAR_TEAL`, what a shop off the tier is handed. */
export const MADAR_TEAL = "#0D6273";

/** Label on a filled control: whichever of white and ink reads better on it. */
const labelOn = (fill: string): string =>
  contrast("#FFFFFF", fill) >= contrast("#12222A", fill) ? "#FFFFFF" : "#12222A";

/**
 * The tokens that make a public page the shop's: `--primary` (every button,
 * chip, checkbox and link in the kit), `--brand` (the page's marks) and
 * `--ring`, all from the shop's MAIN colour.
 *
 * The main colour, not the card's label colour: that one is chosen to read ON
 * the brand ground, so it is often a pale tint of it (Drops: pale pink), and
 * walked to AA on paper it comes out a dead grey-brown.
 *
 * Walked to AA against the ground the theme actually paints, because the same
 * token fills a button AND colours a price or a link on that ground. `null` for
 * a colour we cannot paint with, and for Madar's own teal — a shop off the tier
 * keeps the storefront's tuned Madar tokens rather than an approximation of
 * them.
 */
export function brandTokens(
  color: string | null | undefined,
  mode: "light" | "dark",
): Record<string, string> | null {
  if (!color || !HEX.test(color) || color.toUpperCase() === MADAR_TEAL) return null;
  const fill = readableOn(color, PAGE_GROUND[mode]);
  const label = labelOn(fill);
  return {
    "--primary": fill,
    "--primary-foreground": label,
    "--ring": fill,
    "--brand": fill,
    "--brand-foreground": label,
  };
}
