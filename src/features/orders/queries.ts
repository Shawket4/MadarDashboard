import type { QueryClient } from "@tanstack/react-query";

import { excludeItemsParam, readExcludedItems } from "@/components/app/exclude-items-control";
import { getListOrdersQueryOptions } from "@/data/api/generated/api";
import type { ListOrdersParams } from "@/data/api/generated/models";
import type { ListValues } from "@/data/scope/list-search";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { ordersSearch } from "./search";

export const ORDERS_PAGE_SIZE = 20;

type OrdersValues = ListValues<typeof ordersSearch.spec>;

/**
 * The orders list request, built in ONE place: the page reads it and the
 * sidebar prefetch warms it, so both always ask for the same cache key.
 */
export function ordersListParams(
  scope: { branchId: string | null; from: string | null; to: string | null },
  f: OrdersValues,
  excludedItems: string[],
): ListOrdersParams {
  return {
    branch_id: scope.branchId ?? undefined,
    from: scope.from ?? undefined,
    to: scope.to ?? undefined,
    status: f.status === "all" ? undefined : f.status,
    payment_method: f.pay === "all" ? undefined : f.pay,
    teller_name: f.teller || undefined,
    waiter_name: f.waiter || undefined,
    order_type: f.type === "all" ? undefined : f.type,
    // Channel only narrows delivery orders; ignored unless Delivery is picked.
    channel: f.type === "delivery" && f.channel !== "all" ? f.channel : undefined,
    exclude_items: excludeItemsParam(excludedItems),
    till_id: f.till || undefined,
    page: f.page,
    per_page: ORDERS_PAGE_SIZE,
  };
}

/** Sidebar/palette intent: warm the list exactly as the page will open it. */
export function prefetchOrders(qc: QueryClient, { orgId, branchId, from, to }: PrefetchCtx): void {
  if (!branchId && !orgId) return;
  const f = ordersSearch.entryValues(branchId);
  void qc.prefetchQuery(getListOrdersQueryOptions(ordersListParams({ branchId, from, to }, f, readExcludedItems(orgId))));
}
