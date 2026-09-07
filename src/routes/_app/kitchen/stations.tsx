import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved: see `/settings/kitchen-stations`. */
export const Route = createFileRoute("/_app/kitchen/stations")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/kitchen-stations" });
  },
});
