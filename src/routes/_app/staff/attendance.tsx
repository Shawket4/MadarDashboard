import { createFileRoute } from "@tanstack/react-router";
import { attendanceSearch } from "@/features/staff/search";
import { AttendancePage } from "@/features/staff/attendance-page";

export const Route = createFileRoute("/_app/staff/attendance")({
  validateSearch: attendanceSearch.validateSearch,
  beforeLoad: attendanceSearch.beforeLoad,
  component: AttendancePage,
});
