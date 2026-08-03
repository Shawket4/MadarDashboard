import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsPage } from "@/features/integrations/integrations-page";

/** ?edit=new opens the issue-credential dialog. */
export const Route = createFileRoute("/_app/settings/integrations")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: IntegrationsPage,
});
