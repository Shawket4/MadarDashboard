import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useMounted } from "@/shared/hooks/use-mounted";

export function ThemeToggle({ side = "top" }: { side?: "top" | "right" | "bottom" | "left" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const mounted = useMounted();

  // `resolvedTheme` gives us the actual rendered theme — "light" | "dark" —
  // after next-themes resolves "system" against the OS preference. Before the
  // component mounts it's undefined, which would render the wrong icon; we show
  // a neutral placeholder for that single frame to avoid the first-click bug.
  if (!mounted) {
    return (
      <Button variant="ghost" size="iconSm" aria-hidden>
        <Sun />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="iconSm" onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{isDark ? t("nav.lightMode") : t("nav.darkMode")}</TooltipContent>
    </Tooltip>
  );
}
