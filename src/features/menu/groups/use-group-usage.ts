import { useMemo } from "react";

import { useCatalogSync, useListBranches } from "@/data/api/generated/api";
import { useScope } from "@/data/scope/use-scope";

export interface GroupUse {
  item_id: string;
  item_name: string;
  /** Effective required state on that item (group default or its override). */
  is_required: boolean;
  min: number;
  max: number | null;
  /** The item's size labels (Cup, Can…), offered as per-size columns in the group editor. */
  size_labels: string[];
}

/**
 * Which items each group is attached to. There is no "attachments of a group"
 * endpoint, so this reads the POS catalog payload (`/catalog/sync`) for the
 * scoped branch, or the org's first branch. That payload carries only items
 * that are active and available at that branch, so the count is a floor, not
 * an exact figure, for items disabled there.
 */
export function useGroupUsage(orgId: string | null, enabled = true) {
  const { branchId: scoped } = useScope();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: enabled && !!orgId && !scoped } });
  const branchId = scoped ?? branchesQ.data?.[0]?.id ?? null;
  const syncQ = useCatalogSync({ branch_id: branchId ?? "" }, { query: { enabled: enabled && !!branchId } });

  const byGroup = useMemo(() => {
    const m = new Map<string, GroupUse[]>();
    for (const item of syncQ.data?.items ?? []) {
      for (const g of item.modifier_groups) {
        const list = m.get(g.group_id) ?? [];
        list.push({ item_id: item.id, item_name: item.name, is_required: g.is_required, min: g.min, max: g.max ?? null, size_labels: item.sizes.map((s) => s.label) });
        m.set(g.group_id, list);
      }
    }
    return m;
  }, [syncQ.data]);

  return { byGroup, isLoading: syncQ.isLoading || (!scoped && branchesQ.isLoading), ready: !!syncQ.data };
}
