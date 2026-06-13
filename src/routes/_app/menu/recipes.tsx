import { createFileRoute } from "@tanstack/react-router";
import { RecipesPage } from "@/features/recipes/recipes-page";

/** Deep-link support: ?item=<menuItemId> opens that drink, ?addon=<addonId> that add-on. */
export const Route = createFileRoute("/_app/menu/recipes")({
  validateSearch: (s: Record<string, unknown>): { item?: string; addon?: string } => ({
    item: typeof s.item === "string" ? s.item : undefined,
    addon: typeof s.addon === "string" ? s.addon : undefined,
  }),
  component: RecipesPage,
});
