import { createFileRoute } from "@tanstack/react-router";
import { scheduleSearch } from "@/features/dawam/search";
import { SchedulePage } from "@/features/dawam/schedule-page";

export const Route = createFileRoute("/_app/staff/schedule")({
  validateSearch: scheduleSearch.validateSearch,
  beforeLoad: scheduleSearch.beforeLoad,
  component: SchedulePage,
});
