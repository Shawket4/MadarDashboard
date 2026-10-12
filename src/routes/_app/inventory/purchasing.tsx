import { createFileRoute } from "@tanstack/react-router";
import { purchasingSearch } from "@/features/inventory/search";
import { PurchasingPage } from "@/features/inventory/purchasing-page";

export const Route = createFileRoute("/_app/inventory/purchasing")({
  validateSearch: purchasingSearch.validateSearch,
  beforeLoad: purchasingSearch.beforeLoad,
  component: PurchasingPage,
});
