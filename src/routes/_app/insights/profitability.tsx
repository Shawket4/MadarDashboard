import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — menu profitability moved to Reports ▸ Operations. */
export const Route = createFileRoute("/_app/insights/profitability")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/operations/profitability" });
  },
});
