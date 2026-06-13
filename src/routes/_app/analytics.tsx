import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/analytics/analytics-page";

/** ?tab selects the report; ?gran sets the timeseries granularity. */
export const Route = createFileRoute("/_app/analytics")({
  validateSearch: (s: Record<string, unknown>): { tab?: string; gran?: string } => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
    gran: typeof s.gran === "string" ? s.gran : undefined,
  }),
  component: AnalyticsPage,
});
