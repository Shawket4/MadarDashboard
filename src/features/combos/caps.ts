/**
 * TEMPORARY: the four new capabilities (contract §2.1, ids 260–263) until
 * `src/generated/capabilities.ts` is regenerated from A's spec. Then every use
 * becomes `Cap.menuCombosEdit` etc. and this file is deleted.
 */
import type { Capability } from "@/generated/capabilities";

const cap = (key: string) => key as unknown as Capability;

export const ComboCap = {
  menuCombosEdit: cap("menu.combos.edit"),
  menuDealsEdit: cap("menu.deals.edit"),
  ordersDealsApply: cap("orders.deals.apply"),
  reportsBundles: cap("reports.bundles"),
} as const;
