import { createFileRoute } from "@tanstack/react-router";
import { payrollSearch } from "@/features/dawam/search";
import { PayrollPage } from "@/features/dawam/payroll-page";

export const Route = createFileRoute("/_app/staff/payroll")({
  validateSearch: payrollSearch.validateSearch,
  beforeLoad: payrollSearch.beforeLoad,
  component: PayrollPage,
});
