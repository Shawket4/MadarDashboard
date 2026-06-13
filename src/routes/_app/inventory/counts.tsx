import { createFileRoute } from "@tanstack/react-router";
import { CountsPage } from "@/features/inventory/counts-page";

export const Route = createFileRoute("/_app/inventory/counts")({
  component: CountsPage,
});
