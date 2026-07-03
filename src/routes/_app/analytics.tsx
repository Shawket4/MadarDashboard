import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — analytics moved to Insights ▸ Sales. */
export const Route = createFileRoute("/_app/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/insights/sales" });
  },
});
