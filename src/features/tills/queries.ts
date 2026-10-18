import type { QueryClient } from "@tanstack/react-query";

import {
  getGetCurrentTillQueryOptions,
  getGetOpenBillsNoticeQueryOptions,
  getListSpotViewsQueryOptions,
  getListTillsQueryOptions,
  getTillDeductionsQueryOptions,
  getTillSummaryQueryOptions,
} from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { businessDate, cairoDateISO, dateParts } from "@/lib/format";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { cleanParams, openTillsQueryOptions, tillReportQueryOptions, type ListTillsParams, type TillStatus } from "./api";

/** The Tills page's URL filters (`?status=…`) and page (`?page=2`, 1-based). */
export interface TillsFilters {
  status?: TillStatus;
  teller?: string;
  device?: string;
  flagged?: boolean;
  today?: boolean;
  page?: number;
}

/** Rows per page of "All tills"; the server pages (`page`/`per_page`), never the table. */
export const TILLS_PAGE_SIZE = 20;

/**
 * How many of the latest tills the teller/device filter menus are read from.
 * The list itself is one page, so its rows cannot name every teller; this
 * bounded window (the server's per-page cap) covers everyone who sold lately.
 */
export const TILLS_OPTIONS_WINDOW = 200;

/** The start of the branch's business day (madar-time `day_bounds`), not the device's midnight. */
function startOfToday(): string {
  const { y, m, d } = dateParts(businessDate());
  return cairoDateISO(y, m, d);
}

/** The filters alone (no paging), as the server reads them. */
function tillsFilterParams(f: TillsFilters): ListTillsParams {
  return {
    status: f.status,
    teller_id: f.teller,
    device_id: f.device,
    flagged: f.flagged,
    from: f.today ? startOfToday() : undefined,
  };
}

/**
 * The tills list request, built in ONE place for the page and the sidebar
 * prefetch: one server page. Always sends `page`/`per_page`; without them the
 * endpoint returns every till the branch ever had (the old-client contract).
 */
export function tillsListParams(f: TillsFilters): ListTillsParams | undefined {
  return cleanParams({ ...tillsFilterParams(f), page: Math.max(1, f.page ?? 1), per_page: TILLS_PAGE_SIZE });
}

/**
 * The Flagged KPI: how many tills under the same filters are flagged, across
 * every page. One row is asked for; the answer is the response's `total`.
 */
export function tillsFlaggedParams(f: TillsFilters): ListTillsParams | undefined {
  return cleanParams({ ...tillsFilterParams(f), flagged: true, page: 1, per_page: 1 });
}

/** The teller/device filter menus' source: the scope's latest tills, unfiltered. */
export function tillsOptionsParams(): ListTillsParams | undefined {
  return cleanParams({ page: 1, per_page: TILLS_OPTIONS_WINDOW });
}

/** Export: one page of the filtered list (the export walks every page). */
export function tillsExportParams(f: TillsFilters, page: number): ListTillsParams | undefined {
  return cleanParams({ ...tillsFilterParams(f), page, per_page: TILLS_OPTIONS_WINDOW });
}

/** Row hover: every query the till report sheet fires when it opens. */
export function prefetchTillReport(qc: QueryClient, tillId: string): void {
  void qc.prefetchQuery(tillReportQueryOptions(tillId));
  void qc.prefetchQuery(getTillSummaryQueryOptions(tillId));
  void qc.prefetchQuery(getTillDeductionsQueryOptions(tillId));
  void qc.prefetchQuery(getListSpotViewsQueryOptions(tillId));
}

/** Sidebar/palette intent: the sidebar opens Tills unfiltered. */
export function prefetchTills(qc: QueryClient, { orgId, branchId }: PrefetchCtx): void {
  if (branchId) {
    void qc.prefetchQuery(getGetCurrentTillQueryOptions(branchId));
    void qc.prefetchQuery(openTillsQueryOptions(branchId));
    void qc.prefetchQuery(getGetOpenBillsNoticeQueryOptions(branchId));
  }
  if (branchId || orgId) {
    const scope = branchId ?? ALL_BRANCHES_ID;
    // Page 1, the Flagged KPI and the filter menus, with the page's exact keys.
    void qc.prefetchQuery(getListTillsQueryOptions(scope, tillsListParams({})));
    // The Flagged KPI shows only at a branch.
    if (branchId) void qc.prefetchQuery(getListTillsQueryOptions(scope, tillsFlaggedParams({})));
    void qc.prefetchQuery(getListTillsQueryOptions(scope, tillsOptionsParams()));
  }
}
