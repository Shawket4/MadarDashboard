import { createFileRoute } from "@tanstack/react-router";
import { StaffPoolReportPage } from "@/features/staff-pool/staff-pool-report-page";

export const Route = createFileRoute("/_app/reports/staff-pool")({
  component: StaffPoolReportPage,
});
