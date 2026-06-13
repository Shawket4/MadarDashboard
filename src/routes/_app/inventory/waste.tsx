import { createFileRoute } from "@tanstack/react-router";
import { WastePage } from "@/features/inventory/waste-page";

export const Route = createFileRoute("/_app/inventory/waste")({
  component: WastePage,
});
