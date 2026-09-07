import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved: see `/settings/delivery-zones`. */
export const Route = createFileRoute("/_app/delivery/zones")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/delivery-zones" });
  },
});
