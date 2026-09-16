import { createFileRoute } from "@tanstack/react-router";
import { LegalReportsPage } from "@/features/reports/legal/legal-reports-page";

export const Route = createFileRoute("/_app/reports/legal")({
  component: LegalReportsPage,
});
