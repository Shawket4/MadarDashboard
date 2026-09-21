import { createFileRoute } from "@tanstack/react-router";
import { PackagingRulesPage } from "@/features/menu/recipe/packaging-rules-page";

export const Route = createFileRoute("/_app/menu/packaging")({
  component: PackagingRulesPage,
});
