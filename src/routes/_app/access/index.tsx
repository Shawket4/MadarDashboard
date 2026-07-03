import { createFileRoute, redirect } from "@tanstack/react-router";

/** Default the Access section to the Users tab. */
export const Route = createFileRoute("/_app/access/")({
  beforeLoad: () => {
    throw redirect({ to: "/access/users" });
  },
});
