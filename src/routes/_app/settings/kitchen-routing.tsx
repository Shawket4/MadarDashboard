import { createFileRoute } from "@tanstack/react-router";
import { RoutingPage } from "@/features/kitchen-stations/routing-page";
import { kitchenRoutingSearch } from "@/features/kitchen-stations/search";

export const Route = createFileRoute("/_app/settings/kitchen-routing")({
  validateSearch: kitchenRoutingSearch.validateSearch,
  beforeLoad: kitchenRoutingSearch.beforeLoad,
  component: RoutingPage,
});
