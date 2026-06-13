import { createFileRoute } from "@tanstack/react-router";
import { MenuItemsPage } from "@/features/menu/menu-items-page";

export const Route = createFileRoute("/_app/menu/items")({
  component: MenuItemsPage,
});
