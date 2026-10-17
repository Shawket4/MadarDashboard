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

/** The Tills page's URL filters (`?status=…`). */
export interface TillsFilters {
  status?: TillStatus;
  teller?: string;
  device?: string;
  flagged?: boolean;
  today?: boolean;
}

/** The start of the branch's business day (madar-time `day_bounds`), not the device's midnight. */
function startOfToday(): string {
  const { y, m, d } = dateParts(businessDate());
  return cairoDateISO(y, m, d);
}

/** The tills list request, built in ONE place for the page and the sidebar prefetch. */
export function tillsListParams(f: TillsFilters): ListTillsParams | undefined {
  return cleanParams({
    status: f.status,
    teller_id: f.teller,
    device_id: f.device,
    flagged: f.flagged,
    from: f.today ? startOfToday() : undefined,
  });
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
  if (branchId || orgId) void qc.prefetchQuery(getListTillsQueryOptions(branchId ?? ALL_BRANCHES_ID, tillsListParams({})));
}
