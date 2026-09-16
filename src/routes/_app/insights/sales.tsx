import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — sales reports moved to Reports ▸ Sales. */
export const Route = createFileRoute("/_app/insights/sales")({
  // Keep ?tab / ?gran so bookmarked report links still land on their tab.
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/reports/sales", search: search as { tab?: string; gran?: string } });
  },
});
