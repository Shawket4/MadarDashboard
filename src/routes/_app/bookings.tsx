import { createFileRoute } from "@tanstack/react-router";
import { BookingsPage } from "@/features/bookings/bookings-page";
import { bookingsSearch } from "@/features/bookings/search";

/**
 * Day, view and status filter live in the URL and are restored on return
 * (features/bookings/search.ts). ?date=<YYYY-MM-DD>&booking=<id> opens that day
 * with that booking's dialog (the link from a customer's bookings).
 */
export const Route = createFileRoute("/_app/bookings")({
  validateSearch: (s: Record<string, unknown>) => ({
    ...bookingsSearch.validateSearch(s),
    booking: typeof s.booking === "string" ? s.booking : undefined,
  }),
  beforeLoad: bookingsSearch.beforeLoad,
  component: BookingsPage,
});
