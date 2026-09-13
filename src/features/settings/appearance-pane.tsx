/**
 * Theme, language, the signed-in account, and the legal links.
 *
 * The Settings index, because it is the only pane that is about THIS DEVICE
 * rather than the business — and the thing someone opening Settings with no
 * particular errand is most likely to want.
 */
import { useTranslation } from "react-i18next";
import { ExternalLink, FileText, Languages, Monitor, Moon, Sun } from "lucide-react";

import { ListCard, ListRow } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill } from "@/components/app/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuthStore } from "@/data/stores/auth.store";
import { useAppStore } from "@/data/stores/app.store";
import { LEGAL_URLS } from "@/config/legal";

import { PaneHeader } from "./pane-header";

const THEMES: { value: Theme; icon: typeof Sun; key: string; fallback: string }[] = [
  { value: "light", icon: Sun, key: "theme.light", fallback: "Light" },
  { value: "dark", icon: Moon, key: "theme.dark", fallback: "Dark" },
  { value: "system", icon: Monitor, key: "theme.system", fallback: "System" },
];

export function AppearancePane() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const current = THEMES.find((x) => x.value === theme) ?? THEMES[2];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <PaneHeader
          title={t("settings.appearance", "Appearance")}
          description={t("settings.appearanceDesc", "Theme and language for this device.")}
        />
        <ListCard>
          <ListRow
            icon={current.icon}
            title={t("settings.themeHint", "Theme")}
            trailing={
              <SegmentedControl
                value={theme}
                onChange={setTheme}
                options={THEMES.map(({ value, icon: Icon, key, fallback }) => ({
                  value,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon aria-hidden className="size-3.5" />
                      <span className="max-sm:sr-only">{t(key, fallback)}</span>
                    </span>
                  ),
                }))}
              />
            }
          />
          <ListRow
            icon={Languages}
            title={t("nav.language", "Language")}
            trailing={
              <SegmentedControl
                value={language}
                onChange={setLanguage}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                ]}
              />
            }
          />
        </ListCard>
      </div>

      {user ? (
        <div className="space-y-3">
          <SectionHeader title={t("settings.account", "Account")} />
          <ListCard>
            <ListRow
              leading={
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
                </Avatar>
              }
              title={user.name}
              meta={user.email ?? "—"}
              trailing={role ? <StatusPill tone="neutral">{t(`roles.${role}`, role)}</StatusPill> : null}
            />
          </ListCard>
        </div>
      ) : null}

      {/* Legal documents live on their own static origin so they stay reachable
          when this app or the API is not — they are cited in the app store
          listings. Opened in a new tab to preserve any work in progress here.
          "Delete your account" is deliberately NOT listed: that document is for
          end users of the Dawam staff app, not something a manager does here. */}
      <div className="space-y-3">
        <SectionHeader title={t("settings.about", "About")} />
        <ListCard>
          {[
            { href: LEGAL_URLS.privacy, key: "legal.privacy", fallback: "Privacy Policy" },
            { href: LEGAL_URLS.terms, key: "legal.terms", fallback: "Terms of Service" },
            { href: LEGAL_URLS.retention, key: "legal.retention", fallback: "Data retention" },
          ].map((item) => (
            <a
              key={item.key}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition-colors duration-150 hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:outline-none motion-reduce:transition-none"
            >
              <ListRow
                icon={FileText}
                title={t(item.key, item.fallback)}
                trailing={<ExternalLink aria-hidden className="size-4 text-muted-foreground" />}
              />
            </a>
          ))}
          <ListRow
            leading={
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground">
                M
              </span>
            }
            title={t("app.name", "Madar")}
            meta="© 2026 Madar"
            value="v1.0.0"
            numericValue
          />
        </ListCard>
      </div>
    </div>
  );
}
