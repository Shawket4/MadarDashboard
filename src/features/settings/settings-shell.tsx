/**
 * The Settings shell: a persistent list of panes on one side, the pane itself
 * on the other.
 *
 * Rebuilt around a simple idea — configuration is a *place*, not a pile. The old
 * page was a stack of cards with the real settings scattered across five
 * top-level nav entries, so "where do I change the delivery fee" had no
 * answer you could guess. Now every rule the business sets lives under one
 * roof, grouped by what it affects, and each pane is its own route.
 *
 * On a phone the rail becomes the index: you see the list, tap through to a
 * pane, and the header takes you back — rather than a rail squeezed into
 * a column too narrow to read.
 */
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { Page } from "@/components/app/page";
import { useAuthStore } from "@/data/stores/auth.store";
import { cn } from "@/lib/utils";

import { visibleSettings } from "./settings-nav";

export function SettingsShell() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const groups = visibleSettings(role);
  const { pathname } = useLocation();
  // "/settings" is the index; anything deeper is a pane.
  const onIndex = pathname === "/settings" || pathname === "/settings/";

  return (
    <Page>
      <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* The rail. Hidden on small screens once you are inside a pane, so a
            phone shows one thing at a time instead of two half-things. */}
        <nav
          aria-label={t("nav.settings", "Settings")}
          className={cn("space-y-6", !onIndex && "hidden lg:block")}
        >
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t("nav.settings", "Settings")}
          </h1>
          {groups.map((group) => (
            <div key={group.labelKey} className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(group.labelKey, group.fallback)}
              </p>
              {group.items.map((item) => {
                const active =
                  item.to === "/settings"
                    ? onIndex
                    : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2 transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className="mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {t(item.labelKey, item.fallback)}
                      </span>
                      {/* The one-liner is what makes the rail navigable
                          without opening every pane to find out what it is. */}
                      <span className="block text-xs text-muted-foreground lg:hidden xl:block">
                        {t(item.descKey, item.desc)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={cn("min-w-0", onIndex && "hidden lg:block")}>
          {/* Back to the index — the phone's way out of a pane. */}
          {!onIndex ? (
            <Link
              to="/settings"
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground lg:hidden"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
              {t("nav.settings", "Settings")}
            </Link>
          ) : null}
          <Outlet />
        </div>
      </div>
    </Page>
  );
}
