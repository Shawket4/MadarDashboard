import { createFileRoute } from "@tanstack/react-router";
import { todaySearch } from "@/features/inventory/search";
import { TodayPage } from "@/features/inventory/today-page";

export const Route = createFileRoute("/_app/inventory/today")({
  validateSearch: todaySearch.validateSearch,
  beforeLoad: todaySearch.beforeLoad,
  component: TodayPage,
});
