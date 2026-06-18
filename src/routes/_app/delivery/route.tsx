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
      <div className="w-full overflow-x-auto no-scrollbar">
        <nav className="mx-auto flex w-full max-w-[1400px] min-w-full border-b border-border px-4 sm:px-6 lg:px-8">
          {tabs.map((tab) => {
            const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                search={keepScope}
                className={cn(
                  "-mb-px inline-flex h-10 items-center px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150",
                  "border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-sm",
                  active
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/_app/delivery")({
  component: DeliveryLayout,
});
