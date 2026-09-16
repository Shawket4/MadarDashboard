import { createFileRoute } from "@tanstack/react-router";
import { TaxReportPage } from "@/features/reports/legal/tax-report-page";

export const Route = createFileRoute("/_app/reports/legal")({
  component: TaxReportPage,
});
