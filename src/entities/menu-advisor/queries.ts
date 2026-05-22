import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuAdvisorApi } from "./api";
import type { PriceSuggestionFilter, BundleSuggestionFilter, RemovalScenarioFilter, Decision } from "./schemas";

export const QUERY_KEYS = {
  all: ["menu-advisor"] as const,
  runs: (branchId: string) => [...QUERY_KEYS.all, "runs", branchId] as const,
  latestRun: (branchId: string) => [...QUERY_KEYS.runs(branchId), "latest"] as const,
  activeRun: (branchId: string) => [...QUERY_KEYS.runs(branchId), "active"] as const,
  run: (runId: string) => [...QUERY_KEYS.all, "run", runId] as const,
  priceSuggestions: (runId: string, filters?: PriceSuggestionFilter) => [...QUERY_KEYS.run(runId), "price-suggestions", filters] as const,
  bundleSuggestions: (runId: string, filters?: BundleSuggestionFilter) => [...QUERY_KEYS.run(runId), "bundle-suggestions", filters] as const,
  removalScenarios: (runId: string, filters?: RemovalScenarioFilter) => [...QUERY_KEYS.run(runId), "removal-scenarios", filters] as const,
};

export const useLatestRun = (branchId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.latestRun(branchId!),
    queryFn: () => menuAdvisorApi.getLatestRun(branchId!),
    enabled: !!branchId,
  });
};

export const useActiveRun = (branchId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.activeRun(branchId!),
    queryFn: () => menuAdvisorApi.getActiveRun(branchId!),
    enabled: !!branchId,
    // Poll every 5 seconds if we have an active run
    refetchInterval: (q) => (q.state.data ? 5000 : false),
  });
};

export const useCreateRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => menuAdvisorApi.createRun(branchId),
    onSuccess: (_, branchId) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activeRun(branchId) });
    },
  });
};

export const usePriceSuggestions = (runId: string | undefined, filters?: PriceSuggestionFilter) => {
  return useQuery({
    queryKey: QUERY_KEYS.priceSuggestions(runId!, filters),
    queryFn: () => menuAdvisorApi.getPriceSuggestions(runId!, filters),
    enabled: !!runId,
  });
};

export const useBundleSuggestions = (runId: string | undefined, filters?: BundleSuggestionFilter) => {
  return useQuery({
    queryKey: QUERY_KEYS.bundleSuggestions(runId!, filters),
    queryFn: () => menuAdvisorApi.getBundleSuggestions(runId!, filters),
    enabled: !!runId,
  });
};

export const useRemovalScenarios = (runId: string | undefined, filters?: RemovalScenarioFilter) => {
  return useQuery({
    queryKey: QUERY_KEYS.removalScenarios(runId!, filters),
    queryFn: () => menuAdvisorApi.getRemovalScenarios(runId!, filters),
    enabled: !!runId,
  });
};

export const useRecordDecision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      suggestion_id: string;
      suggestion_kind: "price" | "bundle" | "removal";
      branch_id: string;
      decision: Decision;
    }) => menuAdvisorApi.recordDecision(payload),
    onSuccess: () => {
      // Optimistically we could update cache, but for now just invalidate the run's suggestions
      qc.invalidateQueries({ queryKey: ["menu-advisor", "run"] });
    },
  });
};
