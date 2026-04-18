import { apiClient } from "@/shared/api/client";
import type {
  BranchInventoryAdjustment,
  BranchInventoryItem,
  BranchInventoryTransfer,
  InventoryUnit,
  OrgIngredient,
} from "@/shared/types";

export const inventoryApi = {
  // Catalog (org-level)
  listCatalog: (orgId: string) =>
    apiClient.get<OrgIngredient[]>(`/inventory/orgs/${orgId}/catalog`).then((r) => r.data),
  createCatalog: (
    orgId: string,
    data: { name: string; unit: InventoryUnit; category: string; description?: string; cost_per_unit?: number },
  ) => apiClient.post<OrgIngredient>(`/inventory/orgs/${orgId}/catalog`, data).then((r) => r.data),
  updateCatalog: (orgId: string, id: string, data: Partial<OrgIngredient>) =>
    apiClient.patch<OrgIngredient>(`/inventory/orgs/${orgId}/catalog/${id}`, data).then((r) => r.data),
  removeCatalog: (orgId: string, id: string) =>
    apiClient.delete(`/inventory/orgs/${orgId}/catalog/${id}`).then(() => undefined),

  // Branch stock
  listStock: (branchId: string) =>
    apiClient.get<BranchInventoryItem[]>(`/inventory/branches/${branchId}/stock`).then((r) => r.data),
  addStock: (branchId: string, data: { org_ingredient_id: string; current_stock: number; reorder_threshold: number }) =>
    apiClient.post<BranchInventoryItem>(`/inventory/branches/${branchId}/stock`, data).then((r) => r.data),
  updateStock: (branchId: string, id: string, data: Partial<BranchInventoryItem>) =>
    apiClient.patch<BranchInventoryItem>(`/inventory/branches/${branchId}/stock/${id}`, data).then((r) => r.data),
  removeStock: (branchId: string, id: string) =>
    apiClient.delete(`/inventory/branches/${branchId}/stock/${id}`).then(() => undefined),

  // Adjustments (immutable ledger — reverse via compensating entry)
  listAdjustments: (branchId: string) =>
    apiClient.get<BranchInventoryAdjustment[]>(`/inventory/branches/${branchId}/adjustments`).then((r) => r.data),
  createAdjustment: (
    branchId: string,
    data: { branch_inventory_id: string; adjustment_type: "add" | "remove"; quantity: number; note: string },
  ) =>
    apiClient
      .post<BranchInventoryAdjustment>(`/inventory/branches/${branchId}/adjustments`, data)
      .then((r) => r.data),

  // Transfers
  listTransfers: (branchId: string, direction?: "incoming" | "outgoing") =>
    apiClient
      .get<BranchInventoryTransfer[]>(`/inventory/branches/${branchId}/transfers`, {
        params: direction ? { direction } : {},
      })
      .then((r) => r.data),
  createTransfer: (data: {
    source_branch_id: string;
    destination_branch_id: string;
    org_ingredient_id: string;
    quantity: number;
    note?: string;
  }) => apiClient.post<BranchInventoryTransfer>("/inventory/transfers", data).then((r) => r.data),
  updateTransfer: (id: string, note: string | null) =>
    apiClient.patch<BranchInventoryTransfer>(`/inventory/transfers/${id}`, { note }).then((r) => r.data),
  removeTransfer: (id: string) => apiClient.delete(`/inventory/transfers/${id}`).then(() => undefined),
};
