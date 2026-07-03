import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — Users merged into Administration ▸ Users & Permissions.
 *  Preserve the editor deep-links (?edit / ?branches) across the redirect. */
export const Route = createFileRoute("/_app/users")({
  validateSearch: (s: Record<string, unknown>): { edit?: string; branches?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    branches: typeof s.branches === "string" ? s.branches : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/access/users", search });
  },
});
