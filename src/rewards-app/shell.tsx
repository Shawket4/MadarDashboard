/**
 * Rewards by Madar's frame: its own header (the Rewards lockup, the period and
 * shop, theme, language, the account), its own navigation and nothing of the
 * Madar dashboard's sidebar. Desktop: tabs under the brand. Phone: a bottom
 * bar of four places and "More", where a thumb is.
 */
import { useState } from "react";
import { Outlet, useRouterState, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ExternalLink, LayoutGrid, MonitorSmartphone } from "lucide-react";

import { Link } from "@/components/app/link";
import { ModuleGate } from "@/components/app/module-gate";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ScopeBar, ScopeBarMobile } from "@/components/layout/scope-bar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { REWARDS_LEAVES, leafVisible, type NavLeaf } from "@/config/nav";
import { env } from "@/data/config/env";
import { useAuthz } from "@/data/authz/use-authz";
import { useSyncTimezone } from "@/data/scope/use-timezone";
import { useUrlScope, type ScopeUrlSearch } from "@/data/scope/use-url-scope";
import { useOrgModules } from "@/hooks/use-org-modules";
import { usePlan, useSyncPlan } from "@/hooks/use-plan";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";
import { NavPrefetchProvider } from "@/lib/prefetch/nav-context";
import { cn } from "@/lib/utils";

import { RewardsLockup } from "./brand";
import { INTERNAL } from "./paths";

/** The four places on a phone's bar; the rest are under More. */
const PHONE_BAR = [INTERNAL, `${INTERNAL}/members`, `${INTERNAL}/notifications`, `${INTERNAL}/card`];

/** Shorter names for the phone bar, where four share 360px. */
const SHORT: Record<string, [string, string]> = {
  [INTERNAL]: ["rewardsApp.nav.overview", "Overview"],
  [`${INTERNAL}/members`]: ["rewardsApp.nav.members", "Members"],
  [`${INTERNAL}/notifications`]: ["rewardsApp.nav.messages", "Messages"],
  [`${INTERNAL}/card`]: ["rewardsApp.nav.card", "Card"],
};

/** The scope travels with every navigation, as in the dashboard. */
const keepScope = (prev: Record<string, unknown>) => ({
  branchId: prev.branchId,
  preset: prev.preset,
  from: prev.from,
  to: prev.to,
});

function useActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) =>
    to === INTERNAL ? pathname === INTERNAL || pathname === `${INTERNAL}/` : pathname === to || pathname.startsWith(`${to}/`);
}

function useLeaves(): NavLeaf[] {
  const authz = useAuthz();
  const modules = useOrgModules();
  const plan = usePlan();
  return REWARDS_LEAVES.filter((l) => leafVisible(l, authz, modules, false, plan));
}

export function RewardsShell() {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as ScopeUrlSearch;
  const warmRoute = useRoutePrefetch();
  useSyncTimezone();
  useSyncPlan();
  useUrlScope(search);
  const leaves = useLeaves();
  const isActive = useActive();
  const [more, setMore] = useState(false);

  const bar = leaves.filter((l) => PHONE_BAR.includes(l.to));
  const rest = leaves.filter((l) => !PHONE_BAR.includes(l.to));

  return (
    <NavPrefetchProvider warm={warmRoute}>
      <div className="flex min-h-dvh flex-col">
        <header className="safe-top sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:px-6">
            <Link to={INTERNAL} search={keepScope} className="min-w-0 shrink rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <RewardsLockup />
            </Link>
            <div className="ms-auto flex shrink-0 items-center gap-1">
              <div className="hidden lg:block">
                <ScopeBar />
              </div>
              <ScopeBarMobile className="lg:hidden" />
              <ThemeToggle />
              <LanguageToggle />
              <UserMenu>
                <AccountLinks />
              </UserMenu>
            </div>
          </div>
          {/* Desktop and tablet: the places as tabs under the brand. */}
          <nav aria-label={t("rewardsApp.nav.label", "Rewards")} className="mx-auto hidden w-full max-w-7xl px-3 sm:px-6 md:block">
            <ul className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
              {leaves.map((l) => (
                <li key={l.to} className="shrink-0">
                  <Link
                    to={l.to}
                    search={keepScope}
                    aria-current={isActive(l.to) ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      isActive(l.to) && "border-foreground text-foreground",
                    )}
                  >
                    <l.icon className="size-4" aria-hidden />
                    {t(l.labelKey, l.fallback)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* Room under the content for the phone bar. */}
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6">
          <ModuleGate>
            <Outlet />
          </ModuleGate>
        </main>

        {/* Phone: four places and More. */}
        <nav
          aria-label={t("rewardsApp.nav.label", "Rewards")}
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
        >
          <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${bar.length + 1}, minmax(0, 1fr))` }}>
            {bar.map((l) => {
              const [key, fallback] = SHORT[l.to] ?? [l.labelKey, l.fallback];
              const active = isActive(l.to);
              return (
                <li key={l.to} className="min-w-0">
                  <Link
                    to={l.to}
                    search={keepScope}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground outline-none",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                      active && "text-foreground",
                    )}
                  >
                    <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-muted")}>
                      <l.icon className="size-5" aria-hidden />
                    </span>
                    <span className="max-w-full truncate">{t(key, fallback)}</span>
                  </Link>
                </li>
              );
            })}
            <li className="min-w-0">
              <button
                type="button"
                onClick={() => setMore(true)}
                aria-haspopup="dialog"
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground outline-none",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                  rest.some((l) => isActive(l.to)) && "text-foreground",
                )}
              >
                <span className={cn("grid h-7 w-12 place-items-center rounded-full", rest.some((l) => isActive(l.to)) && "bg-muted")}>
                  <LayoutGrid className="size-5" aria-hidden />
                </span>
                <span className="max-w-full truncate">{t("rewardsApp.nav.more", "More")}</span>
              </button>
            </li>
          </ul>
        </nav>

        <Sheet open={more} onOpenChange={setMore}>
          <SheetContent side="bottom" className="gap-0 rounded-t-[28px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
            <span aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            <SheetTitle className="px-2 text-lg font-semibold">{t("rewardsApp.nav.more", "More")}</SheetTitle>
            <SheetDescription className="sr-only">{t("rewardsApp.nav.moreHint", "The rest of Rewards by Madar")}</SheetDescription>
            <ul className="mt-2 flex flex-col">
              {rest.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    search={keepScope}
                    onClick={() => setMore(false)}
                    aria-current={isActive(l.to) ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      isActive(l.to) && "bg-muted",
                    )}
                  >
                    <l.icon className="size-5 text-muted-foreground" aria-hidden />
                    {t(l.labelKey, l.fallback)}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="/counter"
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <MonitorSmartphone className="size-5 text-muted-foreground" aria-hidden />
                  {t("rewardsApp.counter", "Counter")}
                </a>
              </li>
              {env.VITE_DASHBOARD_URL ? (
                <li>
                  <a
                    href={env.VITE_DASHBOARD_URL}
                    target="_blank"
                    rel="noopener"
                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <ExternalLink className="size-5 text-muted-foreground rtl:-scale-x-100" aria-hidden />
                    {t("rewardsApp.openDashboard", "Madar dashboard")}
                  </a>
                </li>
              ) : null}
            </ul>
          </SheetContent>
        </Sheet>
      </div>
    </NavPrefetchProvider>
  );
}

/** The account menu's links: the counter on this host, and the Madar dashboard. */
function AccountLinks() {
  const { t } = useTranslation();
  return (
    <>
      <DropdownMenuItem asChild>
        <a href="/counter">
          <MonitorSmartphone className="size-4" />
          {t("rewardsApp.counter", "Counter")}
        </a>
      </DropdownMenuItem>
      {env.VITE_DASHBOARD_URL ? (
        <DropdownMenuItem asChild>
          <a href={env.VITE_DASHBOARD_URL} target="_blank" rel="noopener">
            <ExternalLink className="size-4 rtl:-scale-x-100" />
            {t("rewardsApp.openDashboard", "Madar dashboard")}
          </a>
        </DropdownMenuItem>
      ) : null}
    </>
  );
}
