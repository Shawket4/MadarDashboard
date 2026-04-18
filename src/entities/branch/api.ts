import { apiClient } from "@/shared/api/client";
import type { Branch, PrinterBrand } from "@/shared/types";

export interface BranchMutation {
  org_id?: string;
  name?: string;
  address?: string | null;
  phone?: string | null;
  timezone?: string;
  printer_brand?: PrinterBrand | null;
  printer_ip?: string | null;
  printer_port?: number | null;
  is_active?: boolean;
}

export const branchApi = {
  list: (orgId: string) => apiClient.get<Branch[]>("/branches", { params: { org_id: orgId } }).then((r) => r.data),
  get: (id: string) => apiClient.get<Branch>(`/branches/${id}`).then((r) => r.data),
  create: (data: BranchMutation & { org_id: string; name: string }) =>
    apiClient.post<Branch>("/branches", data).then((r) => r.data),
  update: (id: string, data: BranchMutation) => apiClient.put<Branch>(`/branches/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/branches/${id}`).then(() => undefined),
};
