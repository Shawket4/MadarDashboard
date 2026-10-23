/**
 * Rewards › Members: every member, searched, filtered by a segment (the same
 * audience rules a message is sent to), sorted and paged by the server
 * (`POST /loyalty/members/query`). The state lives in the URL, so a link to a
 * segment is shareable and Back returns to it. A row opens the member's page.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, BellOff, Users } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Page, PageHeader } from "@/components/app/page";
import { Restricted } from "@/components/app/restricted";
import { SearchInput } from "@/components/app/search-input";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGetLoyaltyMemberQueryOptions } from "@/data/api/generated/api";
import type { CrmMember, MemberSort } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { keepScope } from "@/data/scope/list-search";
import { paginationFrom, useListFilters, useSearchInput } from "@/data/scope/use-list-filters";
import { currencyLabel } from "@/features/loyalty/shared/util";
import { fmtDate, fmtNumber } from "@/lib/format";
import { useWarmRoute } from "@/lib/prefetch/nav-context";

import { rewardsAccess } from "../access";
import { AudienceBuilder } from "../audience/audience-builder";
import { useAudienceValid } from "../audience/use-audience-valid";
import { MEMBERS_PAGE, membersBody, membersQueryOptions, parseRules, rulesParam } from "../queries";
import { rewardsMembersSearch } from "../search";
import { useTrackNames } from "../use-track-names";

const SORTS: MemberSort[] = ["joined", "last_visit", "balance", "name"];

export function RewardsMembersPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const { canListMembers } = rewardsAccess(authz);
  if (authz.ready && !canListMembers) {
    return (
      <Restricted
        title={t("rewards.members.title", "Members")}
        who={t("rewards.members.restricted", "Your account can't list the programme's members. The owner can give you access.")}
      />
    );
  }
  return <MembersBody />;
}

function MembersBody() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const warmRoute = useWarmRoute();
  const filters = useListFilters(rewardsMembersSearch);
  const v = filters.values;
  const [search, setSearch] = useSearchInput(v.q, (q) => filters.set({ q }));
  const { tracks, mode } = useTrackNames();
  const rules = useMemo(() => parseRules(v.rules), [v.rules]);
  const valid = useAudienceValid(rules, tracks.length);
  const body = useMemo(() => membersBody(v), [v]);
  // An invalid segment is never sent: the server would refuse it.
  const list = useQuery({ ...membersQueryOptions(body), enabled: valid, placeholderData: keepPreviousData });
  const { pagination, onPaginationChange } = paginationFrom(filters, MEMBERS_PAGE);
  const total = list.data?.total ?? 0;
  const unit = mode ?? "visits";

  const memberTarget = (id: string) => ({ to: "/rewards/members/$memberId", params: { memberId: id }, search: keepScope });

  const sortLabel = (s: MemberSort) =>
    s === "joined"
      ? t("rewards.members.sortJoined", "Joined")
      : s === "last_visit"
        ? t("rewards.members.sortLastVisit", "Last visit")
        : s === "balance"
          ? t("rewards.members.sortBalance", "Balance")
          : t("rewards.members.sortName", "Name");

  const columns = useMemo<ColumnDef<CrmMember>[]>(
    () => [
      {
        id: "name",
        header: t("rewards.members.colName", "Name"),
        meta: { label: t("rewards.members.colName", "Name"), phone: "title" },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium" dir="auto">
              {row.original.name}
            </span>
            {row.original.marketing_opt_out ? (
              <StatusPill tone="neutral" size="sm" icon={BellOff}>
                {t("rewards.members.optedOut", "No offers")}
              </StatusPill>
            ) : null}
          </div>
        ),
      },
      {
        id: "phone",
        header: t("rewards.members.colPhone", "Phone"),
        meta: { label: t("rewards.members.colPhone", "Phone") },
        cell: ({ row }) => (
          <span className="font-mono text-sm tabular" dir="ltr">
            {row.original.phone}
          </span>
        ),
      },
      {
        id: "balance",
        header: t("rewards.members.colBalance", "Balance"),
        meta: { label: t("rewards.members.colBalance", "Balance") },
        cell: ({ row }) => {
          const r = row.original;
          if (r.tracks && r.tracks.length > 1) {
            return (
              <div className="flex flex-wrap gap-1">
                {r.tracks.map((tr) => (
                  <StatusPill key={tr.position} tone={tr.rewards_ready > 0 ? "success" : "neutral"} size="sm">
                    <bdi>{tracks.find((x) => x.position === tr.position)?.name ?? tr.name_en}</bdi>{" "}
                    <span className="font-mono tabular" dir="ltr">
                      {tr.progress_to_next}/{tr.size}
                    </span>
                  </StatusPill>
                ))}
              </div>
            );
          }
          return (
            <span className="font-mono tabular">
              {fmtNumber(r.balance)} <span className="text-xs text-muted-foreground">{currencyLabel(unit, r.balance)}</span>
            </span>
          );
        },
      },
      {
        id: "rewards",
        header: t("rewards.members.colRewards", "Rewards ready"),
        meta: { label: t("rewards.members.colRewards", "Rewards ready"), numeric: true },
        cell: ({ row }) => {
          const n = row.original.tracks?.reduce((s, x) => s + x.rewards_ready, 0) ?? row.original.rewards_ready;
          return n > 0 ? <StatusPill tone="success" size="sm">{fmtNumber(n)}</StatusPill> : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "last_visit",
        header: t("rewards.members.colLastVisit", "Last visit"),
        meta: { label: t("rewards.members.colLastVisit", "Last visit"), numeric: true },
        cell: ({ row }) => fmtDate(row.original.last_visit_at),
      },
      {
        id: "joined",
        header: t("rewards.members.colJoined", "Joined"),
        meta: { label: t("rewards.members.colJoined", "Joined"), numeric: true },
        cell: ({ row }) => fmtDate(row.original.enrolled_at),
      },
      {
        id: "wallet",
        header: t("rewards.members.colWallet", "Card"),
        meta: { label: t("rewards.members.colWallet", "Card") },
        cell: ({ row }) => {
          const r = row.original;
          if (r.apple_devices === 0 && !r.google_card) return <span className="text-xs text-muted-foreground">{t("rewards.members.noCard", "No card")}</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {r.apple_devices > 0 ? (
                <StatusPill tone="info" size="sm">
                  {t("rewards.members.apple", { defaultValue: "Apple ×{{n}}", n: r.apple_devices })}
                </StatusPill>
              ) : null}
              {r.google_card ? (
                <StatusPill tone="info" size="sm">
                  {t("rewards.members.google", "Google")}
                </StatusPill>
              ) : null}
            </div>
          );
        },
      },
    ],
    [t, tracks, unit],
  );

  const filtered = !!v.q || rules.length > 0;

  return (
    <Page>
      <PageHeader
        title={t("rewards.members.title", "Members")}
        subtitle={
          list.data
            ? t("rewards.members.count", { defaultValue: "{{n}} members match", n: fmtNumber(total) })
            : t("rewards.members.subtitle", "Everyone on the card: search, filter by a segment, open one.")
        }
      />
      <div className="space-y-3">
        <AudienceBuilder rules={rules} onChange={(r) => filters.set({ rules: rulesParam(r) })} tracks={tracks} />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("rewards.members.search", "Search by name or phone")}
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-1.5 sm:ms-auto">
            <Select value={v.sort} onValueChange={(s) => filters.set({ sort: s as MemberSort })}>
              <SelectTrigger className="w-auto min-w-36" aria-label={t("rewards.members.sortBy", "Sort by")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {sortLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => filters.set({ asc: !v.asc })}
              aria-label={v.asc ? t("rewards.members.ascending", "Ascending") : t("rewards.members.descending", "Descending")}
              aria-pressed={v.asc}
            >
              {v.asc ? <ArrowUpNarrowWide className="size-4" /> : <ArrowDownWideNarrow className="size-4" />}
            </Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={list.data?.rows ?? []}
          loading={list.isLoading && valid}
          error={list.error}
          onRetry={() => void list.refetch()}
          getRowId={(r) => r.id}
          onRowClick={(r) => void navigate(memberTarget(r.id) as never)}
          onRowPrefetch={(r) => (warmRoute ? warmRoute(memberTarget(r.id)) : void qc.prefetchQuery(getGetLoyaltyMemberQueryOptions(r.id)))}
          hideViewOptions
          manualPagination
          pageCount={Math.ceil(total / MEMBERS_PAGE)}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          emptyState={
            <EmptyState
              icon={Users}
              title={filtered ? t("rewards.members.noMatch", "No members match") : t("rewards.members.none", "No members yet")}
              description={
                filtered
                  ? t("rewards.members.noMatchHint", "Try another name or phone, or a wider segment.")
                  : t("rewards.members.noneHint", "Customers join by scanning the counter code.")
              }
            />
          }
        />
      </div>
    </Page>
  );
}
