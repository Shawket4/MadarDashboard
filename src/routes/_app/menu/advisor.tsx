import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — Menu Advisor moved to Insights ▸ Menu profitability. */
export const Route = createFileRoute("/_app/menu/advisor")({
  beforeLoad: () => {
    throw redirect({ to: "/insights/menu-profitability/advisor" });
  },
});
