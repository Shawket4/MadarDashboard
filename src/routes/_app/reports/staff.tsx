import { createFileRoute } from "@tanstack/react-router";
import { StaffDisciplinePage } from "@/features/reports/staff/staff-discipline-page";

export const Route = createFileRoute("/_app/reports/staff")({
  component: StaffDisciplinePage,
});
