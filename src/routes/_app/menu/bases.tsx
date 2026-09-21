import { createFileRoute } from "@tanstack/react-router";
import { RecipeBasesPage } from "@/features/menu/recipe/bases-page";

export const Route = createFileRoute("/_app/menu/bases")({
  component: RecipeBasesPage,
});
