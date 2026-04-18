import { apiClient } from "@/shared/api/client";
import type { Permission, PermissionMatrix, RolePermission } from "@/shared/types";

export interface PermissionUpsert {
  resource: string;
  action: string;
  granted: boolean;
}

export const permissionApi = {
  matrix: (userId: string) => apiClient.get<PermissionMatrix[]>(`/permissions/matrix/${userId}`).then((r) => r.data),
  forUser: (userId: string) => apiClient.get<Permission[]>(`/permissions/user/${userId}`).then((r) => r.data),
  upsert: (userId: string, data: PermissionUpsert) =>
    apiClient.put<Permission>(`/permissions/user/${userId}`, data).then((r) => r.data),
  remove: (userId: string, resource: string, action: string) =>
    apiClient.delete(`/permissions/user/${userId}/${resource}/${action}`).then(() => undefined),
  roles: () => apiClient.get<RolePermission[]>("/permissions/roles").then((r) => r.data),
  upsertRole: (data: { role: string; resource: string; action: string; granted: boolean }) =>
    apiClient.put<RolePermission>("/permissions/roles", data).then((r) => r.data),
};
