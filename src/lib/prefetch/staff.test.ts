import { QueryClient, hashKey, type QueryKey } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import {
  getAttendanceSummaryQueryKey,
  getGetMyAuthzQueryKey,
  getListAdvancesQueryKey,
  getListAttendanceQueryKey,
  getListEmployeesQueryKey,
  getListRequestsQueryKey,
} from "@/data/api/generated/api";
import type { MyAuthz } from "@/data/api/generated/models";
import { isoDaysFromToday, todayIso } from "@/features/staff/util";
import { Cap, type Capability } from "@/generated/capabilities";
import { routes } from "./staff";

const ctx = { orgId: "o1", branchId: "b1", from: null, to: null, preset: "today" as const };

/** The query keys `route` warms for someone holding `caps` (null = rights not read yet). */
function warmed(route: string, caps: Capability[] | null): string[] {
  const qc = new QueryClient();
  if (caps) qc.setQueryData<Partial<MyAuthz>>(getGetMyAuthzQueryKey(), { capabilities: caps });
  const spy = vi.spyOn(qc, "prefetchQuery").mockResolvedValue();
  routes[route](qc, ctx);
  return spy.mock.calls.map(([o]) => hashKey(o.queryKey as QueryKey));
}

describe("staff prefetch", () => {
  it("warms a list with the key its page opens on (the defaults when nothing is remembered)", () => {
    expect(warmed("/staff/requests", null)).toContain(hashKey(getListRequestsQueryKey({ status: "pending" })));
    const window = { from: isoDaysFromToday(-6), to: todayIso(), branch_id: "b1" };
    const attendance = warmed("/staff/attendance", null);
    expect(attendance).toContain(hashKey(getListAttendanceQueryKey(window)));
    expect(attendance).toContain(hashKey(getAttendanceSummaryQueryKey(window)));
  });

  it("warms only the Approvals lists the person decides, so no 403 is cached for a section they can't see", () => {
    const keys = warmed("/staff/approvals", [Cap.hrLeaveEdit]);
    expect(keys).toContain(hashKey(getListRequestsQueryKey({ status: "pending" })));
    expect(keys).toContain(hashKey(getListEmployeesQueryKey({})));
    expect(keys).not.toContain(hashKey(getListAdvancesQueryKey({})));
    expect(keys).toHaveLength(2);
  });

  it("warms nothing gated before the rights are known", () => {
    expect(warmed("/staff/approvals", null)).toEqual([]);
    expect(warmed("/staff/payroll", null)).toEqual([]);
  });
});
