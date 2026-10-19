/**
 * Umami Cloud (cookieless), on the signup page only: the same website as the
 * landing (get.madar-pos.cloud), so its funnel runs from the ad click to the shop
 * made. Auto-tracking is off, so nothing outside /signup is ever recorded, and
 * only step names and refusal reasons go out: never a phone, email or name.
 * No `VITE_UMAMI_WEBSITE_ID` (local dev, the desktop app, the demo) → a no-op.
 */
type Umami = { track: (name?: string, data?: Record<string, string>) => Promise<unknown> };
declare global {
  interface Window {
    umami?: Umami;
  }
}

let ready: Promise<Umami | undefined> | undefined;

function load(): Promise<Umami | undefined> {
  const id = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim();
  if (!id || typeof document === "undefined") return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cloud.umami.is/script.js";
    s.defer = true;
    s.dataset.websiteId = id;
    s.dataset.autoTrack = "false";
    // Only the production host: never localhost, a preview or the Tauri webview.
    s.dataset.domains = "madar-pos.cloud";
    s.onload = () => resolve(window.umami);
    s.onerror = () => resolve(undefined); // an ad blocker: signup goes on untracked
    document.head.appendChild(s);
  });
}

/** A pageview with no name, else a named event. Never throws, never waits. */
export function track(name?: string, data?: Record<string, string>): void {
  ready ??= load();
  void ready.then((u) => u?.track(name, data)).catch(() => {});
}
