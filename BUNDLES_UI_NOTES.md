# Madar POS React Dashboard — Bundles Management UI Blueprint

This document records the findings and designs compiled during the **Investigation Phase (§1)** of the Bundles management feature implementation. It acts as the definitive design system and API contract mapping for frontend development, ensuring seamless alignment with the recently audited Rust backend.

---

## 1. Architectural Alignment & Layering

Our dashboard adheres strictly to the **Feature-Sliced Design (FSD)** guidelines. The Bundles management feature will be divided across the layers as follows:

```
src/
├── app/
│   └── router/               # Route registration
├── entities/
│   └── bundle/               # Domain-specific API client, queries, and schemas
│       ├── api.ts            # Axios endpoints mapped via apiClient
│       ├── queries.ts        # TanStack Query v5 queries & mutations
│       └── schemas.ts        # Zod validation schemas
├── shared/
│   ├── config/               # Registry of constants and QUERY_KEYS
│   ├── types/                # Domain type interfaces (index.ts)
│   └── hooks/                # Role Gating & Permissions
└── pages/
    └── bundles/              # Core screen container (lazy-loaded)
        └── bundles.tsx       # Main Page component with List, CRUD, and Metrics
```

---

## 2. API Surface & Type Definitions

We will register our domain types inside `src/shared/types/index.ts`. Below are the exact TypeScript interfaces matching the audited Rust backend structures (with EGP piastres represented correctly):

```typescript
// src/shared/types/index.ts (Append Section)

export type BundleStatus = "draft" | "active" | "archived";

export interface Bundle {
  id: string;
  org_id: string;
  name: string;
  name_translations: Record<string, string>;
  description: string | null;
  description_translations: Record<string, string>;
  price: number; // Stored in piastres
  status: BundleStatus;
  image_url: string | null;
  display_order: number;
  available_from_time: string | null; // "HH:MM:SS" format or null
  available_until_time: string | null; // "HH:MM:SS" format or null
  available_from_date: string | null; // "YYYY-MM-DD" format or null
  available_until_date: string | null; // "YYYY-MM-DD" format or null
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BundleComponentHydrated {
  id: string;
  bundle_id: string;
  item_id: string;
  quantity: number;
  position: number;
  item_name: string;
  item_price: number; // Stored in piastres
  item_cost: number;  // Stored in piastres
}

export interface BundleWithComponents {
  id: string;
  org_id: string;
  name: string;
  name_translations: Record<string, string>;
  description: string | null;
  description_translations: Record<string, string>;
  price: number; // Stored in piastres
  status: BundleStatus;
  image_url: string | null;
  display_order: number;
  available_from_time: string | null;
  available_until_time: string | null;
  available_from_date: string | null;
  available_until_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  components: BundleComponentHydrated[];
  branch_ids: string[];
  computed_cost: number; // Sum of component costs (piastres)
}

export interface PaginatedBundles {
  data: BundleWithComponents[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ComponentPopularity {
  item_id: string;
  item_name: string;
  quantity_sold: number;
}

export interface BundlePerformanceResponse {
  sales_volume: number;
  gross_revenue: number; // Stored in piastres
  net_profit: number;    // Stored in piastres
  component_popularity: ComponentPopularity[];
}
```

---

## 3. API Client Definitions (`src/entities/bundle/api.ts`)

Axios endpoints mapped using the shared `apiClient` instance in `src/shared/api/client.ts`. All numeric prices/costs are converted to decimal EGP strings inside form flows, but are transmitted as piastres to the backend:

```typescript
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
```

---

## 4. TanStack Query v5 Hook Conventions (`src/entities/bundle/queries.ts`)

We will register dynamic cache keys under `QUERY_KEYS` in `src/shared/config/constants.ts` and construct standard `useQuery` and `useMutation` hooks:

```typescript
// Add keys in QUERY_KEYS registry in src/shared/config/constants.ts:
// bundles: (orgId: string, params: unknown) => ["bundles", orgId, params] as const,
// bundle: (id: string) => ["bundle", id] as const,
// bundlePerformance: (id: string, params: unknown) => ["bundle-performance", id, params] as const,

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { bundleApi } from "./api";

export const useBundlesList = (orgId: string | null, params: Parameters<typeof bundleApi.list>[0]) =>
  useQuery({
    queryKey: QUERY_KEYS.bundles(orgId ?? "", params),
    queryFn: () => bundleApi.list(params),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });

export const useBundleDetail = (id: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.bundle(id ?? ""),
    queryFn: () => bundleApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useBundlePerformance = (id: string | null, params?: Parameters<typeof bundleApi.getPerformance>[1]) =>
  useQuery({
    queryKey: QUERY_KEYS.bundlePerformance(id ?? "", params),
    queryFn: () => bundleApi.getPerformance(id!, params),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
```

---

## 5. Zod Form Validation (`src/entities/bundle/schemas.ts`)

The validation schema enforces both basic UI rules and exact matching of the backend business rules (such as component range constraints):

```typescript
import { z } from "zod";
import { egpToPiastres } from "@/shared/lib/zod-utils";

export const bundleSchema = z.object({
  name: z.string().trim().min(1, "Bundle name is required"),
  description: z.string().trim().nullish().or(z.literal("")),
  price: egpToPiastres, // String EGP ("150.00") -> Piastres Integer (15000)
  display_order: z.coerce.number().int().min(0).default(0),
  
  // Date/Time availability constraints (optional)
  available_from_time: z.string().nullish().or(z.literal("")),
  available_until_time: z.string().nullish().or(z.literal("")),
  available_from_date: z.string().nullish().or(z.literal("")),
  available_until_date: z.string().nullish().or(z.literal("")),

  // Bundle Components: Between 2 and 6 menu items, with quantity min 1
  components: z
    .array(
      z.object({
        item_id: z.string().min(1, "Menu item is required"),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
        position: z.number().int().optional(),
      })
    )
    .min(2, "A bundle must contain at least 2 items")
    .max(6, "A bundle cannot contain more than 6 items")
    .refine(
      (items) => {
        const ids = items.map((it) => it.item_id);
        return new Set(ids).size === ids.length;
      },
      {
        message: "Duplicate menu items are not allowed in components",
        path: [0, "item_id"], // Focus error on components array
      }
    ),

  // Available branches
  branch_ids: z.array(z.string()).default([]),
});

export type BundleFormValues = z.infer<typeof bundleSchema>;
```

---

## 6. Shared Component Reuse Strategy

To maintain complete visual and behavioral consistency, we will reuse the following existing UI elements:

1. **Item Picker**: We will leverage `SearchableSelect` (`src/shared/ui/searchable-select.tsx`) to implement the menu item selector in the components sub-form. Tellers or managers can search menu items by name, see their categories/prices as hints, and click to add them to their component array.
2. **Image Uploader**: We will reuse `ImageUploader` (`src/shared/ui/image-uploader.tsx`) inside the bundle form dialog. Because the backend requires the bundle ID to exist before uploading, we will render a helpful text box during create mode (*"Save the bundle first to upload an image"*), and display the full uploader in edit mode, exactly as seen in `MenuItemDialog` (`src/pages/menu/menu.tsx`).
3. **Currency Inputs**: Base prices and custom bundle prices will render as regular numbers with a step constraint (`step="0.5"`) inside forms, and will be formatted back and forth using the shared `fmtMoney` and `piastresToEgp` helpers from `src/shared/lib/format.ts`.

---

## 7. Role Gating & Permissions

Gating will be enforced using the standard FSD permission model in `src/shared/hooks/use-permissions.ts`. Bundles are classified alongside menu catalog items:
- **Org Admin**: Full permissions (`read`, `create`, `update`, `delete`).
- **Branch Manager**: Read-only permission (`read`).
- **Teller**: Read-only permission (`read`) for cart/POS catalog visibility.

We will append the `bundles` permission nodes to `ROLE_DEFAULTS` inside `use-permissions.ts` to ensure clean gating at page load.

---

## 8. Advisor Gating & URL Synchronized Entry-points

When navigating from the Menu Advisor view to create a bundle from a suggestion, the promotion action will trigger a redirect containing query params:
`http://localhost:5173/bundles?action=create&advisor_suggestion=true&name=Double+Espresso+Bundle&item_ids=uuid1,uuid2&prices=50,60`

The Page controller in `bundles.tsx` will parse these params during `useEffect` initialization:
1. Initialize the Bundle creation dialog.
2. Hydrate the React Hook Form `defaultValues` directly with the parsed advisor suggestion details.
3. Keep the user in the standard Creation Flow where they can fine-tune the bundle name, price overrides, and availability before saving.

---

## Conclusion

This blueprint represents a clean, robust, and FSD-compliant integration plan. The next phase will proceed with creating the domain layer files (`src/entities/bundle/`).
