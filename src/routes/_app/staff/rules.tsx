import { createFileRoute } from "@tanstack/react-router";
import { AttendanceRulesPage } from "@/features/staff/attendance-rules-page";

export const Route = createFileRoute("/_app/staff/rules")({
  component: AttendanceRulesPage,
});
