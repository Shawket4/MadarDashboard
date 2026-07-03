import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — Menu Engineering moved to Insights ▸ Menu profitability.
 *  Preserve the shareable view state (?view / ?basis) across the redirect. */
export const Route = createFileRoute("/_app/menu/engineering")({
  validateSearch: (s: Record<string, unknown>): { view?: "scatter" | "table"; basis?: "snapshot" | "current" } => ({
    view: s.view === "table" ? "table" : s.view === "scatter" ? "scatter" : undefined,
    basis: s.basis === "current" ? "current" : s.basis === "snapshot" ? "snapshot" : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/insights/menu-profitability/engineering", search });
  },
});
