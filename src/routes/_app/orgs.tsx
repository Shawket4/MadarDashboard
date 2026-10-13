import { createFileRoute } from "@tanstack/react-router";
import { OrgsPage } from "@/features/orgs/orgs-page";
import { orgsSearch } from "@/features/orgs/search";

/** ?edit=<id>|new opens the organization editor; ?plan= and ?source= filter the list. */
export const Route = createFileRoute("/_app/orgs")({
  validateSearch: (s: Record<string, unknown>) => ({
    ...orgsSearch.validateSearch(s),
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  beforeLoad: orgsSearch.beforeLoad,
  component: OrgsPage,
});
