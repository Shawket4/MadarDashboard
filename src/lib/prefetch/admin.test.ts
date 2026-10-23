import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { getGetMyAuthzQueryKey } from "@/data/api/generated/api";
import { Cap } from "@/generated/capabilities";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { routes } from "./admin";

const ctx: PrefetchCtx = { orgId: "o1", branchId: "b1", from: null, to: null, preset: "today" };

function warmed(route: string, caps: string[] = []) {
  const qc = new QueryClient();
  qc.setQueryData(getGetMyAuthzQueryKey(), { capabilities: caps });
  const spy = vi.spyOn(qc, "prefetchQuery").mockResolvedValue(undefined);
  routes[route](qc, ctx);
  return spy.mock.calls.map(([o]) => JSON.stringify(o.queryKey));
}

describe("admin prefetch", () => {
  it("warms activation codes only for who may issue them", () => {
    expect(warmed("/devices")).toEqual(['["/devices",{"branch_id":"b1"}]']);
    expect(warmed("/devices", [Cap.branchesEdit])).toContain('["/devices/activation-codes",{"branch_id":"b1"}]');
  });
});
