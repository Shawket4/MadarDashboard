import { createFileRoute } from "@tanstack/react-router";
import { ItemsPage } from "@/features/inventory/items-page";

export const Route = createFileRoute("/_app/inventory/items")({
  component: ItemsPage,
});
