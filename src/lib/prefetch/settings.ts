import type { QueryClient } from "@tanstack/react-query";

import {
  getGetAvailabilityQueryOptions,
  getGetBranchSettingsQueryOptions,
  getGetLinksPageQueryOptions,
  getGetMenuDisplayQueryOptions,
  getGetMyAuthzQueryKey,
  getGetOnboardingQueryOptions,
  getGetOrgPlanQueryOptions,
  getGetOrgQueryOptions,
  getGetRoutingModeQueryOptions,
  getGetSettingsQueryOptions,
  getListBranchesQueryOptions,
  getListCategoriesQueryOptions,
  getListCredentialsQueryOptions,
  getListDevicesQueryOptions,
  getListDiscountsQueryOptions,
  getListFlagsQueryOptions,
  getListMenuCatalogQueryOptions,
  getListPaymentMethodsQueryOptions,
  getListRolesQueryOptions,
  getListRoutesQueryOptions,
  getListStationsQueryOptions,
  getListTablesQueryOptions,
  getListUsersQueryOptions,
  getListZonesQueryOptions,
  getPublicOrgBrandQueryOptions,
  getWhatsappStatusQueryOptions,
} from "@/data/api/generated/api";
import type { MyAuthz } from "@/data/api/generated/models";
import { useAuthStore } from "@/data/stores/auth.store";
import { prefetchComboEditor } from "@/features/combos/queries";
import { kitchenRoutingSearch, routingCatalogParams } from "@/features/kitchen-stations/search";
import { prefetchMenuStudio } from "@/features/menu/queries";
import { paymentMethodsSearch } from "@/features/payment-methods/search";
import { orgBrandQueryOptions } from "@/features/settings/queries";
import { Cap, type Capability } from "@/generated/capabilities";
import { hasFeature } from "@/generated/plans";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

const superAdmin = () => useAuthStore.getState().user?.role === "super_admin";

/** What `useCan(cap)` answers, read from the cached `/authz/me`: a gated query is warmed only for who may run it. */
const can = (qc: QueryClient, ...caps: Capability[]) => {
  if (superAdmin()) return true;
  const held = qc.getQueryData<MyAuthz>(getGetMyAuthzQueryKey())?.capabilities ?? [];
  return caps.some((c) => held.includes(c));
};

/** `useHasFeature(f)`, outside React. */
const planHas = (f: Parameters<typeof hasFeature>[1]) => hasFeature(useAuthStore.getState().plan, f);

/** The export logo every exporting pane reads (`useExportLogo` → `usePublicBrand`), with the hook's own options. */
const warmExportLogo = (qc: QueryClient, orgId: string | null) => {
  if (orgId) void qc.prefetchQuery({ ...getPublicOrgBrandQueryOptions({ org_id: orgId }), staleTime: 5 * 60_000, retry: false });
};

/**
 * Intent prefetch for the Settings panes, Access and the menu/combo editors:
 * route → its mount-time queries, with the page's own params.
 */
export const routes: RoutePrefetchMap = {
  // ── Access ─────────────────────────────────────────────────────────────────
  "/access/review": (qc) => {
    void qc.prefetchQuery(getListFlagsQueryOptions({ include_reviewed: undefined }));
  },
  // The ask-a-manager policy waits on a selected role: left to the page.
  "/access/roles": (qc) => {
    if (can(qc, Cap.staffPermissionsRead, Cap.staffRolesManage)) void qc.prefetchQuery(getListRolesQueryOptions());
  },

  // ── Editors ────────────────────────────────────────────────────────────────
  "/menu/items/$itemId": (qc, { orgId, params }) => {
    const itemId = params?.itemId;
    if (itemId && itemId !== "new") prefetchMenuStudio(qc, orgId, itemId, planHas("inventory"));
  },
  "/menu/combos/$comboId": (qc, { orgId, params }) => {
    const comboId = params?.comboId;
    if (comboId && comboId !== "new" && can(qc, Cap.menuItemsRead)) prefetchComboEditor(qc, orgId, comboId);
  },

  // ── First run ──────────────────────────────────────────────────────────────
  // The step panel's reads follow the first open step: left to the page.
  "/onboarding": (qc, { orgId }) => {
    if (!orgId) return;
    void qc.prefetchQuery(getGetOnboardingQueryOptions(orgId));
    void qc.prefetchQuery(getGetOrgQueryOptions(orgId));
  },

  // ── Settings panes ─────────────────────────────────────────────────────────
  "/settings/bookings": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  },
  "/settings/brand": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(orgBrandQueryOptions(orgId));
  },
  "/settings/combos": (qc, { orgId }) => {
    if (!orgId || !can(qc, Cap.orgSettingsRead, Cap.menuCombosEdit)) return;
    void qc.prefetchQuery(getGetSettingsQueryOptions());
    void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  },
  "/settings/delivery": (qc, { orgId, branchId }) => {
    if (!branchId) return;
    void qc.prefetchQuery(getGetBranchSettingsQueryOptions({ branch_id: branchId }));
    if (orgId) void qc.prefetchQuery(getListDiscountsQueryOptions({ org_id: orgId }));
  },
  "/settings/delivery-zones": (qc, { branchId }) => {
    if (branchId) void qc.prefetchQuery(getListZonesQueryOptions({ branch_id: branchId }));
  },
  "/settings/integrations": (qc, { orgId }) => {
    if (orgId && can(qc, Cap.integrationsRead)) void qc.prefetchQuery(getListCredentialsQueryOptions());
  },
  "/settings/kitchen-routing": (qc, { orgId, branchId, search }) => {
    warmExportLogo(qc, orgId);
    if (!branchId) return;
    void qc.prefetchQuery(getListStationsQueryOptions({ branch_id: branchId }));
    void qc.prefetchQuery(getListRoutesQueryOptions({ branch_id: branchId }));
    if (!orgId) return;
    void qc.prefetchQuery(getListCategoriesQueryOptions({ org_id: orgId }));
    const f = kitchenRoutingSearch.entryValues(branchId, search);
    if (f.tab === "items") void qc.prefetchQuery(getListMenuCatalogQueryOptions(routingCatalogParams(orgId, f)));
  },
  "/settings/kitchen-stations": (qc, { branchId }) => {
    if (!branchId) return;
    void qc.prefetchQuery(getListStationsQueryOptions({ branch_id: branchId }));
    void qc.prefetchQuery(getGetRoutingModeQueryOptions({ branch_id: branchId }));
  },
  "/settings/links": (qc, { orgId }) => {
    if (!orgId) return;
    void qc.prefetchQuery(getGetMenuDisplayQueryOptions(orgId));
    if (planHas("branding")) void qc.prefetchQuery(getGetLinksPageQueryOptions(orgId));
  },
  "/settings/payment-methods": (qc, { orgId, branchId, search }) => {
    if (!orgId) return;
    void qc.prefetchQuery(getListPaymentMethodsQueryOptions());
    warmExportLogo(qc, orgId);
    if (paymentMethodsSearch.entryValues(branchId, search).tab !== "availability") return;
    void qc.prefetchQuery(getListUsersQueryOptions({ org_id: orgId }));
    if (!branchId) return;
    void qc.prefetchQuery(getGetAvailabilityQueryOptions({ branch_id: branchId }));
    void qc.prefetchQuery(getListDevicesQueryOptions({ branch_id: branchId }));
  },
  "/settings/plan": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getGetOrgPlanQueryOptions(orgId));
  },
  "/settings/qr": (qc, { branchId }) => {
    if (branchId) void qc.prefetchQuery(getListTablesQueryOptions(branchId));
  },
  // Polled every 2.5 s while open, for the platform only.
  "/settings/whatsapp": (qc) => {
    if (superAdmin()) void qc.prefetchQuery(getWhatsappStatusQueryOptions());
  },
};
