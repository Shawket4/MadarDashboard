import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — menu profitability is now a tab on Reports ▸ Operations. */
export const Route = createFileRoute("/_app/reports/operations/profitability")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/operations" });
  },
});
