import { createFileRoute } from "@tanstack/react-router";
import { OrgsPage } from "@/features/orgs/orgs-page";

/** ?edit=<id>|new opens the organization editor. */
export const Route = createFileRoute("/_app/orgs")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: OrgsPage,
});
