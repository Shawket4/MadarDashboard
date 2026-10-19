/** Contact and link facts for the site. One place to change them. (The pages themselves: lib/pages.ts.) */
import { type Lang, type PageKey, LANGS, pageHref, isEnglishOnly } from "./pages";
import { APPS, APP_KEYS } from "@shared/apps";
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

export { APPS, APP_KEYS, DOWNLOADS_URL, downloadsHref, isLive, type AppKey } from "@shared/apps";
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
