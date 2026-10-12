import { createFileRoute } from "@tanstack/react-router";
import { StationsPage } from "@/features/kitchen-stations/stations-page";
import { kitchenStationsSearch } from "@/features/kitchen-stations/search";

export const Route = createFileRoute("/_app/settings/kitchen-stations")({
  validateSearch: kitchenStationsSearch.validateSearch,
  beforeLoad: kitchenStationsSearch.beforeLoad,
  component: StationsPage,
});
