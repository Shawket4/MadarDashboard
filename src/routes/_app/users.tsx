import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/users/users-page";

/** ?edit=<id>|new opens the user editor; ?branches=<id> opens branch-access. */
export const Route = createFileRoute("/_app/users")({
  validateSearch: (s: Record<string, unknown>): { edit?: string; branches?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    branches: typeof s.branches === "string" ? s.branches : undefined,
  }),
  component: UsersPage,
});
