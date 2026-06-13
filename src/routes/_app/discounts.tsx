import { createFileRoute } from "@tanstack/react-router";
import { DiscountsPage } from "@/features/discounts/discounts-page";

/** ?edit=<id>|new opens the discount editor. */
export const Route = createFileRoute("/_app/discounts")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: DiscountsPage,
});
