/**
 * The set-up reads run in the shell (sidebar and command palette) on every
 * page. A super admin with no organization picked has no org in scope, so
 * asking would only collect 403s (E2E: /staff/employees, /work-shifts and
 * /attendance/settings refused on /orgs). No org → nothing is asked.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let orgId: string | null = null;
const seen: Record<string, boolean | undefined> = {};
const hook = (name: string) => (...args: unknown[]) => {
  const opts = args[args.length - 1] as { query?: { enabled?: boolean } } | undefined;
  seen[name] = opts?.query?.enabled;
  return { data: undefined, error: null, refetch: vi.fn() };
};
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => orgId }));
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: hook("branches"),
  useListEmployees: hook("employees"),
  useListWorkShifts: hook("shifts"),
  useGetAttendanceSettings: hook("settings"),
}));
const { useSetupData } = await import("./setup");

beforeEach(() => { for (const k of Object.keys(seen)) delete seen[k]; });

describe("useSetupData", () => {
  it("asks nothing while no organization is in scope", () => {
    orgId = null;
    renderHook(() => useSetupData(true));
    expect(seen).toEqual({ branches: false, employees: false, shifts: false, settings: false });
  });

  it("asks all four once an organization is picked", () => {
    orgId = "org-1";
    renderHook(() => useSetupData(true));
    expect(seen).toEqual({ branches: true, employees: true, shifts: true, settings: true });
  });
});
