import { QueryClient, hashKey } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { getListTillsQueryKey } from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import {
  TILLS_OPTIONS_WINDOW,
  TILLS_PAGE_SIZE,
  prefetchTills,
  tillsExportParams,
  tillsFlaggedParams,
  tillsListParams,
  tillsOptionsParams,
} from "./queries";

describe("tills list params", () => {
  it("always asks the server for one page (never the unpaged full history)", () => {
    expect(tillsListParams({})).toEqual({ page: 1, per_page: TILLS_PAGE_SIZE });
    expect(tillsListParams({ page: 4, status: "closed", teller: "u1" })).toEqual({
      status: "closed",
      teller_id: "u1",
      page: 4,
      per_page: TILLS_PAGE_SIZE,
    });
    expect(tillsListParams({ page: 0 })?.page).toBe(1);
  });

  it("counts flagged tills across every page under the same filters", () => {
    expect(tillsFlaggedParams({ status: "closed", device: "d1", page: 7 })).toEqual({
      status: "closed",
      device_id: "d1",
      flagged: true,
      page: 1,
      per_page: 1,
    });
  });

  it("reads filter options and the export in bounded pages", () => {
    expect(tillsOptionsParams()).toEqual({ page: 1, per_page: TILLS_OPTIONS_WINDOW });
    expect(tillsExportParams({ flagged: true, page: 3 }, 2)).toEqual({ flagged: true, page: 2, per_page: TILLS_OPTIONS_WINDOW });
    expect(TILLS_OPTIONS_WINDOW).toBeLessThanOrEqual(200); // the server's MAX_TILLS_PER_PAGE
  });
});

describe("prefetchTills", () => {
  it("warms page 1 and the filter menus with the page's own keys; the flagged count only at a branch", () => {
    const warm = (branchId: string | null) => {
      const qc = new QueryClient();
      const spy = vi.spyOn(qc, "prefetchQuery").mockResolvedValue(undefined);
      prefetchTills(qc, { orgId: "o1", branchId, from: null, to: null, preset: "today" });
      return spy.mock.calls.map(([o]) => hashKey((o as { queryKey: readonly unknown[] }).queryKey));
    };
    // All branches: no KPIs, so the flagged count is never read.
    const all = warm(null);
    for (const params of [tillsListParams({}), tillsOptionsParams()]) {
      expect(all).toContain(hashKey(getListTillsQueryKey(ALL_BRANCHES_ID, params)));
    }
    expect(all).not.toContain(hashKey(getListTillsQueryKey(ALL_BRANCHES_ID, tillsFlaggedParams({}))));
    // A branch: the Flagged KPI too.
    const one = warm("b1");
    for (const params of [tillsListParams({}), tillsFlaggedParams({}), tillsOptionsParams()]) {
      expect(one).toContain(hashKey(getListTillsQueryKey("b1", params)));
    }
  });
});
