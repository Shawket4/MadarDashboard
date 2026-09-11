import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * The phone's languages, in the phone's order, with regions stripped.
 *
 * THE BUG THIS FIXES: an English handset was being served Arabic. i18next looks
 * for an EXACT member of `supportedLngs` across the whole of
 * `navigator.languages` before it tries stripping regions — so a phone
 * reporting `["en-GB", "ar"]` skipped past `en-GB`, which is not literally
 * `"en"`, and matched the bare `"ar"` in second place. That is an ordinary
 * English phone in Egypt with Arabic added, and the preference ORDER — the
 * entire meaning of that list — was being overruled by the exactness of a later
 * entry.
 *
 * Normalising here rather than with `nonExplicitSupportedLngs` deliberately.
 * That option fixes the order but leaves the active language as `en-GB` or
 * `ar-EG`, and a dozen places compare `i18n.language === "ar"` exactly — so an
 * Arabic phone would have started rendering left-to-right. Handing i18next
 * codes it already understands keeps the language exactly `en` or `ar`
 * everywhere, which is what the rest of the app has always assumed.
 */
const navigatorLanguageOnly = {
  name: "navigatorLanguageOnly",
  lookup(): string[] {
    const list =
      typeof navigator === "undefined"
        ? []
        : navigator.languages?.length
          ? [...navigator.languages]
          : [navigator.language];
    return list.filter(Boolean).map((l) => l.split("-")[0].toLowerCase());
  },
};

const detector = new LanguageDetector();
detector.addDetector(navigatorLanguageOnly);

void i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigatorLanguageOnly"],
      caches: ["localStorage"],
      lookupLocalStorage: "madar.lang",
    },
    returnNull: false,
  });

/** Sync <html lang> and <html dir> with the active language. */
export const applyHtmlDir = (lang: string) => {
  const isAr = lang.startsWith("ar");
  document.documentElement.lang = isAr ? "ar" : "en";
  document.documentElement.dir = isAr ? "rtl" : "ltr";
};

applyHtmlDir(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", applyHtmlDir);

export default i18n;
