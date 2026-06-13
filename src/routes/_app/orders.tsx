import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/orders/orders-page";

/** ?order=<id> opens that order's detail sheet (shareable deep link). */
export const Route = createFileRoute("/_app/orders")({
  validateSearch: (s: Record<string, unknown>): { order?: string } => ({
    order: typeof s.order === "string" ? s.order : undefined,
  }),
  component: OrdersPage,
});
