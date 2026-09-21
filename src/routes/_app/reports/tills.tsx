import { createFileRoute } from "@tanstack/react-router";
import { TillSessionsPage } from "@/features/reports/tills/till-sessions-page";

export const Route = createFileRoute("/_app/reports/tills")({
  component: TillSessionsPage,
});
