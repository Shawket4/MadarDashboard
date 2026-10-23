/**
 * A designed card's own files: the two faces the server draws the strip with
 * (Manrope SemiBold, Cairo Medium; SIL OFL 1.1, licences beside them) and the
 * footer it composites. Loaded only where a designed card is drawn.
 */
import cairoUrl from "./assets/Cairo-Medium.ttf?url";
import manropeUrl from "./assets/Manrope-SemiBold.ttf?url";
import footerArInk from "./assets/mukafaat-min-madar-ink-36.png?url";
import footerArPaper from "./assets/mukafaat-min-madar-paper-36.png?url";
import footerInk from "./assets/rewards-by-madar-ink-24.png?url";
import footerPaper from "./assets/rewards-by-madar-paper-24.png?url";

let fonts: Promise<void> | undefined;

/** Manrope SemiBold and Cairo Medium, for the preview only (font-src 'self'). */
export function loadCardFonts(): Promise<void> {
  if (typeof FontFace === "undefined" || typeof document === "undefined" || !document.fonts) return Promise.resolve();
  fonts ??= Promise.all([
    new FontFace("Manrope", `url(${manropeUrl})`, { weight: "600" }).load(),
    new FontFace("Cairo", `url(${cairoUrl})`, { weight: "500" }).load(),
  ]).then(
    (faces) => {
      for (const f of faces) document.fonts.add(f);
    },
    () => {
      fonts = undefined;
    },
  );
  return fonts;
}

export function footerHref(foreground: string, arabic: boolean): string {
  const paper = footerIsPaper(foreground);
  return arabic ? (paper ? footerArPaper : footerArInk) : paper ? footerPaper : footerInk;
}

/** WCAG relative luminance of `#RRGGBB` (null when malformed). */
export function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  const ch = (h: string) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(m[1]) + 0.7152 * ch(m[2]) + 0.0722 * ch(m[3]);
}

/** The footer is the light (paper) one under light text, as on the pass. */
export const footerIsPaper = (foreground: string): boolean => (luminance(foreground) ?? 1) > 0.5;
