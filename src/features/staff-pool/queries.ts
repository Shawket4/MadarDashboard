import type { QueryClient } from "@tanstack/react-query";

import {
  getGetStaffPoolSettingsQueryOptions,
  getGetStaffPoolTodayQueryOptions,
  getListStaffDrinksQueryOptions,
  getSummarizeStaffDrinksQueryOptions,
} from "@/data/api/generated/api";
import { cairoParts } from "@/lib/format";
import type { PrefetchCtx } from "@/lib/route-prefetch";

/**
 * ISO instant → the local "YYYY-MM-DD" the backend's business-date param wants,
 * in the active branch/org timezone. Slicing the UTC string instead lands on
 * the wrong calendar day for every evening in a zone ahead of UTC — which for
 * a pool that resets at local midnight is the difference between yesterday's
 * overspend and today's.
 */
function localDate(iso: string): string {
  const { y, m, d } = cairoParts(iso);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * The staff drinks report's requests, built in ONE place for the page and the
 * sidebar prefetch. The summary is the LAST day of the period (the pool resets
 * every midnight); the list and its money cover the whole period.
 */
export function staffPoolReportParams(branchId: string | null, from: string | null, to: string | null) {
  const fromDate = from ? localDate(from) : "";
  const businessDate = to ? localDate(to) : "";
  return {
    fromDate,
    businessDate,
    today: { branch_id: branchId ?? "", business_date: businessDate || undefined },
    period: { branch_id: branchId ?? "", from: fromDate || undefined, to: businessDate || undefined },
  };
}

/** Settings in force at the branch (or the org's own default when none is picked). */
export const staffPoolSettingsParams = (branchId: string | null) => (branchId ? { branch_id: branchId } : {});

/** Sidebar intent for Reports ▸ Staff drinks: one branch's pool, as the page opens it. */
export function prefetchStaffPoolReport(qc: QueryClient, { branchId, from, to }: PrefetchCtx): void {
  const p = staffPoolReportParams(branchId, from, to);
  // A branch is required: the pool belongs to one shop's day.
  if (!branchId || !p.fromDate || !p.businessDate) return;
  void qc.prefetchQuery(getGetStaffPoolTodayQueryOptions(p.today));
  void qc.prefetchQuery(getListStaffDrinksQueryOptions(p.period));
  void qc.prefetchQuery(getSummarizeStaffDrinksQueryOptions(p.period));
}

/** Sidebar intent for Settings ▸ Staff drinks. */
export function prefetchStaffPoolSettings(qc: QueryClient, { orgId, branchId }: PrefetchCtx): void {
  // The eligible-items picker's menu read waits on the settings naming items, so it is left to the page.
  if (orgId) void qc.prefetchQuery(getGetStaffPoolSettingsQueryOptions(staffPoolSettingsParams(branchId)));
}
