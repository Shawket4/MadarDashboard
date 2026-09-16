import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — table analytics moved to Reports ▸ Operations. */
export const Route = createFileRoute("/_app/insights/tables")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/operations/tables" });
  },
});
