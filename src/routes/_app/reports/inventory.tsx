import { createFileRoute } from "@tanstack/react-router";
import { InventoryReportsPage } from "@/features/inventory/inventory-reports-page";

export const Route = createFileRoute("/_app/reports/inventory")({
  component: InventoryReportsPage,
});
