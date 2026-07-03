import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — Permissions merged into Administration ▸ Users & Permissions.
 *  Preserve ?user (whose matrix to edit) across the redirect. */
export const Route = createFileRoute("/_app/permissions")({
  validateSearch: (s: Record<string, unknown>): { user?: string } => ({
    user: typeof s.user === "string" ? s.user : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/access/roles", search });
  },
});
