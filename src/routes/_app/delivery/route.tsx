import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/** Preserve branch + period scope when navigating between delivery sub-pages. */
const keepScope = (prev: Record<string, unknown>) => ({
  branchId: prev.branchId,
  preset: prev.preset,
  from: prev.from,
  to: prev.to,
});

function DeliveryLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const tabs: { to: string; label: string }[] = [
    { to: "/delivery/settings", label: t("delivery.tabs.settings", "Settings") },
    { to: "/delivery/zones", label: t("delivery.tabs.zones", "Zones") },
    { to: "/delivery/channels", label: t("delivery.tabs.channels", "Channel overrides") },
  ];

  return (
    <div className="flex flex-col">
      <nav className="mx-auto flex w-full max-w-[1400px] gap-1 overflow-x-auto px-4 pt-4 sm:px-6 lg:px-8">
        {tabs.map((tab) => {
          const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              search={keepScope}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                active ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/_app/delivery")({
  component: DeliveryLayout,
});
