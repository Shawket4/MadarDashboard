import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { shiftApi } from "./api";

export const useCurrentShift = (branchId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.shiftPreFill(branchId ?? ""),
    queryFn: () => shiftApi.getCurrent(branchId!),
    enabled: !!branchId,
    refetchInterval: 60_000,
  });

export const useShifts = (branchId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.shifts(branchId ?? ""),
    queryFn: () => shiftApi.listByBranch(branchId!),
    enabled: !!branchId,
  });

export const useShift = (id: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.shift(id ?? ""), queryFn: () => shiftApi.get(id!), enabled: !!id });

export const useShiftReport = (id: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.shiftReport(id ?? ""), queryFn: () => shiftApi.report(id!), enabled: !!id });
