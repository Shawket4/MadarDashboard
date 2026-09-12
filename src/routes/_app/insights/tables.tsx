import { createFileRoute } from "@tanstack/react-router";
import { TablesInsightsPage } from "@/features/insights/tables-page";

/** Table analytics — turns, covers, dwell and revenue per table and cover.
 *  Branch + period come from the global scope bar. */
export const Route = createFileRoute("/_app/insights/tables")({
  component: TablesInsightsPage,
});
