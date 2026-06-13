import { createFileRoute } from "@tanstack/react-router";
import { PurchasingPage } from "@/features/inventory/purchasing-page";

export const Route = createFileRoute("/_app/inventory/purchasing")({
  component: PurchasingPage,
});
