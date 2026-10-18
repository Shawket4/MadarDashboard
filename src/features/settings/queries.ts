import { queryOptions } from "@tanstack/react-query";

import { getOrg } from "@/data/api/generated/api";

/** Settings › Brand reads the org through its own key (the form owns its cache). One definition for the pane and its prefetch. */
export const orgBrandQueryOptions = (orgId: string) => queryOptions({ queryKey: ["org-brand", orgId] as const, queryFn: () => getOrg(orgId) });
