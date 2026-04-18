import { apiClient } from "@/shared/api/client";

export interface HealthResponse {
  status: string;
  services?: Record<string, string>;
}

export const healthApi = {
  get: () => apiClient.get<HealthResponse>("/health").then((r) => r.data),
};
