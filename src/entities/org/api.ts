import { apiClient } from "@/shared/api/client";
import type { Org } from "@/shared/types";

export const orgApi = {
  list: () => apiClient.get<Org[]>("/orgs").then((r) => r.data),
  get: (id: string) => apiClient.get<Org>(`/orgs/${id}`).then((r) => r.data),
  create: (data: { name: string; slug: string; currency_code?: string; tax_rate?: number; receipt_footer?: string | null }) =>
    apiClient.post<Org>("/orgs", data).then((r) => r.data),
  update: (id: string, data: Partial<Org>) => apiClient.patch<Org>(`/orgs/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/orgs/${id}`).then(() => undefined),
};
