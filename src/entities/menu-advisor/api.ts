import { apiClient } from "@/shared/api/client";
import type { 
  RunRecord, 
  PriceSuggestionRecord, 
  BundleSuggestionRecord, 
  RemovalScenarioRecord,
  PriceSuggestionFilter,
  BundleSuggestionFilter,
  RemovalScenarioFilter,
  DecisionRecord,
  Decision
} from "./schemas";

export const menuAdvisorApi = {
  // Runs
  createRun: async (branchId: string, config?: any): Promise<{ run_id: string }> => {
    const { data } = await apiClient.post(`/menu-advisor/branches/${branchId}/runs`, { config });
    return data;
  },

  listRuns: async (branchId: string): Promise<RunRecord[]> => {
    const { data } = await apiClient.get(`/menu-advisor/branches/${branchId}/runs`);
    return data;
  },

  getLatestRun: async (branchId: string): Promise<RunRecord | null> => {
    // any_status: failed and in-progress runs must surface too (three-way empty state)
    const { data } = await apiClient.get(`/menu-advisor/branches/${branchId}/runs/latest`, {
      params: { any_status: true },
    });
    return data;
  },

  getActiveRun: async (branchId: string): Promise<RunRecord | null> => {
    const { data } = await apiClient.get(`/menu-advisor/branches/${branchId}/runs/active`);
    return data;
  },

  getRun: async (runId: string): Promise<RunRecord> => {
    const { data } = await apiClient.get(`/menu-advisor/runs/${runId}`);
    return data;
  },

  // Suggestions
  getPriceSuggestions: async (runId: string, params?: PriceSuggestionFilter): Promise<PriceSuggestionRecord[]> => {
    const { data } = await apiClient.get(`/menu-advisor/runs/${runId}/price-suggestions`, { params });
    return data;
  },

  getBundleSuggestions: async (runId: string, params?: BundleSuggestionFilter): Promise<BundleSuggestionRecord[]> => {
    const { data } = await apiClient.get(`/menu-advisor/runs/${runId}/bundle-suggestions`, { params });
    return data;
  },

  getRemovalScenarios: async (runId: string, params?: RemovalScenarioFilter): Promise<RemovalScenarioRecord[]> => {
    const { data } = await apiClient.get(`/menu-advisor/runs/${runId}/removal-scenarios`, { params });
    return data;
  },

  // Decisions
  recordDecision: async (payload: {
    suggestion_id: string;
    suggestion_kind: "price" | "bundle" | "removal";
    branch_id: string;
    decision: Decision;
    notes?: string;
  }): Promise<DecisionRecord> => {
    const { data } = await apiClient.post(`/menu-advisor/decisions`, payload);
    return data;
  },
};
