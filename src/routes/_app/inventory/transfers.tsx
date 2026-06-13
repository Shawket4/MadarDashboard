import { createFileRoute } from "@tanstack/react-router";
import { TransfersPage } from "@/features/inventory/transfers-page";

export const Route = createFileRoute("/_app/inventory/transfers")({
  component: TransfersPage,
});
