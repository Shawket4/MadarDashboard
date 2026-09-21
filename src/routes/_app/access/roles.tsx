import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/features/access/roles-page";

/** Access ▸ Roles & Permissions. ?role=<id> selects the role being edited;
 *  ?user=<id> (old deep links) is accepted and ignored. */
export const Route = createFileRoute("/_app/access/roles")({
  validateSearch: (s: Record<string, unknown>): { role?: string; user?: string } => ({
    role: typeof s.role === "string" ? s.role : undefined,
    user: typeof s.user === "string" ? s.user : undefined,
  }),
  component: RolesPage,
});
