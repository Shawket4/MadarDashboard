import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired: per-channel price/availability overrides moved to the merged
 *  Pricing & Availability screen (channel selector). */
export const Route = createFileRoute("/_app/delivery/channels")({
  beforeLoad: () => {
    throw redirect({ to: "/menu/pricing" });
  },
});
