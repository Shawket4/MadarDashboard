import { createFileRoute } from "@tanstack/react-router";
import { StationsPage } from "@/features/kitchen-stations/stations-page";

export const Route = createFileRoute("/_app/settings/kitchen-stations")({
  component: StationsPage,
});
