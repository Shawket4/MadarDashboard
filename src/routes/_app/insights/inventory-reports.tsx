import { createFileRoute, redirect } from "@tanstack/react-router";

/** Inventory reports live under the Inventory section (`/inventory/reports`).
 *  This former Insights mirror is retired — redirect so old bookmarks/deep
 *  links land on the canonical page instead of a now-unlinked duplicate. */
export const Route = createFileRoute("/_app/insights/inventory-reports")({
  beforeLoad: () => {
    throw redirect({ to: "/inventory/reports" });
  },
});
