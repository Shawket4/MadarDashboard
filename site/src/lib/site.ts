/** Contact and link facts for the site. One place to change them. (The pages themselves: lib/pages.ts.) */
import { type Lang, type PageKey, LANGS, pageHref, isEnglishOnly } from "./pages";
export { type Lang, type PageKey, LANGS, pageHref, isEnglishOnly };
export const SITE_URL = "https://get.madar-pos.cloud";

/** The dashboard merchants log in to (the old landing build's VITE_DASHBOARD_URL). */
export const DASHBOARD_URL = "https://madar-pos.cloud";

/** Self-signup for the Free plan, in the page's language (the dashboard reads `?lang=`). */
export const signupHref = (lang: Lang): string => `${DASHBOARD_URL}/signup?lang=${lang}`;

export const PHONE_DISPLAY = "+20 121 111 6899";
export const PHONE_E164 = "+201211116899";
export const PHONE_HREF = `tel:${PHONE_E164}`;

export const EMAIL = "shawket.4@icloud.com";
export const EMAIL_HREF = `mailto:${EMAIL}`;

export const INSTAGRAM = "https://www.instagram.com/madar.cloud/";
export const FACEBOOK = "https://www.facebook.com/profile.php?id=61591636403380";

/**
 * Every Madar app and where it is listed. A URL shows that store's official badge wherever
 * the app appears (the home page's apps, pricing, the footer); an app with no URL reads
 * "coming soon". When an app goes live on a store, its URL here is the whole change.
 */
export const APPS = {
  cashier: { appStore: "https://apps.apple.com/us/app/madar-cashier/id6815221877", googlePlay: null },
  kitchen: { appStore: null, googlePlay: null },
  dashboard: { appStore: null, googlePlay: null },
  dawam: { appStore: null, googlePlay: null },
} as const satisfies Record<string, { appStore: string | null; googlePlay: string | null }>;
export type AppKey = keyof typeof APPS;
export const APP_KEYS = Object.keys(APPS) as AppKey[];
/** An app is live once it is on at least one store. */
/** Every build (Android APKs, Mac, Windows, Linux) lives on the downloads site, apart from this one. */
export const DOWNLOADS_URL = "https://downloads.madar-pos.cloud";
const DOWNLOAD_ID: Record<AppKey, string> = { cashier: "pos", kitchen: "kitchen", dashboard: "dashboard", dawam: "dawam" };
/** The downloads page in `lang`, with this app's card in the middle of the screen. */
export const downloadsHref = (lang: Lang, app: AppKey): string => `${DOWNLOADS_URL}/${lang === "ar" ? "ar/" : ""}?app=${DOWNLOAD_ID[app]}`;
export const isLive = (app: AppKey): boolean => Boolean(APPS[app].appStore || APPS[app].googlePlay);
/** Every store listing, for the organisation's `sameAs`. */
export const STORE_URLS: string[] = APP_KEYS.flatMap((k): (string | null)[] => [APPS[k].appStore, APPS[k].googlePlay]).filter(
  (u): u is string => typeof u === "string",
);

export const LEGAL_URL = "https://legal.madar-pos.cloud";

const WA_TEXT: Record<Lang, string> = {
  en: "Hi Madar, I run a café and I'd like to hear about the free first month.",
  ar: "أهلًا مدار، عندي كافيه وحابب أعرف أكتر عن أول شهر المجاني.",
};

/** WhatsApp click-to-chat, prefilled in the page's language (or with `text`). */
export function whatsappHref(lang: Lang, text = WA_TEXT[lang]): string {
  return `https://wa.me/${PHONE_E164.replace("+", "")}?text=${encodeURIComponent(text)}`;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export const otherLang = (lang: Lang): Lang => (lang === "en" ? "ar" : "en");

/** The language switch's target: this page in the other language, or that language's home. */
export function switchHref(lang: Lang, page: PageKey | "notFound"): string {
  const other = otherLang(lang);
  return page === "notFound" || isEnglishOnly(page) ? pageHref(other, "home") : pageHref(other, page);
}
