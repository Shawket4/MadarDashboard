import { apiClient } from "@/shared/api/client";
import type {
  AddonSalesRow,
  BranchSalesReport,
  BranchStockReport,
  OrgComparisonReport,
  TellerStats,
  TimeseriesPoint,
} from "@/shared/types";

export type ReportParams = { from?: string | null; to?: string | null; granularity?: string };

export const reportApi = {
  branchSales: (branchId: string, params: ReportParams) =>
    apiClient.get<BranchSalesReport>(`/reports/branches/${branchId}/sales`, { params }).then((r) => r.data),
  branchTimeseries: (branchId: string, params: ReportParams) =>
    apiClient.get<TimeseriesPoint[]>(`/reports/branches/${branchId}/sales/timeseries`, { params }).then((r) => r.data),
  branchTellers: (branchId: string, params: ReportParams) =>
    apiClient.get<TellerStats[]>(`/reports/branches/${branchId}/tellers`, { params }).then((r) => r.data),
  branchAddons: (branchId: string, params: ReportParams) =>
    apiClient.get<AddonSalesRow[]>(`/reports/branches/${branchId}/addons`, { params }).then((r) => r.data),
  branchStock: (branchId: string) =>
    apiClient.get<BranchStockReport>(`/reports/branches/${branchId}/stock`).then((r) => r.data),
  orgComparison: (orgId: string, params: ReportParams) =>
    apiClient.get<OrgComparisonReport>(`/reports/orgs/${orgId}/comparison`, { params }).then((r) => r.data),
};
