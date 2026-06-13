import { createFileRoute } from "@tanstack/react-router";
import { ShiftsPage } from "@/features/shifts/shifts-page";

/** ?report=<id> opens that shift's report sheet (shareable deep link). */
export const Route = createFileRoute("/_app/shifts")({
  validateSearch: (s: Record<string, unknown>): { report?: string } => ({
    report: typeof s.report === "string" ? s.report : undefined,
  }),
  component: ShiftsPage,
});
