import {
  getListBranchesQueryOptions,
  getListOrgsQueryOptions,
  getListPaymentMethodsQueryOptions,
  getListUsersQueryOptions,
} from "@/data/api/generated/api";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** Sidebar/palette intent prefetch for the admin area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  "/branches": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  },
  "/orgs": (qc) => {
    void qc.prefetchQuery(getListOrgsQueryOptions());
  },
  "/users": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListUsersQueryOptions({ org_id: orgId }));
  },
  "/permissions": (qc, ctx) => routes["/users"](qc, ctx),
  "/access": (qc, ctx) => routes["/users"](qc, ctx),
  "/access/users": (qc, ctx) => routes["/users"](qc, ctx),
  "/access/roles": (qc, ctx) => routes["/users"](qc, ctx),
  "/settings/payment-methods": (qc, { orgId }) => {
    if (orgId) void qc.prefetchQuery(getListPaymentMethodsQueryOptions());
  },
};
