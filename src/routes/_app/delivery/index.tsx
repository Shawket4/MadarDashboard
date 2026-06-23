import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/delivery/")({
  beforeLoad: () => {
    throw redirect({ to: "/delivery/settings" });
  },
});
