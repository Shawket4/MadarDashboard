/**
 * Every read the Rewards pages make, built once for the page AND its sidebar
 * prefetch (`lib/prefetch/rewards.ts`), so the warmed key is the page's key.
 */
import type { QueryClient } from "@tanstack/react-query";

import {
  getGetLoyaltyAnalyticsQueryOptions,
  getGetLoyaltyCampaignEffectivenessQueryOptions,
  getGetLoyaltyCardDesignQueryOptions,
  getGetLoyaltyMemberQueryOptions,
  getGetLoyaltyMemberWalletQueryOptions,
  getGetLoyaltyRewardItemsQueryOptions,
  getGetLoyaltySettingsQueryOptions,
  getGetLoyaltyStatsQueryOptions,
  getGetLoyaltyTracksQueryOptions,
  getGetMyAuthzQueryKey,
  getListBranchesQueryOptions,
  getListLoyaltyBroadcastsQueryOptions,
  getListLoyaltyMembersQueryOptions,
  getListMenuItemsQueryOptions,
  queryLoyaltyMembers,
} from "@/data/api/generated/api";
import type { MembersQueryRequest, MyAuthz, Rule } from "@/data/api/generated/models";
import { useAuthStore } from "@/data/stores/auth.store";
import { programParams } from "@/features/loyalty/admin/queries";
import { Cap, type Capability } from "@/generated/capabilities";
import type { PrefetchCtx, RoutePrefetchMap } from "@/lib/route-prefetch";

import { rewardsMembersSearch, rewardsProgrammeSearch } from "./search";

export { programParams };

/** Overview: the period in the header scope (the stats are org-wide: no branch). */
export const statsParams = (s: { from: string | null; to: string | null }) => ({
  from: s.from ?? undefined,
  to: s.to ?? undefined,
});

/** Overview: win-back and birthday results, as Reports › Loyalty reads them. */
export const campaignParams = (s: { branchId: string | null; from: string | null; to: string | null }) => ({
  branch_id: s.branchId ?? undefined,
  from: s.from ?? undefined,
  to: s.to ?? undefined,
});

/** The overview's "recent messages". */
export const RECENT_BROADCASTS = { limit: 3 } as const;
/** The notifications log. */
export const BROADCAST_LOG = { limit: 50 } as const;

/** Members table page size. */
export const MEMBERS_PAGE = 50;

/** The segment in the URL (`?rules=` JSON) as rules; anything malformed reads as no segment. */
export function parseRules(raw: string): Rule[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v.filter((r) => r && typeof r === "object" && typeof (r as Rule).type === "string") as Rule[]) : [];
  } catch {
    return [];
  }
}
export const rulesParam = (rules: Rule[]): string => (rules.length ? JSON.stringify(rules) : "");

/** The members table's request body, from its URL state. */
export function membersBody(v: { q: string; rules: string; sort: MembersQueryRequest["sort"]; asc: boolean; page: number }): MembersQueryRequest {
  const rules = parseRules(v.rules);
  return {
    q: v.q.trim() || null,
    audience: { rules },
    sort: v.sort,
    desc: !v.asc,
    limit: MEMBERS_PAGE,
    offset: (v.page - 1) * MEMBERS_PAGE,
  };
}

/** `POST /loyalty/members/query` is a read: a query keyed on its body (Orval made it a mutation). */
export const membersQueryOptions = (body: MembersQueryRequest) => ({
  queryKey: ["/loyalty/members/query", body] as const,
  queryFn: ({ signal }: { signal?: AbortSignal }) => queryLoyaltyMembers(body, undefined, signal),
});

/** What `useCan(cap)` answers, read from the cached `/authz/me` (a gated read is warmed only for who may run it). */
const can = (qc: QueryClient, cap: Capability) =>
  useAuthStore.getState().user?.role === "super_admin" ||
  !!qc.getQueryData<MyAuthz>(getGetMyAuthzQueryKey())?.capabilities.includes(cap);

function warmOverview(qc: QueryClient, ctx: PrefetchCtx): void {
  if (!can(qc, Cap.loyaltyMembersList)) return;
  void qc.prefetchQuery(getGetLoyaltyStatsQueryOptions(statsParams(ctx)));
  void qc.prefetchQuery(getGetLoyaltyCampaignEffectivenessQueryOptions(campaignParams(ctx)));
  void qc.prefetchQuery(getListLoyaltyBroadcastsQueryOptions(RECENT_BROADCASTS));
  const params = programParams(ctx.branchId);
  void qc.prefetchQuery(getGetLoyaltyAnalyticsQueryOptions(params, { query: { staleTime: 60_000 } }));
  void qc.prefetchQuery(getListLoyaltyMembersQueryOptions({ ...params, limit: 1 }, { query: { staleTime: 60_000 } }));
  if (can(qc, Cap.loyaltyRead)) void qc.prefetchQuery(getGetLoyaltyTracksQueryOptions());
}

function warmMembers(qc: QueryClient, ctx: PrefetchCtx): void {
  if (!can(qc, Cap.loyaltyMembersList)) return;
  const v = rewardsMembersSearch.entryValues(ctx.branchId, ctx.search);
  void qc.prefetchQuery(membersQueryOptions(membersBody(v)));
  if (can(qc, Cap.loyaltyRead)) void qc.prefetchQuery(getGetLoyaltyTracksQueryOptions());
}

function warmMember(qc: QueryClient, ctx: PrefetchCtx): void {
  const id = ctx.params?.memberId;
  if (!id || !can(qc, Cap.loyaltyRead)) return;
  void qc.prefetchQuery(getGetLoyaltyMemberQueryOptions(id));
  if (can(qc, Cap.loyaltyMembersList)) void qc.prefetchQuery(getGetLoyaltyMemberWalletQueryOptions(id));
}

function warmProgramme(qc: QueryClient, ctx: PrefetchCtx): void {
  if (!ctx.orgId) return;
  const params = programParams(ctx.branchId);
  void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: ctx.orgId }));
  const { tab } = rewardsProgrammeSearch.entryValues(ctx.branchId, ctx.search);
  if (tab === "programme" || tab === "rewards") void qc.prefetchQuery(getGetLoyaltySettingsQueryOptions(params));
  if (tab === "rewards") {
    void qc.prefetchQuery(getGetLoyaltyRewardItemsQueryOptions(params));
    void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: ctx.orgId }));
  }
  if (tab === "tracks") {
    void qc.prefetchQuery(getGetLoyaltyTracksQueryOptions());
    void qc.prefetchQuery(getListMenuItemsQueryOptions({ org_id: ctx.orgId }));
  }
}

/** Sidebar/palette intent prefetch for the Rewards module: route → its mount-time queries. */
export const rewardsRoutes: RoutePrefetchMap = {
  "/rewards": warmOverview,
  "/rewards/members": warmMembers,
  "/rewards/members/$memberId": warmMember,
  "/rewards/programme": warmProgramme,
  "/rewards/card": (qc) => {
    if (can(qc, Cap.loyaltyRead)) void qc.prefetchQuery(getGetLoyaltyCardDesignQueryOptions());
  },
  "/rewards/notifications": (qc) => {
    if (!can(qc, Cap.loyaltyMembersList)) return;
    void qc.prefetchQuery(getListLoyaltyBroadcastsQueryOptions(BROADCAST_LOG));
    if (can(qc, Cap.loyaltyRead)) void qc.prefetchQuery(getGetLoyaltyTracksQueryOptions());
  },
  "/rewards/automations": (qc, { branchId }) => {
    void qc.prefetchQuery(getGetLoyaltySettingsQueryOptions(programParams(branchId)));
  },
};
