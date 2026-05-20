import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { bundleApi } from "./api";

export const useBundlesList = (orgId: string | null, params: Parameters<typeof bundleApi.list>[0]) =>
  useQuery({
    queryKey: QUERY_KEYS.bundles(orgId ?? "", params),
    queryFn: () => bundleApi.list(params),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });

export const useBundleDetail = (id: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.bundle(id ?? ""),
    queryFn: () => bundleApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useBundlePerformance = (id: string | null, params?: Parameters<typeof bundleApi.getPerformance>[1]) =>
  useQuery({
    queryKey: QUERY_KEYS.bundlePerformance(id ?? "", params),
    queryFn: () => bundleApi.getPerformance(id!, params),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

export const useCreateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bundleApi.create,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["bundles", variables.org_id] });
    },
  });
};

export const useUpdateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof bundleApi.update>[1]; orgId: string }) =>
      bundleApi.update(id, payload),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["bundles", variables.orgId] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bundle(data.id) });
    },
  });
};

export const useDeleteBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; orgId: string }) => bundleApi.remove(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["bundles", variables.orgId] });
    },
  });
};

export const useActivateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; orgId: string }) => bundleApi.activate(id),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["bundles", variables.orgId] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bundle(data.id) });
    },
  });
};

export const useArchiveBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; orgId: string }) => bundleApi.archive(id),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["bundles", variables.orgId] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bundle(data.id) });
    },
  });
};
