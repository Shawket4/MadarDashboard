import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved: see `/settings/kitchen-routing`. */
export const Route = createFileRoute("/_app/kitchen/routing")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/kitchen-routing" });
  },
});
