import { createFileRoute } from "@tanstack/react-router";
import { ReservationsPage } from "@/features/reservations/reservations-page";

export const Route = createFileRoute("/_app/reservations")({
  component: ReservationsPage,
});
