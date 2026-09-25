import { useTranslation } from "react-i18next";
import type { Lang } from "./time";

/** The app language as the kit's two-value `Lang`, plus the text direction. */
export function useLang(): { lang: Lang; dir: "ltr" | "rtl" } {
  const { i18n } = useTranslation();
  const lang: Lang = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar") ? "ar" : "en";
  return { lang, dir: lang === "ar" ? "rtl" : "ltr" };
}
