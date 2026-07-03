import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SectionTabs } from "@/components/app/section-tabs";

/**
 * Menu profitability shell — a thin section wrapper that hosts the existing
 * Menu Engineering and Menu Advisor pages side-by-side under Insights. The
 * pages' internals are untouched; they render inside the shared SectionTabs +
 * <Outlet> below (each page brings its own <Page> container).
 */
function MenuProfitabilityLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <SectionTabs
        tabs={[
          { to: "/insights/menu-profitability/engineering", label: t("nav.engineering", "Menu Engineering") },
          { to: "/insights/menu-profitability/advisor", label: t("nav.menuAdvisor", "Menu Advisor") },
        ]}
      />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/_app/insights/menu-profitability")({
  component: MenuProfitabilityLayout,
});
