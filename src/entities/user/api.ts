import { apiClient } from "@/shared/api/client";
import type { UserBranch, UserPublic } from "@/shared/types";

export interface UserMutation {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  org_id?: string;
  branch_id?: string | null;
  is_active?: boolean;
  pin?: string;
  password?: string;
}

export const userApi = {
  list: (orgId?: string | null) =>
    apiClient.get<UserPublic[]>("/users", { params: orgId ? { org_id: orgId } : {} }).then((r) => r.data),
  get: (id: string) => apiClient.get<UserPublic>(`/users/${id}`).then((r) => r.data),
  create: (data: UserMutation & { name: string; role: string }) =>
    apiClient.post<{ user: UserPublic }>("/users", data).then((r) => r.data.user),
  update: (id: string, data: UserMutation) => apiClient.patch<UserPublic>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/users/${id}`).then(() => undefined),
  listBranches: (id: string) => apiClient.get<UserBranch[]>(`/users/${id}/branches`).then((r) => r.data),
  assignBranch: (userId: string, branchId: string) =>
    apiClient.post(`/users/${userId}/branches`, { branch_id: branchId }).then(() => undefined),
  unassignBranch: (userId: string, branchId: string) =>
    apiClient.delete(`/users/${userId}/branches/${branchId}`).then(() => undefined),
};
