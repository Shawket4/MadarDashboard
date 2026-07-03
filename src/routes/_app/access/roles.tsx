import { createFileRoute } from "@tanstack/react-router";
import { PermissionsPage } from "@/features/permissions/permissions-page";

/** Access ▸ Roles & Permissions. ?user=<id> selects whose permission matrix to
 *  edit (deep-linked from Users). */
export const Route = createFileRoute("/_app/access/roles")({
  validateSearch: (s: Record<string, unknown>): { user?: string } => ({
    user: typeof s.user === "string" ? s.user : undefined,
  }),
  component: PermissionsPage,
});
