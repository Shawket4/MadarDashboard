import { createFileRoute } from "@tanstack/react-router";
import { inventoryReportsSearch } from "@/features/inventory/search";
import { InventoryReportsPage } from "@/features/inventory/inventory-reports-page";

export const Route = createFileRoute("/_app/reports/inventory")({
  validateSearch: inventoryReportsSearch.validateSearch,
  beforeLoad: inventoryReportsSearch.beforeLoad,
  component: InventoryReportsPage,
});
