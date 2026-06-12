import { useMemo } from "react";
import {
  useListSkuCosts,
  useListAddonCosts,
  getListSkuCostsQueryKey,
  getListAddonCostsQueryKey,
} from "@/shared/api/generated/api";
import type { AddonCost, SkuCost } from "@/shared/api/generated/models";

export { getListSkuCostsQueryKey, getListAddonCostsQueryKey };

/** Costing joins on (menu_item_id, size_label) — NEVER on menu_item_id alone. */
export const skuCostKey = (menuItemId: string, sizeLabel: string) => `${menuItemId}:${sizeLabel}`;

export const useSkuCosts = (orgId: string | null | undefined) =>
  useListSkuCosts({ org_id: orgId ?? "" }, { query: { enabled: !!orgId, staleTime: 60_000 } });

export const useAddonCosts = (orgId: string | null | undefined) =>
  useListAddonCosts({ org_id: orgId ?? "" }, { query: { enabled: !!orgId, staleTime: 60_000 } });

/** SKU costs grouped per menu item, preserving the per-size rows. */
export const useSkuCostsByItem = (orgId: string | null | undefined): Map<string, SkuCost[]> => {
  const { data: skus = [] } = useSkuCosts(orgId);
  return useMemo(() => {
    const map = new Map<string, SkuCost[]>();
    for (const sku of skus) {
      const list = map.get(sku.menu_item_id) ?? [];
      list.push(sku);
      map.set(sku.menu_item_id, list);
    }
    return map;
  }, [skus]);
};

export const useAddonCostMap = (orgId: string | null | undefined): Map<string, AddonCost> => {
  const { data: addons = [] } = useAddonCosts(orgId);
  return useMemo(() => new Map(addons.map((a) => [a.addon_item_id, a])), [addons]);
};
