import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
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
      order: ["localStorage", "navigator"],
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
