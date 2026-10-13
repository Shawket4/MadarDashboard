import { createFileRoute } from "@tanstack/react-router";
import { countsSearch } from "@/features/inventory/search";
import { CountsPage } from "@/features/inventory/counts-page";

export const Route = createFileRoute("/_app/inventory/counts")({
  validateSearch: countsSearch.validateSearch,
  beforeLoad: countsSearch.beforeLoad,
  component: CountsPage,
});
