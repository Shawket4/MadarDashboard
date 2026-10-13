import { createFileRoute } from "@tanstack/react-router";
import { tillsReportSearch } from "@/features/reports/search";
import { TillSessionsPage } from "@/features/reports/tills/till-sessions-page";

export const Route = createFileRoute("/_app/reports/tills")({
  validateSearch: tillsReportSearch.validateSearch,
  beforeLoad: tillsReportSearch.beforeLoad,
  component: TillSessionsPage,
});
