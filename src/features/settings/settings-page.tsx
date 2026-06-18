import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ChevronRight, CreditCard, Languages, MessageCircle, Monitor, Moon, Sun } from "lucide-react";

import { Page } from "@/components/app/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuthStore } from "@/data/stores/auth.store";
import { useAppStore } from "@/data/stores/app.store";

const THEMES: { value: Theme; icon: typeof Sun; key: string; fallback: string }[] = [
  { value: "light", icon: Sun, key: "theme.light", fallback: "Light" },
  { value: "dark", icon: Moon, key: "theme.dark", fallback: "Dark" },
  { value: "system", icon: Monitor, key: "theme.system", fallback: "System" },
];

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const canManagePayments = role === "org_admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("nav.settings", "Settings")}</h1>
      </div>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {user ? (
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <Avatar className="size-12"><AvatarFallback className="text-base">{initials(user.name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><p className="font-bold">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.email ?? "—"}</p></div>
              {role ? <Badge variant="outline" className="border-transparent bg-info/15 text-info">{t(`roles.${role}`, role)}</Badge> : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="space-y-3 p-5">
            <div><p className="text-sm font-bold">{t("nav.appearance", "Appearance")}</p><p className="text-xs text-muted-foreground">{t("settings.themeHint", "Theme")}</p></div>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(({ value, icon: Icon, key, fallback }) => (
                <Button key={value} variant={theme === value ? "default" : "outline"} onClick={() => setTheme(value)}><Icon className="size-4" /> {t(key, fallback)}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div><p className="text-sm font-bold">{t("nav.language", "Language")}</p><p className="text-xs text-muted-foreground">{i18n.resolvedLanguage === "ar" ? "العربية" : "English"}</p></div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={language === "en" ? "default" : "outline"} onClick={() => setLanguage("en")}><Languages className="size-4" /> English</Button>
              <Button variant={language === "ar" ? "default" : "outline"} onClick={() => setLanguage("ar")}><Languages className="size-4" /> العربية</Button>
            </div>
          </CardContent>
        </Card>

        {canManagePayments ? (
          <Card>
            <CardContent className="p-0">
              <Link to="/settings/payment-methods" className="flex items-center justify-between p-5 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><CreditCard className="size-5" /></span>
                  <div><p className="text-sm font-bold">{t("settings.paymentMethods", "Payment Methods")}</p><p className="text-xs text-muted-foreground">{t("settings.paymentMethodsHint", "Manage payment methods available for checkout.")}</p></div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {isSuperAdmin ? (
          <Card>
            <CardContent className="p-0">
              <Link to="/settings/whatsapp" className="flex items-center justify-between p-5 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <span className="grid size-10 place-items-center rounded-lg bg-success/10 text-success"><MessageCircle className="size-5" /></span>
                  <div><p className="text-sm font-bold">{t("settings.whatsapp", "WhatsApp")}</p><p className="text-xs text-muted-foreground">{t("settings.whatsappHint", "Link the number that sends delivery OTP and order updates.")}</p></div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">S</span>
            <div className="flex-1"><p className="text-sm font-bold">{t("app.name", "Sufrix")}</p><p className={cn("text-xs text-muted-foreground")}>© 2026 Sufrix</p></div>
            <Badge variant="outline">v1.0.0</Badge>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
