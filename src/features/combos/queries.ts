import type { QueryClient } from "@tanstack/react-query";

import {
  getGetComboQueryOptions,
  getListBranchesQueryOptions,
  getListCategoriesQueryOptions,
  getListCombosQueryOptions,
  getListMenuItemsQueryOptions,
} from "@/data/api/generated/api";
import type { ListValues } from "@/data/scope/list-search";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { combosSearch } from "./search";
import type { ListCombosParams } from "./types";

export const COMBOS_PAGE_SIZE = 25;

/**
 * The combos list request, built in ONE place: the page reads it and the
 * sidebar prefetch warms it, so both ask for the same cache key.
 */
export function combosListParams(f: ListValues<typeof combosSearch.spec>): ListCombosParams {
  const q = f.q.trim();
  return {
    q: q || undefined,
    category_id: f.cat || undefined,
    is_active: f.status === "all" ? undefined : f.status === "active",
    page: f.page,
    per_page: COMBOS_PAGE_SIZE,
  };
}

/** What the combo editor, the deal dialog and the meal section pick from (./use-menu-options). */
export function prefetchMenuOptions(qc: QueryClient, orgId: string): void {
  void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: orgId, full: true }));
  void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
  void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
}

/**
 * Row intent: warm what the combo editor (`/menu/combos/$comboId`) reads on
 * open. Its economics panel is keyed by the form it builds, so it is left to load.
 */
export function prefetchComboEditor(qc: QueryClient, orgId: string | null, comboId: string): void {
  void qc.prefetchQuery(getGetComboQueryOptions(comboId, {}));
  if (orgId) prefetchMenuOptions(qc, orgId);
}

/** Sidebar/palette intent: warm Menu › Combos exactly as the page will open it. */
export function prefetchCombos(qc: QueryClient, { orgId, branchId }: PrefetchCtx): void {
  if (!orgId) return;
  void qc.prefetchQuery(getListCombosQueryOptions(combosListParams(combosSearch.entryValues(branchId))));
  void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
}
