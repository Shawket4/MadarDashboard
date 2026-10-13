import { defineListSearch, param } from "@/data/scope/list-search";

/** Settings › Integrations: the credentials table's search and page in the URL (data/scope/list-search.ts), restored on return. */
export const integrationsSearch = defineListSearch("/settings/integrations", {
  q: param.string(),
  page: param.page(),
});
