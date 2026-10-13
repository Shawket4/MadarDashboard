import { createFileRoute } from "@tanstack/react-router";
import { ingredientsSearch } from "@/features/inventory/search";
import { ItemsPage } from "@/features/inventory/items-page";

/** Inventory ▸ Ingredients — the inventory items feature, renamed user-facing
 *  to "Ingredients" to disambiguate from menu Items. */
export const Route = createFileRoute("/_app/inventory/ingredients")({
  validateSearch: ingredientsSearch.validateSearch,
  beforeLoad: ingredientsSearch.beforeLoad,
  component: ItemsPage,
});
