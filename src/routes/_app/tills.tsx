import { createFileRoute } from "@tanstack/react-router";
import { TillsPage } from "@/features/tills/tills-page";

export const Route = createFileRoute("/_app/tills")({
  component: TillsPage,
});
