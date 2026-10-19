/**
 * The Meta Pixel on /signup only (the landing has its own, site/src/scripts/meta-pixel.ts):
 * a PageView when the page opens and CompleteRegistration when the shop is made. Only on
 * the production host, so never localhost, a preview or the Tauri app; no
 * `VITE_META_PIXEL_ID` → nothing loads. No phone, email or name is sent.
 */
import { metaPixel, signupEventId } from "@shared/meta-pixel";

function pixel() {
  const id = import.meta.env.VITE_META_PIXEL_ID?.trim();
  return id && window.location.hostname === "madar-pos.cloud" ? metaPixel(id) : undefined;
}

export const pixelPageView = (): void => pixel()?.("track", "PageView");

export const pixelSignupDone = (orgId: string): void =>
  pixel()?.("track", "CompleteRegistration", {}, { eventID: signupEventId(orgId) });
