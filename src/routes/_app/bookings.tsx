import { createFileRoute } from "@tanstack/react-router";
import { BookingsPage } from "@/features/bookings/bookings-page";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** ?date=<YYYY-MM-DD>&booking=<id> opens that day with that booking's dialog (the link from a customer's bookings). */
export const Route = createFileRoute("/_app/bookings")({
  validateSearch: (s: Record<string, unknown>): { date?: string; booking?: string } => ({
    date: typeof s.date === "string" && YMD.test(s.date) ? s.date : undefined,
    booking: typeof s.booking === "string" ? s.booking : undefined,
  }),
  component: BookingsPage,
});
