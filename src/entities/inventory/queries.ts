import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { inventoryApi } from "./api";

export const useCatalog = (orgId: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.catalog(orgId ?? ""), queryFn: () => inventoryApi.listCatalog(orgId!), enabled: !!orgId });

export const useBranchStock = (branchId: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.stock(branchId ?? ""), queryFn: () => inventoryApi.listStock(branchId!), enabled: !!branchId });

export const useAdjustments = (branchId: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.adjustments(branchId ?? ""), queryFn: () => inventoryApi.listAdjustments(branchId!), enabled: !!branchId });

export const useTransfers = (branchId: string | null, direction?: "incoming" | "outgoing") =>
  useQuery({
    queryKey: QUERY_KEYS.transfers(branchId ?? "", direction),
    queryFn: () => inventoryApi.listTransfers(branchId!, direction),
    enabled: !!branchId,
  });
