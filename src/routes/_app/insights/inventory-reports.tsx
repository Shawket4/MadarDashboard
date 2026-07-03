import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/features/inventory/reports-page";

/** Inventory reports surfaced under Insights — renders the existing inventory
 *  reports feature (also reachable at /inventory/reports inside the Inventory
 *  section). Thin wrapper: no logic of its own. */
export const Route = createFileRoute("/_app/insights/inventory-reports")({
  component: ReportsPage,
});
