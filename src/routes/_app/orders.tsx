import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/orders/orders-page";
import { readTillSearch } from "@/features/orders/till-filter";

/** ?till=<id> (alias ?shift_id=) filters to one till. ?order=<id> opens that order's detail sheet (shareable deep link). */
export const Route = createFileRoute("/_app/orders")({
  validateSearch: (s: Record<string, unknown>): { order?: string; till?: string } => ({
    order: typeof s.order === "string" ? s.order : undefined,
    till: readTillSearch(s),
  }),
  component: OrdersPage,
});
