import { apiClient } from "@/shared/api/client";
import type { Discount } from "@/shared/types";

export const discountApi = {
  list: (orgId: string) =>
    apiClient.get<Discount[]>("/discounts", { params: { org_id: orgId } }).then((r) => r.data),
  create: (data: { org_id: string; name: string; dtype: "percentage" | "fixed"; value: number; is_active?: boolean }) =>
    apiClient.post<Discount>("/discounts", data).then((r) => r.data),
  update: (id: string, data: Partial<Omit<Discount, "id" | "org_id" | "created_at" | "updated_at">>) =>
    apiClient.patch<Discount>(`/discounts/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/discounts/${id}`).then(() => undefined),
};
