import { createFileRoute } from "@tanstack/react-router";
import { BranchesPage } from "@/features/branches/branches-page";

/** ?edit=<id>|new opens the branch editor. */
export const Route = createFileRoute("/_app/branches")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: BranchesPage,
});
