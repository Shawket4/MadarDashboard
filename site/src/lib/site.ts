/** Contact and link facts for the site. One place to change them. */
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
/**
 * Madar Cashier for Android until its Google Play listing is live: a direct, signed APK.
 * Null shows "ask us on WhatsApp" instead of a download. When Play goes live, set
 * APPS.cashier.googlePlay and set this back to null.
 */
export const CASHIER_APK_URL: string | null = null;
export const isLive = (app: AppKey): boolean => Boolean(APPS[app].appStore || APPS[app].googlePlay);
/** Every store listing, for the organisation's `sameAs`. */
export const STORE_URLS: string[] = APP_KEYS.flatMap((k) => [APPS[k].appStore, APPS[k].googlePlay]).filter(
  (u): u is string => typeof u === "string",
);

export const LEGAL_URL = "https://legal.madar-pos.cloud";

export type Lang = "en" | "ar";
export const LANGS: readonly Lang[] = ["en", "ar"] as const;

const WA_TEXT: Record<Lang, string> = {
  en: "Hi Madar, I run a café and I'd like to hear about the free first month.",
  ar: "أهلًا مدار، عندي كافيه وحابب أعرف أكتر عن أول شهر المجاني.",
};

/** WhatsApp click-to-chat, prefilled in the page's language (or with `text`). */
export function whatsappHref(lang: Lang, text = WA_TEXT[lang]): string {
  return `https://wa.me/${PHONE_E164.replace("+", "")}?text=${encodeURIComponent(text)}`;
}

export type PageKey = "home" | "features" | "pricing" | "faq" | "about" | "contact" | "developers" | "free";

const PAGE_PATH: Record<PageKey, string> = {
  home: "",
  features: "features/",
  pricing: "pricing/",
  faq: "faq/",
  about: "about/",
  contact: "contact/",
  developers: "developers/",
  free: "free/",
};

/** Site-relative URL of a page in a language, e.g. /ar/pricing/ */
export function pageHref(lang: Lang, page: PageKey, hash = ""): string {
  // The Free page is the campaign landing page: /free/en/, /free/ar/ (language last).
  const base = page === "free" ? `/free/${lang}/` : `/${lang}/${PAGE_PATH[page]}`;
  return `${base}${hash ? `#${hash}` : ""}`;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export const otherLang = (lang: Lang): Lang => (lang === "en" ? "ar" : "en");

/** Pages written in English only (no Arabic copy): their language switch leads to the Arabic home. */
export const isEnglishOnly = (page: PageKey | "notFound"): boolean => page === "developers";

/** The language switch's target: this page in the other language, or that language's home. */
export function switchHref(lang: Lang, page: PageKey | "notFound"): string {
  const other = otherLang(lang);
  return page === "notFound" || isEnglishOnly(page) ? pageHref(other, "home") : pageHref(other, page);
}
