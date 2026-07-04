import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired: branch + channel price/availability overrides are edited on the
 *  merged Pricing & Availability screen. */
export const Route = createFileRoute("/_app/menu/overrides")({
  beforeLoad: () => {
    throw redirect({ to: "/menu/pricing" });
  },
});
