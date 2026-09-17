import { createFileRoute } from "@tanstack/react-router";
import { FinancialReportsPage } from "@/features/reports/financial/financial-reports-page";

export const Route = createFileRoute("/_app/reports/financial")({
  component: FinancialReportsPage,
});
