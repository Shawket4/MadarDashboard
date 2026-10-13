import { createFileRoute } from "@tanstack/react-router";
import { wasteSearch } from "@/features/inventory/search";
import { WastePage } from "@/features/inventory/waste-page";

export const Route = createFileRoute("/_app/inventory/waste")({
  validateSearch: wasteSearch.validateSearch,
  beforeLoad: wasteSearch.beforeLoad,
  component: WastePage,
});
