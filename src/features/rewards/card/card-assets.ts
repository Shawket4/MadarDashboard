/** The preview's own files: the two faces the server draws with, and the footer it composites. */
import cairoUrl from "./assets/Cairo-Medium.ttf?url";
import manropeUrl from "./assets/Manrope-SemiBold.ttf?url";
import footerArInk from "./assets/mukafaat-min-madar-ink-36.png?url";
import footerArPaper from "./assets/mukafaat-min-madar-paper-36.png?url";
import footerInk from "./assets/rewards-by-madar-ink-24.png?url";
import footerPaper from "./assets/rewards-by-madar-paper-24.png?url";
import { footerIsPaper } from "./design-state";

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
