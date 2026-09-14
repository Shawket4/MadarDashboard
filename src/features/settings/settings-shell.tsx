/**
 * The Settings shell: one page header, a quiet list of panes at the start, and
 * the pane itself at reading width beside it.
 *
 * Configuration is a *place*, not a pile: every rule the business sets lives
 * under one roof, grouped by what it affects, and each pane is its own route.
 *
 * On a phone the list becomes a picker above the pane — every pane (the index
 * included) stays one tap away without a rail squeezed into a narrow column.
 */
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";

import { EmbeddedPages, Page, PageHeader, PAGE_WIDTH_CLASS } from "@/components/app/page";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/data/stores/auth.store";
import { cn } from "@/lib/utils";

import { visibleSettings, type SettingsLeaf } from "./settings-nav";

const isActive = (item: SettingsLeaf, pathname: string, onIndex: boolean) =>
  item.to === "/settings" ? onIndex : pathname === item.to || pathname.startsWith(`${item.to}/`);

export function SettingsShell() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const groups = visibleSettings(role);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onIndex = pathname === "/settings" || pathname === "/settings/";

  const current = groups.flatMap((g) => g.items).find((i) => isActive(i, pathname, onIndex));

  return (
    <Page width="full">
      <PageHeader title={t("nav.settings", "Settings")} />

      {/* Phone / tablet: the pane list as a picker. */}
      <div className="lg:hidden">
        <Select value={current?.to ?? ""} onValueChange={(to) => void navigate({ to })}>
          <SelectTrigger className="w-full sm:w-80" aria-label={t("settings.pickPane", "Settings section")}>
            <SelectValue placeholder={t("nav.settings", "Settings")} />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group.labelKey}>
                <SelectLabel>{t(group.labelKey, group.fallback)}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.to} value={item.to}>
                    <item.icon className="size-4 text-muted-foreground" aria-hidden />
                    {t(item.labelKey, item.fallback)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[232px_minmax(0,1fr)]">
        <nav aria-label={t("nav.settings", "Settings")} className="hidden space-y-5 lg:sticky lg:top-4 lg:block">
          {groups.map((group) => (
            <div key={group.labelKey} className="space-y-0.5">
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {t(group.labelKey, group.fallback)}
              </p>
              {group.items.map((item) => {
                const active = isActive(item, pathname, onIndex);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg px-3 text-sm transition-colors duration-150 motion-reduce:transition-none",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                      active
                        ? "bg-accent font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {active ? <span aria-hidden className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-primary" /> : null}
                    <item.icon aria-hidden className="size-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey, item.fallback)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={cn("min-w-0 w-full", PAGE_WIDTH_CLASS.reading)}>
          <EmbeddedPages>
            <Outlet />
          </EmbeddedPages>
        </div>
      </div>
    </Page>
  );
}
