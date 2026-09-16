import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — inventory reports moved to Reports ▸ Inventory. */
export const Route = createFileRoute("/_app/inventory/reports")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/inventory" });
  },
});
