import { createFileRoute } from "@tanstack/react-router";
import { loyaltyReportSearch } from "@/features/reports/search";
import { LoyaltyReportPage } from "@/features/reports/loyalty/loyalty-report-page";

export const Route = createFileRoute("/_app/reports/loyalty")({
  validateSearch: loyaltyReportSearch.validateSearch,
  beforeLoad: loyaltyReportSearch.beforeLoad,
  component: LoyaltyReportPage,
});
