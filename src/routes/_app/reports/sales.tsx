import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — sales analytics moved to Reports ▸ Operations. */
export const Route = createFileRoute("/_app/reports/sales")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/operations" });
  },
});
