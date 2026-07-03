import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SectionTabs } from "@/components/app/section-tabs";

function DeliveryLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <SectionTabs
        tabs={[
          { to: "/delivery/settings", label: t("delivery.tabs.settings", "Settings") },
          { to: "/delivery/zones", label: t("delivery.tabs.zones", "Zones") },
          { to: "/delivery/channels", label: t("delivery.tabs.channels", "Channel overrides") },
        ]}
      />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/_app/delivery")({
  component: DeliveryLayout,
});
