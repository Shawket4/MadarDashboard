import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — analytics moved to Reports ▸ Operations. */
export const Route = createFileRoute("/_app/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/operations" });
  },
});
