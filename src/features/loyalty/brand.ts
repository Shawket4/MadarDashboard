/**
 * A tenant's colours, resolved against Madar's own.
 *
 * Every branding field is optional: a shop that has configured nothing still
 * gets a finished card rather than an unstyled one. The fallbacks are the Madar
 * brand tokens, kept in step with `MadarRust/src/qr_card/mod.rs`, which is the
 * single source of truth for them.
 */
import type { CardBrand } from "@/data/api/generated/models/cardBrand";

/** Teal deep — the Madar mark, and the default card ground. */
const MADAR_TEAL = "#0D6273";
/** Teal light — the precision accent. */
const MADAR_TEAL_LIGHT = "#2E94A6";
/** Paper — the light ground the mark is drawn on. */
const MADAR_PAPER = "#EFF3F4";

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

export interface ResolvedBrand {
  orgName: string;
  programName: string;
  logoUrl: string | null;
  background: string;
  /** Text on `background`, contrast-checked rather than trusted. */
  foreground: string;
  /** Secondary text — the same hue, softened. */
  muted: string;
  /** Filled stamps and other accents. */
  accent: string;
  /** True when the ground is dark, so the caller can pick matching assets. */
  isDark: boolean;
}

export function resolveBrand(
  brand: CardBrand | undefined,
  locale: string,
): ResolvedBrand {
  const background = safe(brand?.background_color, MADAR_TEAL);
  const dark = luminance(background) < 0.5;

  // A configured foreground is honoured ONLY if it is actually legible on the
  // chosen background. Someone picking two dark colours in an admin form should
  // not be able to ship an unreadable card to their customers.
  const configured = safe(brand?.foreground_color, "");
  const automatic = dark ? MADAR_PAPER : "#12222A";
  const foreground =
    configured && Math.abs(luminance(configured) - luminance(background)) > 0.3
      ? configured
      : automatic;

  const isAr = locale.startsWith("ar");
  return {
    orgName: brand?.org_name?.trim() || "Madar",
    programName:
      (isAr ? brand?.program_name_ar?.trim() : "") ||
      brand?.program_name?.trim() ||
      "Rewards",
    logoUrl: brand?.logo_url?.trim() || null,
    background,
    foreground,
    muted: dark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.60)",
    accent: safe(brand?.label_color, dark ? MADAR_TEAL_LIGHT : MADAR_TEAL),
    isDark: dark,
  };
}
