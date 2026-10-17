import type { QueryClient } from "@tanstack/react-query";

import {
  getGetMyAuthzQueryKey,
  getGetPlanQueryOptions,
  getListBranchesQueryOptions,
  getListCodesQueryOptions,
  getListDevicesQueryOptions,
  getListUsersQueryOptions,
} from "@/data/api/generated/api";
import type { MyAuthz } from "@/data/api/generated/models";
import { useAuthStore } from "@/data/stores/auth.store";
import { prefetchLoyaltySettings } from "@/features/loyalty/admin/queries";
import { prefetchOrgs } from "@/features/orgs/queries";
import { prefetchLoyaltyReport } from "@/features/reports/loyalty/queries";
import { Cap, type Capability } from "@/generated/capabilities";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** What `useCan(cap)` answers, read from the cached `/authz/me`: a gated query is warmed only for who may run it. */
const can = (qc: QueryClient, cap: Capability) =>
  useAuthStore.getState().user?.role === "super_admin" ||
  !!qc.getQueryData<MyAuthz>(getGetMyAuthzQueryKey())?.capabilities.includes(cap);

/** Sidebar/palette intent prefetch for the admin area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  // Settings opens on Appearance, which reads nothing from the server.
  "/settings": () => {},
  "/branch-setup": (qc, { branchId }) => {
    if (branchId) void qc.prefetchQuery(getGetPlanQueryOptions({ branch_id: branchId }));
  },
  "/settings/loyalty": prefetchLoyaltySettings,
  "/reports/loyalty": prefetchLoyaltyReport,
  "/orgs": prefetchOrgs,
  "/branches": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  },
  // The sidebar opens the Devices view (no ?view): the branch's devices and its activation codes.
  "/devices": (qc, { branchId }) => {
    if (!branchId) return;
    void qc.prefetchQuery(getListDevicesQueryOptions({ branch_id: branchId }));
    if (can(qc, Cap.branchesEdit)) void qc.prefetchQuery(getListCodesQueryOptions({ branch_id: branchId }));
  },
  // The linkable-users read ("Make employee") is gated by the Dawam module and a capability; left to mount.
  "/access/users": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListUsersQueryOptions({ org_id: orgId }));
  },
};
