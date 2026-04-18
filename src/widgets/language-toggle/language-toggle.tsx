import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useAppStore } from "@/shared/auth/app-store";

export function LanguageToggle({ side = "top" }: { side?: "top" | "right" | "bottom" | "left" }) {
  const { t, i18n } = useTranslation();
  const setLang = useAppStore((s) => s.setLanguage);
  const current = (i18n.resolvedLanguage ?? "en") as "en" | "ar";
  const target = current === "en" ? "ar" : "en";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="iconSm" onClick={() => setLang(target)}>
          <Languages />
          <span className="sr-only">{t("nav.language")}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{target === "ar" ? "العربية" : "English"}</TooltipContent>
    </Tooltip>
  );
}
