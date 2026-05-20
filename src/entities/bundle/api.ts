import { apiClient } from "@/shared/api/client";
import type { BundleWithComponents, PaginatedBundles, BundlePerformanceResponse } from "@/shared/types";

export interface CreateBundleComponentPayload {
  item_id: string;
  quantity: number;
  position?: number;
}

export interface CreateBundlePayload {
  org_id: string;
  name: string;
  name_translations?: Record<string, string>;
  description?: string | null;
  description_translations?: Record<string, string>;
  price: number; // Piastres
  image_url?: string | null;
  display_order?: number;
  available_from_time?: string | null;
  available_until_time?: string | null;
  available_from_date?: string | null;
  available_until_date?: string | null;
  components: CreateBundleComponentPayload[];
  branch_ids?: string[];
}

export interface UpdateBundlePayload {
  name?: string;
  name_translations?: Record<string, string>;
  description?: string | null;
  description_translations?: Record<string, string>;
  price?: number; // Piastres
  image_url?: string | null;
  display_order?: number;
  available_from_time?: string | null;
  available_until_time?: string | null;
  available_from_date?: string | null;
  available_until_date?: string | null;
  components?: CreateBundleComponentPayload[];
  branch_ids?: string[];
}

export const bundleApi = {
  list: (params: {
    org_id: string;
    status?: string;
    branch_id?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) =>
    apiClient
      .get<PaginatedBundles>("/bundles", { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<BundleWithComponents>(`/bundles/${id}`).then((r) => r.data),

  create: (payload: CreateBundlePayload) =>
    apiClient.post<BundleWithComponents>("/bundles", payload).then((r) => r.data),

  update: (id: string, payload: UpdateBundlePayload) =>
    apiClient.patch<BundleWithComponents>(`/bundles/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/bundles/${id}`).then(() => undefined),

  activate: (id: string) =>
    apiClient.post<BundleWithComponents>(`/bundles/${id}/activate`).then((r) => r.data),

  archive: (id: string) =>
    apiClient.post<BundleWithComponents>(`/bundles/${id}/archive`).then((r) => r.data),

  getPerformance: (id: string, params?: { start_date?: string; end_date?: string }) =>
    apiClient
      .get<BundlePerformanceResponse>(`/bundles/${id}/performance`, { params })
      .then((r) => r.data),

  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiClient.post<{ image_url: string }>(`/uploads/menu-items/${id}`, fd).then((r) => r.data);
  },
};
