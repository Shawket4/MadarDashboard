import { createFileRoute, redirect } from "@tanstack/react-router";

/** Default the Menu profitability section to the Engineering tab. */
export const Route = createFileRoute("/_app/insights/menu-profitability/")({
  beforeLoad: () => {
    throw redirect({ to: "/insights/menu-profitability/engineering" });
  },
});
