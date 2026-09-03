import { createFileRoute } from "@tanstack/react-router";
import { WorkShiftsPage } from "@/features/staff/work-shifts-page";

export const Route = createFileRoute("/_app/staff/shifts")({
  component: WorkShiftsPage,
});
