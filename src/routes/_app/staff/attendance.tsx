import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "@/features/staff/attendance-page";

export const Route = createFileRoute("/_app/staff/attendance")({
  component: AttendancePage,
});
