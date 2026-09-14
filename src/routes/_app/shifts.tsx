import { createFileRoute, redirect } from "@tanstack/react-router";

import { shiftsRedirect } from "@/features/tills/redirect";

/** Shifts were renamed to tills; old links and bookmarks land on /tills. */
export const Route = createFileRoute("/_app/shifts")({
  beforeLoad: ({ search }) => {
    throw redirect(shiftsRedirect(search as Record<string, unknown>));
  },
});
