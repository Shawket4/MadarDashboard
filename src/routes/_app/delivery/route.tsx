import { Outlet, createFileRoute } from "@tanstack/react-router";

// Delivery's sub-screens (Settings / Zones / Channel overrides) are navigated
// from the sidebar's expandable Delivery group — no in-page tab bar (it would
// duplicate that nav). This layout is now a pass-through.
function DeliveryLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/_app/delivery")({
  component: DeliveryLayout,
});
