/**
 * Dawam set-up (SA-4): four things a new business needs before anyone can
 * clock in, each read from real data — never a checkbox someone ticks.
 */
import {
  useGetAttendanceSettings, useListBranches, useListEmployees, useListWorkShifts,
} from "@/data/api/generated/api";
import type { AttendanceSettings, Branch, Employee, WorkShift } from "@/data/api/generated/models";
import { useOrgId } from "@/hooks/use-org-id";
import { dawamQuery } from "./live";

export type SetupStep = "branches" | "employees" | "shifts" | "rules";
export const SETUP_STEPS: SetupStep[] = ["branches", "employees", "shifts", "rules"];

/** A branch a phone can be checked against: a pin and a radius. */
export const branchPinned = (b: Pick<Branch, "latitude" | "longitude" | "geo_radius_meters">) =>
  b.latitude != null && b.longitude != null && (b.geo_radius_meters ?? 0) > 0;

export interface SetupData {
  branches?: Pick<Branch, "id" | "name" | "latitude" | "longitude" | "geo_radius_meters">[];
  employees?: Pick<Employee, "employment_status">[];
  shifts?: Pick<WorkShift, "is_active">[];
  settings?: Pick<AttendanceSettings, "rules_saved_at">;
  /** The first read that failed, if any (the page says so instead of waiting forever). */
  error?: unknown;
  /** Asks every failed read again. */
  retry?: () => void;
}

export interface SetupProgress {
  /** Every answer is in; until then nothing is called done or not done. */
  ready: boolean;
  done: Record<SetupStep, boolean>;
  count: number;
  complete: boolean;
}

/** Pure, so it is tested directly. */
export function setupProgress(d: SetupData): SetupProgress {
  const done: Record<SetupStep, boolean> = {
    branches: !!d.branches?.length && d.branches.every(branchPinned),
    employees: !!d.employees?.some((e) => e.employment_status === "active"),
    shifts: !!d.shifts?.some((s) => s.is_active),
    rules: !!d.settings?.rules_saved_at,
  };
  const count = SETUP_STEPS.filter((s) => done[s]).length;
  return {
    ready: !!(d.branches && d.employees && d.shifts && d.settings),
    done,
    count,
    complete: count === SETUP_STEPS.length,
  };
}

/**
 * The live data behind the checklist. `enabled` false asks the server nothing.
 * `onPage`: read by a Dawam page (Set-up, the rules banner), so it refetches
 * when the tab comes back (`live.ts`). The sidebar and the command palette
 * read it on every page and keep the app-wide defaults.
 */
export function useSetupData(enabled = true, onPage = false): SetupData {
  const orgId = useOrgId();
  // No organization in scope (a super admin who hasn't picked one): every
  // staff read would be refused, so none is sent.
  const on = enabled && !!orgId;
  const query = onPage ? dawamQuery({ enabled: on }) : { enabled: on };
  const reads = [
    useListBranches({ org_id: orgId ?? "" }, { query }),
    useListEmployees({ employment_status: "active" }, { query }),
    useListWorkShifts({ query }),
    useGetAttendanceSettings({}, { query }),
  ] as const;
  const [branches, employees, shifts, settings] = reads;
  // Only a read with no data to show counts as failed; a background refetch
  // that fails keeps the last good answer on screen.
  const failed = reads.filter((r) => r.error && r.data === undefined);
  return {
    branches: branches.data,
    employees: employees.data,
    shifts: shifts.data,
    settings: settings.data,
    error: failed[0]?.error ?? undefined,
    retry: () => failed.forEach((r) => void r.refetch()),
  };
}

export const useSetupProgress = (enabled = true) => setupProgress(useSetupData(enabled));
