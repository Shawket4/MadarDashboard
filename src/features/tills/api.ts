/**
 * Tills API (TILLS_CONTRACT §2.2) on top of the orval-generated client.
 *
 * Till status/verification come typed from the spec. Only the reconciliation
 * statuses are still plain strings on the wire, so this module narrows those
 * for the close form and report, and re-exports the generated hooks under the
 * names the tills screens use. No hand-written requests live here.
 */
import type { UseQueryResult } from "@tanstack/react-query";

import {
  getGetTillReportQueryOptions,
  getListOpenTillsQueryOptions,
  useClosePreview,
  useCloseTill as useCloseTillMutation,
  useDeleteTill as useDeleteTillMutation,
  useForceCloseTill as useForceCloseTillMutation,
  useGetCurrentTill,
  useGetOpenBillsNotice,
  useListOpenTills,
  useListTills as useListTillsQuery,
  useGetTillReport,
  useOpenTill as useOpenTillMutation,
  useAddCashMovement as useAddCashMovementMutation,
  useTillDeductions as useTillDeductionsQuery,
  useTillSummary as useTillSummaryQuery,
} from "@/data/api/generated/api";
import type {
  CloseTillMethod,
  CloseTillPreview,
  CloseTillRequest,
  CloseTillResponse as GenCloseTillResponse,
  DeductionLogRow,
  LastTillWarning,
  ListTillsParams as GenListTillsParams,
  OpenBillsNotice,
  PaginatedTills,
  ReconciliationInput as GenReconciliationInput,
  ShiftSummary,
  Till,
  TillBrief,
  TillPreFill,
  TillReconciliationLine as GenTillReconciliationLine,
  TillReportResponse as GenTillReportResponse,
  TillStatus,
  TillVerification,
} from "@/data/api/generated/models";
import { queryClient } from "@/data/api/query";

export type ReconciliationStatus = "clean" | "disagreed" | "unreviewed";
export type ReconciliationLineStatus = "checked" | "disagreed" | "unreviewed";

export type TillReconciliationLine = Omit<GenTillReconciliationLine, "status"> & { status: ReconciliationLineStatus };
export type TillReport = Omit<GenTillReportResponse, "reconciliation"> & { reconciliation: TillReconciliationLine[] };
export type CloseTillResponse = Omit<GenCloseTillResponse, "reconciliation"> & { reconciliation: TillReconciliationLine[] };
export type ReconciliationInput = Omit<GenReconciliationInput, "status"> & { status: "checked" | "disagreed" };
export type ListTillsParams = Omit<GenListTillsParams, "status"> & { status?: TillStatus };
export type TillSummary = ShiftSummary;
export type {
  CloseTillMethod,
  CloseTillPreview,
  CloseTillRequest,
  DeductionLogRow,
  LastTillWarning,
  OpenBillsNotice,
  PaginatedTills,
  Till,
  TillBrief,
  TillPreFill,
  TillStatus,
  TillVerification,
};

/** Every tills/reports query key starts with its URL (orval convention). */
export const invalidateTills = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" &&
      ((q.queryKey[0] as string).startsWith("/tills") || (q.queryKey[0] as string).startsWith("/reports")),
  });

/** Drop undefined/empty filters so the query key is stable. */
export function cleanParams(p: ListTillsParams): ListTillsParams | undefined {
  const out = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== "" && v !== false));
  return Object.keys(out).length ? (out as ListTillsParams) : undefined;
}

const invalidateOnSuccess = { mutation: { onSuccess: () => void invalidateTills() } };

/** T3: tills at a branch, filtered (status, teller, device, flagged, range). */
export function useListTills(branchId: string | null | undefined, params: ListTillsParams = {}) {
  return useListTillsQuery(branchId ?? "", cleanParams(params), { query: { enabled: !!branchId } });
}

/** T4: every open till at the branch, newest first. */
export const openTillsQueryOptions = (branchId: string) => getListOpenTillsQueryOptions(branchId);

export function useOpenTills(branchId: string | null | undefined) {
  return useListOpenTills(branchId ?? "", { query: { enabled: !!branchId } });
}

/** T1: the signed-in person's pre-fill for opening a till here. */
export function useTillPreFill(branchId: string | null | undefined) {
  return useGetCurrentTill(branchId ?? "", undefined, { query: { enabled: !!branchId } });
}

/** T5: bills left open at the branch and how many count as old. */
export function useOpenBillsNotice(branchId: string | null | undefined) {
  return useGetOpenBillsNotice(branchId ?? "", { query: { enabled: !!branchId } });
}

/** T7: the till report with per-method reconciliation. */
export const tillReportQueryOptions = (id: string) => getGetTillReportQueryOptions(id);

export function useTillReport(id: string | null, enabled = true) {
  return useGetTillReport(id ?? "", { query: { enabled: !!id && enabled } }) as UseQueryResult<TillReport>;
}

/** T15: `/reports/tills/{id}/summary`. */
export function useTillSummary(id: string | null, enabled = true) {
  return useTillSummaryQuery(id ?? "", { query: { enabled: !!id && enabled } });
}

/** T16: `/reports/tills/{id}/deductions` — stock the till's orders consumed. */
export function useTillDeductions(id: string | null, enabled = true) {
  return useTillDeductionsQuery(id ?? "", { query: { enabled: !!id && enabled } });
}

/** T8: what the close form reconciles. */
export function useCloseTillPreview(id: string | null, enabled = true) {
  return useClosePreview(id ?? "", { query: { enabled: !!id && enabled } });
}

export const useOpenTill = () => useOpenTillMutation(invalidateOnSuccess);
export const useCloseTill = () => useCloseTillMutation(invalidateOnSuccess);
export const useDeleteTill = () => useDeleteTillMutation(invalidateOnSuccess);
export const useAddCashMovement = () => useAddCashMovementMutation(invalidateOnSuccess);

/** T10: force close; the reason is optional. */
export function useForceCloseTill() {
  const m = useForceCloseTillMutation(invalidateOnSuccess);
  return {
    ...m,
    mutate: (v: { tillId: string; reason?: string | null }, opts?: Parameters<typeof m.mutate>[1]) =>
      m.mutate({ tillId: v.tillId, data: { reason: v.reason ?? null } }, opts),
  };
}
