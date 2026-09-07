/**
 * Theme, language, the signed-in account, and the legal links.
 *
 * The Settings index, because it is the only pane that is about THIS DEVICE
 * rather than the business — and the thing someone opening Settings with no
 * particular errand is most likely to want.
 */
import { useTranslation } from "react-i18next";
import { ExternalLink, Languages, Monitor, Moon, Sun } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuthStore } from "@/data/stores/auth.store";
import { useAppStore } from "@/data/stores/app.store";
import { LEGAL_URLS } from "@/config/legal";

const THEMES: { value: Theme; icon: typeof Sun; key: string; fallback: string }[] = [
  { value: "light", icon: Sun, key: "theme.light", fallback: "Light" },
  { value: "dark", icon: Moon, key: "theme.dark", fallback: "Dark" },
  { value: "system", icon: Monitor, key: "theme.system", fallback: "System" },
];

export function AppearancePane() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <div className="max-w-2xl space-y-4">
      {user ? (
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Avatar className="size-12">
              <AvatarFallback className="text-base">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email ?? "—"}</p>
            </div>
            {role ? (
              <Badge variant="outline" className="border-transparent bg-info/15 text-info">
                {t(`roles.${role}`, role)}
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <p className="text-sm font-bold">{t("nav.appearance", "Appearance")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.themeHint", "Theme")}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, icon: Icon, key, fallback }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                onClick={() => setTheme(value)}
              >
                <Icon className="size-4" /> {t(key, fallback)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <p className="text-sm font-bold">{t("nav.language", "Language")}</p>
            <p className="text-xs text-muted-foreground">
              {i18n.resolvedLanguage === "ar" ? "العربية" : "English"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              onClick={() => setLanguage("en")}
            >
              <Languages className="size-4" /> English
            </Button>
            <Button
              variant={language === "ar" ? "default" : "outline"}
              onClick={() => setLanguage("ar")}
            >
              <Languages className="size-4" /> العربية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal documents live on their own static origin so they stay reachable
          when this app or the API is not — they are cited in the app store
          listings. Opened in a new tab to preserve any work in progress here. */}
      <Card>
        <CardContent className="p-0">
          {[
            { href: LEGAL_URLS.privacy, key: "legal.privacy", fallback: "Privacy Policy" },
            { href: LEGAL_URLS.terms, key: "legal.terms", fallback: "Terms of Service" },
            { href: LEGAL_URLS.retention, key: "legal.retention", fallback: "Data retention" },
            // "Delete your account" is deliberately NOT listed here. That
            // document is written for end users of the Dawam staff app and is
            // required by its Google Play listing; it describes removing a
            // personal app account, which is not something a manager does from
            // this dashboard. Linking it sent people to instructions that did
            // not apply to them.
          ].map((item, i) => (
            <a
              key={item.key}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between p-5 transition-colors hover:bg-muted/50",
                i > 0 && "border-t border-border/60",
              )}
            >
              <p className="text-sm font-bold">{t(item.key, item.fallback)}</p>
              <ExternalLink className="size-4 text-muted-foreground" />
            </a>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            M
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("app.name", "Madar")}</p>
            <p className="text-xs text-muted-foreground">© 2026 Madar</p>
          </div>
          <Badge variant="outline">v1.0.0</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
