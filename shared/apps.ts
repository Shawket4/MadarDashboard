/**
 * Every Madar app and where it is listed: one list for the marketing site
 * (`site/src/lib/site.ts` re-exports it) and the dashboard (Setup, the footer). A URL
 * shows that store's official badge wherever the app appears; an app with no URL reads
 * "coming soon". When an app goes live on a store, its URL here is the whole change,
 * plus the Flutter dashboard's copy (`dashboard_features/overview/lib/src/apps/apps.dart`).
 * Icons are `apps/icons/<key>.svg`, the badges `apps/stores/`, and each app's downloads
 * page as a QR code in `apps-qr.ts` (`scripts/app-qr`).
 */
export const APPS = {
  cashier: { appStore: "https://apps.apple.com/us/app/madar-cashier/id6815221877", googlePlay: null },
  kitchen: { appStore: null, googlePlay: null },
  dashboard: { appStore: null, googlePlay: null },
  dawam: { appStore: null, googlePlay: null },
} as const satisfies Record<string, { appStore: string | null; googlePlay: string | null }>;
export type AppKey = keyof typeof APPS;
export const APP_KEYS = Object.keys(APPS) as AppKey[];
/** Every build (Android APKs, Mac, Windows, Linux) lives on the downloads site, apart from this one. */
export const DOWNLOADS_URL = "https://downloads.madar-pos.cloud";
const DOWNLOAD_ID: Record<AppKey, string> = { cashier: "pos", kitchen: "kitchen", dashboard: "dashboard", dawam: "dawam" };
/** The downloads page in `lang`, with this app's card in the middle of the screen. */
export const downloadsHref = (lang: "en" | "ar", app: AppKey): string => `${DOWNLOADS_URL}/${lang === "ar" ? "ar/" : ""}?app=${DOWNLOAD_ID[app]}`;
/** An app is live once it is on at least one store. */
export const isLive = (app: AppKey): boolean => Boolean(APPS[app].appStore || APPS[app].googlePlay);
