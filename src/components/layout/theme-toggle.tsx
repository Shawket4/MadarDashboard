import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string; fallback: string }[] = [
  { value: "light", icon: Sun, labelKey: "theme.light", fallback: "Light" },
  { value: "dark", icon: Moon, labelKey: "theme.dark", fallback: "Dark" },
  { value: "system", icon: Monitor, labelKey: "theme.system", fallback: "System" },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("theme.toggle", "Toggle theme")}>
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, icon: Icon, labelKey, fallback }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(theme === value && "bg-accent text-accent-foreground")}
          >
            <Icon className="size-4" />
            {t(labelKey, fallback)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
