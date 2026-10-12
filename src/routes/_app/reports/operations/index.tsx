import { createFileRoute } from "@tanstack/react-router";
import { operationsReportsSearch } from "@/features/reports/search";
import { OperationsReportsPage } from "@/features/reports/operations/operations-reports-page";

export const Route = createFileRoute("/_app/reports/operations/")({
  validateSearch: operationsReportsSearch.validateSearch,
  beforeLoad: operationsReportsSearch.beforeLoad,
  component: OperationsReportsPage,
});
