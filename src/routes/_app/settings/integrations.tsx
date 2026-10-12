import { createFileRoute } from "@tanstack/react-router";
import { integrationsSearch } from "@/features/integrations/search";
import { IntegrationsPage } from "@/features/integrations/integrations-page";

/** ?edit=new opens the issue-credential dialog. */
export const Route = createFileRoute("/_app/settings/integrations")({
  validateSearch: (s: Record<string, unknown>) => ({
    ...integrationsSearch.validateSearch(s),
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  beforeLoad: integrationsSearch.beforeLoad,
  component: IntegrationsPage,
});
