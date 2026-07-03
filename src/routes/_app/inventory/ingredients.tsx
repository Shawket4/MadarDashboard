import { createFileRoute } from "@tanstack/react-router";
import { ItemsPage } from "@/features/inventory/items-page";

/** Inventory ▸ Ingredients — the inventory items feature, renamed user-facing
 *  to "Ingredients" to disambiguate from menu Items. */
export const Route = createFileRoute("/_app/inventory/ingredients")({
  component: ItemsPage,
});
