import { useMemo } from "react";
import { useListAddonCosts } from "@/data/api/generated/api";
import type { AddonCost } from "@/data/api/generated/models";

const COST_STALE = 60_000;

// NOTE: per-SKU menu-item costs are now embedded in the paginated
// `useListMenuItems` response (`MenuItemWithCosts.sku_costs`), so the catalog
// list no longer makes a separate `/costing/menu-items` call.

export const useAddonCostMap = (orgId: string | null | undefined, enabled = true): Map<string, AddonCost> => {
  const { data: addons = [] } = useListAddonCosts({ org_id: orgId ?? "" }, { query: { enabled: !!orgId && enabled, staleTime: COST_STALE } });
  return useMemo(() => new Map(addons.map((a) => [a.addon_item_id, a])), [addons]);
};
