import { createFileRoute } from "@tanstack/react-router";
import { rulesSearch } from "@/features/staff/search";
import { AttendanceRulesPage } from "@/features/staff/attendance-rules-page";

export const Route = createFileRoute("/_app/staff/rules")({
  validateSearch: rulesSearch.validateSearch,
  beforeLoad: rulesSearch.beforeLoad,
  component: AttendanceRulesPage,
});
