import { createFileRoute } from "@tanstack/react-router";
import { LoyaltyReportPage } from "@/features/reports/loyalty/loyalty-report-page";

export const Route = createFileRoute("/_app/reports/loyalty")({
  component: LoyaltyReportPage,
});
