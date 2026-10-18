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
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Link } from "@/components/app/link";
import { useNavIntent } from "@/lib/prefetch/nav-context";

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
import { useAuthz } from "@/data/authz/use-authz";
import { usePlan } from "@/hooks/use-plan";
import { useOrgModules } from "@/hooks/use-org-modules";
import { Reveal, useIndicator } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { visibleSettings, type SettingsLeaf } from "./settings-nav";

const isActive = (item: SettingsLeaf, pathname: string, onIndex: boolean) =>
  item.to === "/settings" ? onIndex : pathname === item.to || pathname.startsWith(`${item.to}/`);

export function SettingsShell() {
  const { t } = useTranslation();
  const groups = visibleSettings(useAuthz(), useOrgModules(), usePlan());
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // The phone picker's items warm their pane like the rail's links do.
  const nav = useNavIntent();
  const onIndex = pathname === "/settings" || pathname === "/settings/";

  const current = groups.flatMap((g) => g.items).find((i) => isActive(i, pathname, onIndex));

  // The active pane's bar glides down the list to the new pane.
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  useIndicator(navRef, barRef, "[data-active]", "y");

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
                  <SelectItem key={item.to} value={item.to} {...nav(item.to)}>
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
        <nav ref={navRef} aria-label={t("nav.settings", "Settings")} className="relative hidden space-y-5 lg:sticky lg:top-4 lg:block">
          {/* The sliding bar (useIndicator, vertical): 100px tall, scaled to the active link; the inner bar keeps its inset. */}
          <span ref={barRef} aria-hidden className="pointer-events-none absolute start-0 top-0 z-10 h-[100px] w-[3px] origin-top opacity-0">
            <span className="absolute inset-x-0 inset-y-[16.67%] rounded-full bg-primary" />
          </span>
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
                    data-active={active || undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg px-3 text-sm transition-colors duration-fast",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                      active
                        ? "bg-accent font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <item.icon aria-hidden className="size-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey, item.fallback)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={cn("min-w-0 w-full", PAGE_WIDTH_CLASS.reading)}>
          {/* Each pane rises in as it opens (product register). */}
          <Reveal replayKey={pathname}>
            <EmbeddedPages>
              <Outlet />
            </EmbeddedPages>
          </Reveal>
        </div>
      </div>
    </Page>
  );
}
