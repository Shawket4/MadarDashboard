/**
 * Tills API (TILLS_CONTRACT §2). Hand-typed until MadarRust exports the new
 * openapi.json; then `npm run generate:api` replaces these with orval hooks.
 * Query keys mirror orval's (URL first) so prefix invalidation keeps working.
 */
import { useMutation, useQuery } from "@tanstack/react-query";

import { customInstance } from "@/data/api/custom-instance";
import { queryClient } from "@/data/api/query";

export type TillStatus = "open" | "closed" | "force_closed";
export type TillVerification = "server" | "lan" | "unverified" | "legacy";
export type ReconciliationStatus = "clean" | "disagreed" | "unreviewed";
export type ReconciliationLineStatus = "checked" | "disagreed" | "unreviewed";

export interface Till {
  id: string;
  branch_id: string;
  branch_name?: string | null;
  teller_id: string;
  teller_name: string;
  status: TillStatus;
  opening_cash: number;
  opening_cash_original?: number | null;
  opening_cash_was_edited: boolean;
  opening_cash_edit_reason?: string | null;
  closing_cash_declared?: number | null;
  closing_cash_system?: number | null;
  cash_discrepancy?: number | null;
  opened_at: string;
  closed_at?: string | null;
  closed_by?: string | null;
  force_closed_by?: string | null;
  force_closed_at?: string | null;
  force_close_reason?: string | null;
  notes?: string | null;
  timezone?: string | null;
  device_id?: string | null;
  device_code?: string | null;
  device_label?: string | null;
  verification: TillVerification;
  opened_while_another_open: boolean;
  other_till_id?: string | null;
  flagged_at?: string | null;
  reconciliation_status?: ReconciliationStatus | null;
  disagreement_count: number;
  open_bills_at_close?: number | null;
  old_bills_at_close?: number | null;
}

export type TillBrief = Pick<
  Till,
  | "id" | "branch_id" | "teller_id" | "teller_name" | "status" | "opened_at"
  | "device_id" | "device_code" | "device_label" | "verification" | "opened_while_another_open"
>;

export interface PaginatedTills {
  data: Till[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface TillReconciliationLine {
  method: string;
  payment_method_id?: string | null;
  is_cash: boolean;
  system_total: number;
  current_system_total: number;
  order_count: number;
  status: ReconciliationLineStatus;
  declared_amount?: number | null;
  note?: string | null;
  reconciled_by?: string | null;
  reconciled_at: string;
  changed_after_close: boolean;
}

export interface OpenBillsNotice {
  open_bills_count: number;
  open_bills_amount: number;
  oldest_opened_at?: string | null;
  old_bills_count: number;
  old_bill_hours: number;
  seated_tables_count: number;
  since?: string | null;
}

export interface LastTillWarning {
  is_last_open_till: boolean;
  open_bills_count: number;
  open_bills_amount: number;
  seated_tables_count: number;
}

export interface TillPreFill {
  has_open_till: boolean;
  open_till: Till | null;
  open_elsewhere: TillBrief[];
  suggested_opening_cash: number;
  last_close_declared?: number | null;
  open_bills_notice: OpenBillsNotice;
}

export interface CashMovementRow {
  id?: string;
  amount: number;
  kind?: string;
  note: string;
  moved_by_name: string;
  created_at: string;
}

export interface TillReport {
  till: Till;
  cash_adjustments: number;
  cash_movements: CashMovementRow[];
  cash_movements_in: number;
  cash_movements_net: number;
  cash_movements_out: number;
  cash_tips: number;
  expected_cash: number;
  net_payments: number;
  non_cash_tips: number;
  payment_summary: { payment_method: string; is_cash: boolean; total: number; order_count: number }[];
  printed_at: string;
  safe_drops: number;
  total_payments: number;
  total_tips: number;
  voided_amount: number;
  standard_float?: number | null;
  suggested_safe_drop?: number | null;
  reconciliation: TillReconciliationLine[];
  old_bills_at_close: number | null;
  open_bills_at_close: number | null;
  order_number_range: { device_code: string | null; first: number | null; last: number | null };
}

export interface CloseTillPreview {
  till: Till;
  expected_cash: number;
  methods: { method: string; payment_method_id: string | null; is_cash: boolean; system_total: number; order_count: number }[];
  last_till_warning: LastTillWarning | null;
}

export interface ReconciliationInput {
  method: string;
  status: "checked" | "disagreed";
  declared_amount?: number;
  note?: string;
}

export interface CloseTillRequest {
  closing_cash_declared: number;
  cash_note?: string | null;
  reconciliation?: ReconciliationInput[];
}

export interface CloseTillResponse {
  till: Till;
  reconciliation: TillReconciliationLine[];
  last_till_warning: LastTillWarning | null;
}

export interface ListTillsParams {
  status?: TillStatus;
  teller_id?: string;
  device_id?: string;
  flagged?: boolean;
  from?: string;
  to?: string;
}

const get = <T,>(url: string, params?: object) => customInstance<T>({ url, method: "GET", params });
const send = <T,>(method: "POST" | "PUT" | "PATCH" | "DELETE", url: string, data?: unknown) =>
  customInstance<T>({ url, method, data });

export const tillKeys = {
  list: (branchId: string, params?: ListTillsParams) => [`/tills/branches/${branchId}`, ...(params ? [params] : [])] as const,
  open: (branchId: string) => [`/tills/branches/${branchId}/open`] as const,
  current: (branchId: string) => [`/tills/branches/${branchId}/current`] as const,
  till: (id: string) => [`/tills/${id}`] as const,
  report: (id: string) => [`/tills/${id}/report`] as const,
  preview: (id: string) => [`/tills/${id}/close-preview`] as const,
};

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

export function useListTills(branchId: string | null | undefined, params: ListTillsParams = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: tillKeys.list(branchId ?? "", clean),
    queryFn: () => get<PaginatedTills>(`/tills/branches/${branchId}`, clean),
    enabled: !!branchId,
  });
}

export const openTillsQueryOptions = (branchId: string) => ({
  queryKey: tillKeys.open(branchId),
  queryFn: () => get<Till[]>(`/tills/branches/${branchId}/open`),
});

export function useOpenTills(branchId: string | null | undefined) {
  return useQuery({ ...openTillsQueryOptions(branchId ?? ""), enabled: !!branchId });
}

export function useTillPreFill(branchId: string | null | undefined) {
  return useQuery({
    queryKey: tillKeys.current(branchId ?? ""),
    queryFn: () => get<TillPreFill>(`/tills/branches/${branchId}/current`),
    enabled: !!branchId,
  });
}

export const tillReportQueryOptions = (id: string) => ({
  queryKey: tillKeys.report(id),
  queryFn: () => get<TillReport>(`/tills/${id}/report`),
});

export function useTillReport(id: string | null, enabled = true) {
  return useQuery({ ...tillReportQueryOptions(id ?? ""), enabled: !!id && enabled });
}

export function useCloseTillPreview(id: string | null, enabled = true) {
  return useQuery({
    queryKey: tillKeys.preview(id ?? ""),
    queryFn: () => get<CloseTillPreview>(`/tills/${id}/close-preview`),
    enabled: !!id && enabled,
  });
}

export function useOpenTill() {
  return useMutation({
    mutationFn: (v: { branchId: string; data: { opening_cash: number; opening_cash_edited?: boolean; edit_reason?: string | null } }) =>
      send<Till>("POST", `/tills/branches/${v.branchId}/open`, v.data),
    onSuccess: () => void invalidateTills(),
  });
}

export function useCloseTill() {
  return useMutation({
    mutationFn: (v: { tillId: string; data: CloseTillRequest }) =>
      send<CloseTillResponse>("POST", `/tills/${v.tillId}/close`, v.data),
    onSuccess: () => void invalidateTills(),
  });
}

export function useForceCloseTill() {
  return useMutation({
    mutationFn: (v: { tillId: string; reason?: string | null }) =>
      send<Till>("POST", `/tills/${v.tillId}/force-close`, { reason: v.reason ?? null }),
    onSuccess: () => void invalidateTills(),
  });
}

export function useDeleteTill() {
  return useMutation({
    mutationFn: (v: { tillId: string }) => send<void>("DELETE", `/tills/${v.tillId}`),
    onSuccess: () => void invalidateTills(),
  });
}

export function useAddCashMovement() {
  return useMutation({
    mutationFn: (v: { tillId: string; data: { amount: number; note: string; kind?: string } }) =>
      send<unknown>("POST", `/tills/${v.tillId}/cash-movements`, v.data),
    onSuccess: () => void invalidateTills(),
  });
}
