import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { reportApi, type ReportParams } from "./api";

export const useBranchSales = (branchId: string | null, params: ReportParams) =>
  useQuery({
    queryKey: QUERY_KEYS.branchSales(branchId ?? "", params),
    queryFn: () => reportApi.branchSales(branchId!, params),
    enabled: !!branchId,
  });

export const useBranchTimeseries = (branchId: string | null, params: ReportParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.branchTimeseries(branchId ?? "", params),
    queryFn: () => reportApi.branchTimeseries(branchId!, params),
    enabled: !!branchId && enabled,
  });

export const useBranchTellers = (branchId: string | null, params: ReportParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.branchTellers(branchId ?? "", params),
    queryFn: () => reportApi.branchTellers(branchId!, params),
    enabled: !!branchId && enabled,
  });

export const useBranchAddons = (branchId: string | null, params: ReportParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.branchAddons(branchId ?? "", params),
    queryFn: () => reportApi.branchAddons(branchId!, params),
    enabled: !!branchId && enabled,
  });

export const useBranchStockReport = (branchId: string | null, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.branchStock(branchId ?? ""),
    queryFn: () => reportApi.branchStock(branchId!),
    enabled: !!branchId && enabled,
  });

export const useOrgComparison = (orgId: string | null, params: ReportParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.orgComparison(orgId ?? "", params),
    queryFn: () => reportApi.orgComparison(orgId!, params),
    enabled: !!orgId && enabled,
  });
