import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/stores/app.store";

/** One-tap toggle between English and Arabic. Shows the language you'd switch to. */
export function LanguageToggle() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const next = language === "ar" ? "en" : "ar";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setLanguage(next)}
      aria-label={t("language.switch", "Switch language")}
      className="font-semibold"
    >
      <span className="text-xs">{next === "ar" ? "ع" : "EN"}</span>
    </Button>
  );
}
