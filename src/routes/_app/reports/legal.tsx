import { createFileRoute } from "@tanstack/react-router";
import { legalReportsSearch } from "@/features/reports/search";
import { LegalReportsPage } from "@/features/reports/legal/legal-reports-page";

export const Route = createFileRoute("/_app/reports/legal")({
  validateSearch: legalReportsSearch.validateSearch,
  beforeLoad: legalReportsSearch.beforeLoad,
  component: LegalReportsPage,
});
