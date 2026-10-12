import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/orders/orders-page";
import { readTillSearch } from "@/features/orders/till-filter";
import { ordersSearch } from "@/features/orders/search";

/**
 * Filters + page live in the URL and are restored on return (features/orders/search.ts).
 * ?till=<id> (alias ?till_id= / ?shift_id=) filters to one till. ?order=<id> opens that
 * order's detail sheet (shareable deep link, never remembered).
 */
export const Route = createFileRoute("/_app/orders")({
  validateSearch: (s: Record<string, unknown>) => ({
    ...ordersSearch.validateSearch({ ...s, till: readTillSearch(s) }),
    order: typeof s.order === "string" ? s.order : undefined,
  }),
  beforeLoad: ordersSearch.beforeLoad,
  component: OrdersPage,
});
