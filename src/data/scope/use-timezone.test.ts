/**
 * The shell's timezone sync. A branch manager holds no `org.settings.read`,
 * so reading the org for the "all branches" zone answered 403 on every page
 * he opened (the audit's stray `GET /orgs/{id}`, 07 §1.4a). He never asks
 * now; his zone comes from his own branches.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useGetOrg = vi.fn();
const useListBranches = vi.fn();
let held: string[] = [];

vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: (id: string, opts: unknown) => useGetOrg(id, opts),
  useListBranches: (params: unknown, opts: unknown) => useListBranches(params, opts),
}));
vi.mock("@/data/authz/use-authz", () => ({
  useAuthz: () => ({ can: (c: string) => held.includes(c) }),
}));

const { useSyncTimezone, resolveTimezone } = await import("./use-timezone");
const { useAppStore } = await import("@/data/stores/app.store");
const { useAuthStore } = await import("@/data/stores/auth.store");
const { APP_TZ } = await import("@/data/config/constants");

const orgQueryEnabled = () => {
  const opts = useGetOrg.mock.calls.at(-1)?.[1] as { query: { enabled: boolean } };
  return opts.query.enabled;
};

describe("useSyncTimezone", () => {
  beforeEach(() => {
    // Like React Query: a disabled query has no data.
    useGetOrg
      .mockReset()
      .mockImplementation((_id: string, o: { query: { enabled: boolean } }) => ({
        data: o.query.enabled ? { timezone: "Asia/Dubai" } : undefined,
      }));
    useListBranches.mockReset().mockReturnValue({
      data: [{ id: "b1", timezone: "Africa/Cairo" }, { id: "b2", timezone: "Africa/Cairo" }],
    });
    useAuthStore.setState({ user: { id: "u1", role: "manager", org_id: "o1" } as never });
    useAppStore.setState({ selectedOrgId: null, selectedBranchId: null, activeTimezone: APP_TZ });
  });

  it("a manager (no org.settings.read) never reads the org, and takes his branches' zone", () => {
    held = [];
    renderHook(() => useSyncTimezone());
    expect(orgQueryEnabled()).toBe(false);
    expect(useAppStore.getState().activeTimezone).toBe("Africa/Cairo");
  });

  it("the owner reads the org's zone for the all-branches roll-up", () => {
    held = ["org.settings.read"];
    renderHook(() => useSyncTimezone());
    expect(orgQueryEnabled()).toBe(true);
    expect(useAppStore.getState().activeTimezone).toBe("Asia/Dubai");
  });

  it("with a branch picked, nobody reads the org", () => {
    held = ["org.settings.read"];
    useAppStore.setState({ selectedBranchId: "b2" });
    renderHook(() => useSyncTimezone());
    expect(orgQueryEnabled()).toBe(false);
    expect(useAppStore.getState().activeTimezone).toBe("Africa/Cairo");
  });
});

describe("resolveTimezone", () => {
  it("branch, then org, then the person's branches, then the app default", () => {
    expect(resolveTimezone({ branchTz: "A", orgTz: "B", branchZones: ["C"] })).toBe("A");
    expect(resolveTimezone({ orgTz: "B", branchZones: ["C"] })).toBe("B");
    expect(resolveTimezone({ branchZones: [null, "C"] })).toBe("C");
    expect(resolveTimezone({ branchZones: [] })).toBe(APP_TZ);
  });
});
