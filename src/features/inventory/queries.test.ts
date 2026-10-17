import { describe, expect, it } from "vitest";
import { hashKey, QueryClient } from "@tanstack/react-query";

import { getListPurchaseOrdersQueryKey, getListTransfersQueryKey, getReorderSuggestionsQueryKey } from "@/data/api/generated/api";
import { withDefaults } from "@/data/scope/list-search";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { prefetchPurchasing, prefetchTransfers, purchaseOrdersParams, purchasingTab, transfersListParams } from "./queries";
import { purchasingSearch, transfersSearch } from "./search";

const ctx = { orgId: "org", branchId: null, from: null, to: null, preset: "today" as const };
const warmed = (qc: QueryClient) => qc.getQueryCache().getAll().map((q) => q.queryHash);

describe("inventory query params", () => {
  it("purchasing: 'all' status is no filter; Reorder falls back to orders without a branch", () => {
    const f = withDefaults(purchasingSearch.spec, { tab: "reorder", status: "draft" });
    expect(purchaseOrdersParams(f)).toEqual({ status: "draft" });
    expect(purchaseOrdersParams(withDefaults(purchasingSearch.spec, {}))).toEqual({ status: undefined });
    expect(purchasingTab(f, null)).toBe("orders");
    expect(purchasingTab(f, "b1")).toBe("reorder");
  });

  it("transfers: the differences tab is not a status", () => {
    expect(transfersListParams(withDefaults(transfersSearch.spec, { tab: "differences", dir: "incoming" }))).toEqual({
      direction: "incoming",
      status: undefined,
    });
    expect(transfersListParams(withDefaults(transfersSearch.spec, { tab: "draft" }))).toEqual({ direction: undefined, status: "draft" });
  });

  it("prefetch warms the page's keys (all-branches sentinel, default filters)", () => {
    const qc = new QueryClient();
    prefetchPurchasing(qc, ctx);
    prefetchTransfers(qc, ctx);
    const keys = warmed(qc);
    expect(keys).toContain(hashKey(getListPurchaseOrdersQueryKey(ALL_BRANCHES_ID, { status: undefined })));
    expect(keys).toContain(hashKey(getListTransfersQueryKey(ALL_BRANCHES_ID, { direction: undefined, status: undefined })));
    expect(keys).not.toContain(hashKey(getReorderSuggestionsQueryKey("b1")));
  });
});
