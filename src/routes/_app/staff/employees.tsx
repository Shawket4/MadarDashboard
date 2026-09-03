import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "@/features/staff/employees-page";

export const Route = createFileRoute("/_app/staff/employees")({
  component: EmployeesPage,
});
