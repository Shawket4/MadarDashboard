import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved: delivery configuration now lives under Settings, with the rest of it. */
export const Route = createFileRoute("/_app/delivery/settings")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/delivery" });
  },
});
