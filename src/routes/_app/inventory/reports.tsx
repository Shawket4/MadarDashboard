import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/features/inventory/reports-page";

export const Route = createFileRoute("/_app/inventory/reports")({
  component: ReportsPage,
});
