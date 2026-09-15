import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/users/users-page";

/** Access ▸ Users. ?edit=<id>|new opens the user editor; ?branches=<id> opens
 *  branch-access; ?access=<id> opens the person's access. */
export const Route = createFileRoute("/_app/access/users")({
  validateSearch: (s: Record<string, unknown>): { edit?: string; branches?: string; access?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    branches: typeof s.branches === "string" ? s.branches : undefined,
    access: typeof s.access === "string" ? s.access : undefined,
  }),
  component: UsersPage,
});
