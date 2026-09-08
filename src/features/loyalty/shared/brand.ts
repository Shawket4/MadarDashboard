/**
 * A tenant's colours, resolved against Madar's own.
 *
 * Every branding field is optional: a shop that has configured nothing still
 * gets a finished card rather than an unstyled one. The fallbacks are the Madar
 * brand tokens, kept in step with `MadarRust/src/orgs/branding.rs`, which is
 * the single source of truth for them — it derives a shop's palette from its
 * logo at upload time and guarantees the result is readable. What happens here
 * is a SAFETY NET for a row written before that existed, not a second opinion.
 */
import type { CardBrand } from "@/data/api/generated/models/cardBrand";

/** Teal deep — the Madar mark, and the default card ground. */
const MADAR_TEAL = "#0D6273";
/** Teal light — the precision accent. */
const MADAR_TEAL_LIGHT = "#2E94A6";
/** Paper — the light ground the mark is drawn on. */
const MADAR_PAPER = "#EFF3F4";

/** Ink for a light ground — `branding::MADAR_INK`. */
const MADAR_INK = "#12222A";

/** WCAG 2.1 AA for body text, and the floor `branding::ensure_readable` holds to. */
const AA = 4.5;

const HEX = /^#[0-9a-f]{6}$/i;

/** A colour we are willing to paint with, or the fallback. */
const safe = (value: string | null | undefined, fallback: string): string =>
  value && HEX.test(value) ? value : fallback;

/**
 * Relative luminance, per WCAG. Used to decide whether text on this card should
 * be light or dark — a tenant picks a background and we must not leave their
 * customers reading dark grey on navy.
 */
const luminance = (hex: string): number => {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
};

/** Contrast ratio between two colours, per WCAG. 1 = identical, 21 = max. */
const contrast = (a: string, b: string): number => {
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

export interface ResolvedBrand {
  orgName: string;
  programName: string;
  logoUrl: string | null;
  /**
   * The logo may be repainted in `foreground` for contrast.
   *
   * The card's ground is DERIVED from the logo's dominant colour, so a logo
   * left in its own colours is very nearly the colour it is sitting on. A shape
   * on transparency can be repainted, and then it reads by construction —
   * `foreground` is the one colour already guaranteed to clear AA on that
   * ground. A logo with its background baked in cannot: every pixel is opaque,
   * so the silhouette would be a solid rectangle, and it gets a plate instead.
   *
   * Decided by the backend, which has the pixels (`orgs::branding::is_mark`).
   */
  logoIsMark: boolean;
  /**
   * The wide photograph across the card — Apple's strip, Google's hero image.
   * `null` is a finished card, not a broken one; it simply has no band.
   */
  cardImageUrl: string | null;
  background: string;
  /** Text on `background`, contrast-checked rather than trusted. */
  foreground: string;
  /** Secondary text — the same hue, softened. */
  muted: string;
  /** Filled stamps and other accents. */
  accent: string;
  /** True when the ground is dark, so the caller can pick matching assets. */
  isDark: boolean;
  /**
   * The accent, made legible on the PAGE rather than on the card.
   *
   * `accent` is for things sitting on the card's own ground. This is for
   * headings, icons and links on the page around it, which follows the
   * reader's theme and not the shop's.
   */
  pageAccent: (ground: string) => string;
}

export function resolveBrand(
  brand: CardBrand | undefined,
  locale: string,
): ResolvedBrand {
  const background = safe(brand?.background_color, MADAR_TEAL);

  // A given foreground is honoured ONLY if it actually clears AA on the chosen
  // background, and by the SAME measure the backend used to pick it — the real
  // WCAG ratio, not a luminance gap.
  //
  // A luminance gap is not a contrast ratio, and the difference is not academic:
  // on a ground like #8A9AA3 it rejected the near-black ink the backend had
  // computed at 5.6:1 and substituted white, which measures 2.6:1. A cruder rule
  // overriding a stricter one always loses.
  const configured = safe(brand?.foreground_color, "");
  // The fallback is CHOSEN, not assumed. "Is the ground dark?" is the wrong
  // question — on that same #8A9AA3 (luminance 0.31, so nominally dark) white
  // is the unreadable answer. Ask which of the two actually reads, which is
  // what `branding::readable_on` does on the other side of the wire.
  const automatic =
    contrast(MADAR_PAPER, background) >= contrast(MADAR_INK, background)
      ? MADAR_PAPER
      : MADAR_INK;
  const foreground =
    configured && contrast(configured, background) >= AA ? configured : automatic;

  // Light TEXT means a dark card, whatever the ground's luminance says. Secondary
  // text is the same ink softened, so it can only ever be a weaker version of
  // something already legible.
  const dark = foreground === MADAR_PAPER || luminance(foreground) > 0.5;

  const isAr = locale.startsWith("ar");
  return {
    orgName: brand?.org_name?.trim() || "Madar",
    programName:
      (isAr ? brand?.program_name_ar?.trim() : "") ||
      brand?.program_name?.trim() ||
      "Rewards",
    logoUrl: brand?.logo_url?.trim() || null,
    logoIsMark: brand?.logo_is_mark ?? false,
    cardImageUrl: brand?.card_image_url?.trim() || null,
    background,
    foreground,
    muted: dark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.60)",
    accent: safe(brand?.label_color, dark ? MADAR_TEAL_LIGHT : MADAR_TEAL),
    isDark: dark,
    pageAccent: (ground: string) =>
      readableOn(safe(brand?.label_color, MADAR_TEAL), ground),
  };
}
