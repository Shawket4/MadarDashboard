import { createFileRoute } from "@tanstack/react-router";
import { RoutingPage } from "@/features/kitchen-stations/routing-page";

export const Route = createFileRoute("/_app/kitchen/routing")({
  component: RoutingPage,
});
