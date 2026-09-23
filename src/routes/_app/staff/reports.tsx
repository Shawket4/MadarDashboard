import { createFileRoute } from "@tanstack/react-router";
import { StaffReportsPage } from "@/features/dawam/reports-page";

export const Route = createFileRoute("/_app/staff/reports")({
  component: StaffReportsPage,
});
