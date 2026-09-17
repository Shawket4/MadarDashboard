import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — sales reports moved to Reports ▸ Operations. */
export const Route = createFileRoute("/_app/insights/sales")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/operations" });
  },
});
