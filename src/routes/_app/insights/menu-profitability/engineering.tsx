import { createFileRoute } from "@tanstack/react-router";
import { MenuEngineeringPage } from "@/features/menu-engineering/engineering-page";

/** Menu profitability ▸ Engineering. ?view=scatter|table, ?basis=snapshot|current. */
export const Route = createFileRoute("/_app/insights/menu-profitability/engineering")({
  validateSearch: (s: Record<string, unknown>): { view?: "scatter" | "table"; basis?: "snapshot" | "current" } => ({
    view: s.view === "table" ? "table" : s.view === "scatter" ? "scatter" : undefined,
    basis: s.basis === "current" ? "current" : s.basis === "snapshot" ? "snapshot" : undefined,
  }),
  component: MenuEngineeringPage,
});
