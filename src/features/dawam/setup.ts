/**
 * Dawam set-up (SA-4): four things a new business needs before anyone can
 * clock in, each read from real data — never a checkbox someone ticks.
 */
import {
  useGetAttendanceSettings, useListBranches, useListEmployees, useListWorkShifts,
} from "@/data/api/generated/api";
import type { AttendanceSettings, Branch, Employee, WorkShift } from "@/data/api/generated/models";
import { useOrgId } from "@/hooks/use-org-id";

export type SetupStep = "branches" | "employees" | "shifts" | "rules";
export const SETUP_STEPS: SetupStep[] = ["branches", "employees", "shifts", "rules"];

/** A branch a phone can be checked against: a pin and a radius. */
export const branchPinned = (b: Pick<Branch, "latitude" | "longitude" | "geo_radius_meters">) =>
  b.latitude != null && b.longitude != null && (b.geo_radius_meters ?? 0) > 0;

export interface SetupData {
  branches?: Pick<Branch, "id" | "name" | "latitude" | "longitude" | "geo_radius_meters">[];
  employees?: Pick<Employee, "is_active" | "employment_status">[];
  shifts?: Pick<WorkShift, "is_active">[];
  settings?: Pick<AttendanceSettings, "rules_saved_at">;
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
    employees: !!d.employees?.some((e) => e.is_active && e.employment_status === "active"),
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

/** The live data behind the checklist. `enabled` false asks the server nothing. */
export function useSetupData(enabled = true): SetupData {
  const orgId = useOrgId();
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: enabled && !!orgId } }).data;
  const employees = useListEmployees({ employment_status: "active" }, { query: { enabled } }).data;
  const shifts = useListWorkShifts({ query: { enabled } }).data;
  const settings = useGetAttendanceSettings({}, { query: { enabled } }).data;
  return { branches, employees, shifts, settings };
}

export const useSetupProgress = (enabled = true) => setupProgress(useSetupData(enabled));
