import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { getGetGroupUsageQueryOptions, getGetMenuItemQueryOptions } from "@/data/api/generated/api";
import type { GroupUsageItem } from "@/data/api/generated/models";

/**
 * Which items each group is attached to (`GET /modifier-groups/{id}/usage`),
 * one query per group. Includes inactive items (`item_is_active`).
 */
export function useGroupUsage(groupIds: string[], enabled = true) {
  const results = useQueries({
    queries: groupIds.map((id) => getGetGroupUsageQueryOptions(id, { query: { enabled } })),
  });
  const key = results.map((r) => r.dataUpdatedAt).join(",");

  const byGroup = useMemo(() => {
    const m = new Map<string, GroupUsageItem[]>();
    groupIds.forEach((id, i) => {
      const data = results[i]?.data;
      if (data) m.set(id, data);
    });
    return m;
    // `key` stands in for the query results' identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIds, key]);

  return {
    byGroup,
    /** Usage of `id` once loaded, else `null`. */
    countOf: (id: string) => byGroup.get(id)?.length ?? null,
    isLoading: results.some((r) => r.isLoading),
  };
}

/**
 * Distinct size labels (Cup, Can…) of the items a group is attached to: the
 * per-size columns the option grid offers. Reads each attached item.
 */
export function useGroupSizeLabels(groupId: string | null, enabled = true) {
  const usageQ = useQuery(getGetGroupUsageQueryOptions(groupId ?? "", { query: { enabled: enabled && !!groupId } }));
  const itemIds = useMemo(() => (usageQ.data ?? []).map((u) => u.item_id), [usageQ.data]);
  const items = useQueries({
    queries: itemIds.map((id) => getGetMenuItemQueryOptions(id, { query: { enabled } })),
  });
  const key = items.map((q) => q.dataUpdatedAt).join(",");
  return useMemo(() => {
    const set = new Set<string>();
    for (const q of items) for (const s of q.data?.sizes ?? []) if (s.label) set.add(s.label);
    return [...set];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
