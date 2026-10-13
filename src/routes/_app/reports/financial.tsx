import { createFileRoute } from "@tanstack/react-router";
import { financialReportsSearch } from "@/features/reports/search";
import { FinancialReportsPage } from "@/features/reports/financial/financial-reports-page";

export const Route = createFileRoute("/_app/reports/financial")({
  validateSearch: financialReportsSearch.validateSearch,
  beforeLoad: financialReportsSearch.beforeLoad,
  component: FinancialReportsPage,
});
