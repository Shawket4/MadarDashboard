import { createFileRoute } from "@tanstack/react-router";
import { OperationsReportsPage } from "@/features/reports/operations/operations-reports-page";

export const Route = createFileRoute("/_app/reports/operations/")({
  component: OperationsReportsPage,
});
