import { createFileRoute } from "@tanstack/react-router";
import { transfersSearch } from "@/features/inventory/search";
import { TransfersPage } from "@/features/inventory/transfers-page";

export const Route = createFileRoute("/_app/inventory/transfers")({
  validateSearch: transfersSearch.validateSearch,
  beforeLoad: transfersSearch.beforeLoad,
  component: TransfersPage,
});
