import { createFileRoute } from "@tanstack/react-router";
import { ZonesPage } from "@/features/delivery/zones-page";

export const Route = createFileRoute("/_app/delivery/zones")({
  component: ZonesPage,
});
