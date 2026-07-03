import { createFileRoute } from "@tanstack/react-router";
import { MenuAdvisorPage } from "@/features/menu-advisor/advisor-page";

/** Menu profitability ▸ Advisor — data-driven pricing/bundle suggestions. */
export const Route = createFileRoute("/_app/insights/menu-profitability/advisor")({
  component: MenuAdvisorPage,
});
