import { createFileRoute } from "@tanstack/react-router";
import { discountsSearch } from "@/features/discounts/search";
import { DiscountsPage } from "@/features/discounts/discounts-page";

/** ?edit=<id>|new opens the discount editor. */
export const Route = createFileRoute("/_app/discounts")({
  validateSearch: (s: Record<string, unknown>) => ({
    ...discountsSearch.validateSearch(s),
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  beforeLoad: discountsSearch.beforeLoad,
  component: DiscountsPage,
});
