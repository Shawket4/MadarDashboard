import i18n, { type BackendModule, type ResourceKey } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Each locale is its own chunk (en ≈ 350 kB, ar ≈ 470 kB of JSON): boot fetches
 * only the active one, and a switch fetches the other before it switches.
 * i18next's own backend contract does the waiting: `changeLanguage` resolves,
 * and `languageChanged` fires, only once the new language's strings are in,
 * so a switch never paints raw keys.
 */
const LOCALES: Record<SupportedLanguage, () => Promise<{ default: ResourceKey }>> = {
  en: () => import("./locales/en.json"),
  ar: () => import("./locales/ar.json"),
};

/**
 * Test seam: vitest's setup hands the parsed files in, so a test (and a module
 * re-imported after vi.resetModules) has both languages synchronously.
 */
const testLocales = (globalThis as { __MADAR_LOCALES__?: Record<string, ResourceKey> }).__MADAR_LOCALES__;

const lazyLocales: BackendModule = {
  type: "backend",
  init() {},
  read(language, _namespace, callback) {
    const preloaded = testLocales?.[language];
    if (preloaded) return callback(null, preloaded);
    const load = LOCALES[language as SupportedLanguage];
    if (!load) return callback(null, {});
    load().then(
      (m) => callback(null, m.default),
      (err: unknown) => callback(err instanceof Error ? err : new Error(String(err)), null),
    );
  },
};

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

/**
 * Resolves once the active language's strings are in. Each bundle's main.tsx
 * awaits it (beside the rules) before its first render.
 */
export const i18nReady: Promise<unknown> = i18n
  .use(lazyLocales)
  .use(detector)
  .use(initReactI18next)
  .init({
    // Arabic carries every key English has (locales.test.ts), so an Arabic
    // session needs no English fallback and never downloads it.
    fallbackLng: (code) => (code === "ar" ? [] : ["en"]),
    // Detect now, not on a timer: the stores read the language as they are
    // created (the strings themselves still arrive through the backend).
    initAsync: false,
    preload: testLocales ? Object.keys(testLocales) : false,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      // `?lang=ar` first: the marketing site's sign-up links carry the page's language,
      // and the pick is cached like a manual switch.
      order: ["querystring", "localStorage", "navigatorLanguageOnly"],
      lookupQuerystring: "lang",
      caches: ["localStorage"],
      lookupLocalStorage: "madar.lang",
    },
    returnNull: false,
  });

/** Sync <html lang> and <html dir> with the active language. */
export const applyHtmlDir = (lang: string) => {
  if (typeof document === "undefined") return;
  const isAr = lang.startsWith("ar");
  document.documentElement.lang = isAr ? "ar" : "en";
  document.documentElement.dir = isAr ? "rtl" : "ltr";
};

applyHtmlDir(i18n.resolvedLanguage ?? i18n.language ?? "en");
i18n.on("languageChanged", applyHtmlDir);
void i18nReady.then(() => applyHtmlDir(i18n.resolvedLanguage ?? i18n.language ?? "en"));

export default i18n;
