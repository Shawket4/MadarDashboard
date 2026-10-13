import { createFileRoute } from "@tanstack/react-router";
import { MenuItemsPage } from "@/features/menu/menu-items-page";
import { menuItemsSearch } from "@/features/menu/search";

/** Menu › Items. Tab, filters, search and page live in the URL and are restored on return. */
export const Route = createFileRoute("/_app/menu/items")({
  validateSearch: menuItemsSearch.validateSearch,
  beforeLoad: menuItemsSearch.beforeLoad,
  component: MenuItemsPage,
});
