import { createFileRoute } from "@tanstack/react-router";
import { staffReportsSearch } from "@/features/dawam/search";
import { StaffReportsPage } from "@/features/dawam/reports-page";

export const Route = createFileRoute("/_app/staff/reports")({
  validateSearch: staffReportsSearch.validateSearch,
  beforeLoad: staffReportsSearch.beforeLoad,
  component: StaffReportsPage,
});
