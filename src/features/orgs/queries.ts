import type { QueryClient } from "@tanstack/react-query";

import { getListOrgsQueryOptions } from "@/data/api/generated/api";
import type { ListOrgsParams } from "@/data/api/generated/models";
import type { ListValues } from "@/data/scope/list-search";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { orgsSearch } from "./search";

/** The organizations request, built once for the page AND the sidebar prefetch (same cache key). */
export function orgsListParams(f: ListValues<typeof orgsSearch.spec>): ListOrgsParams {
  return {
    plan: f.plan === "all" ? undefined : f.plan,
    signup_source: f.source === "all" ? undefined : f.source,
  };
}

/** Sidebar/palette intent: warm the list exactly as the page will open it. */
export function prefetchOrgs(qc: QueryClient, { branchId, search }: PrefetchCtx): void {
  void qc.prefetchQuery(getListOrgsQueryOptions(orgsListParams(orgsSearch.entryValues(branchId, search))));
}
