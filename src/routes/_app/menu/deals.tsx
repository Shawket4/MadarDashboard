import { createFileRoute } from "@tanstack/react-router";
import { DealsPage } from "@/features/deals/deals-page";

/** Menu › Deals (mix & match, buy X get Y). `?edit=<id>|new` opens the dialog. */
export const Route = createFileRoute("/_app/menu/deals")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: DealsPage,
});
