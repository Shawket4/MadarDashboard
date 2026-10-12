import { createFileRoute } from "@tanstack/react-router";
import { employeesSearch } from "@/features/staff/search";
import { EmployeesPage } from "@/features/staff/employees-page";

export const Route = createFileRoute("/_app/staff/employees")({
  validateSearch: employeesSearch.validateSearch,
  beforeLoad: employeesSearch.beforeLoad,
  component: EmployeesPage,
});
