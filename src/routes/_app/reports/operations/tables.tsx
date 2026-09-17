import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — table analytics is now a tab on Reports ▸ Operations. */
export const Route = createFileRoute("/_app/reports/operations/tables")({
  beforeLoad: () => {
    throw redirect({ to: "/reports/operations" });
  },
});
