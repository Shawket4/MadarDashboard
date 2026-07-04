import { createFileRoute } from "@tanstack/react-router";
import { ProfitabilityPage } from "@/features/insights/profitability-page";

/** Menu profitability — the margin ledger, flags, and the decision log.
 *  Branch + period come from the global scope bar (nil-UUID = all branches). */
export const Route = createFileRoute("/_app/insights/profitability")({
  component: ProfitabilityPage,
});
