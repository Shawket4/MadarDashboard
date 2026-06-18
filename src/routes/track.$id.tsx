import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { OrderTrackingPage } from "@/features/order-tracking/tracking-page";

// Public, unauthenticated order tracking (deep-link: /track/<deliveryOrderId>).
// Reached automatically after placement and from the WhatsApp tracking link.
// No beforeLoad — the order id is an opaque capability; the endpoint is public.
const searchSchema = z.object({
  // Pre-submit estimate (piastres) carried from checkout to flag a reprice.
  est: z.number().optional(),
});

export const Route = createFileRoute("/track/$id")({
  validateSearch: searchSchema,
  component: function OrderTrackingRoute() {
    const { id } = Route.useParams();
    const { est } = Route.useSearch();
    return <OrderTrackingPage id={id} estimate={est ?? null} />;
  },
});
