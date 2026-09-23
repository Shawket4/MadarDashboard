import { createFileRoute } from "@tanstack/react-router";
import { PayrollPage } from "@/features/dawam/payroll-page";

export const Route = createFileRoute("/_app/staff/payroll")({
  component: PayrollPage,
});
