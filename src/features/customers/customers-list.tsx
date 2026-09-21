/**
 * The one list of people. The Customers page draws it over everybody; the
 * Loyalty → Members tab draws the same list locked to members. One search box,
 * one load-more window, one export, one sheet per person.
 *
 * Which endpoint it reads follows what the viewer may see (`peopleSource`):
 * `/customers` for anyone with `customers.view`, the loyalty members endpoint
 * for someone who holds only `loyalty.members.list` — who then gets exactly
 * the columns the members list always had and nothing about orders or spend.
 */
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { keepPreviousData } from "@tanstack/react-query";
import { Star, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { ListCount, PeopleList } from "@/components/app/people-list";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  listCustomers,
  listLoyaltyMembers,
  useGetLoyaltySettings,
  useListCustomers,
  useListLoyaltyMembers,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { GoogleObjectDialog } from "@/features/loyalty/admin/members/google-object-dialog";
import { currencyLabel, modeOf } from "@/features/loyalty/shared/util";
import { OrderDetailSheet } from "@/features/orders/order-detail-sheet";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useListSearch } from "@/hooks/use-list-search";
import { useLoadMore } from "@/hooks/use-load-more";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { EXPORT_REQUEST, fetchAllPages } from "@/lib/export-all";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/phone";

import { peopleAccess, peopleSource } from "./access";
import { CustomerDetailSheet } from "./customer-detail-sheet";
import { LIMIT_MAX, MEMBERS_LIMIT_MAX, PAGE_SIZE, SOURCES, isSource, rowOfCustomer, rowOfMember, type CustomerSource, type PersonRow } from "./util";

const ALL = "all";

export function CustomersList({
  membersOnly = false,
  branchId = null,
  openId,
  onOpenIdChange,
}: {
  /** Locked to loyalty members — the Loyalty → Members tab. */
  membersOnly?: boolean;
  /** The branch whose program a member's balance is read under (Members tab). */
  branchId?: string | null;
  /** The person whose sheet is open. The caller owns it so "Add" can open one. */
  openId: string | null;
  onOpenIdChange: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const access = peopleAccess(useAuthz());
  const source = peopleSource(access, membersOnly);
  const fromCustomers = source === "customers";

  const { search, setSearch, q } = useListSearch();
  const [onlyMembers, setOnlyMembers] = useState(false);
  const [from, setFrom] = useState<CustomerSource | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<{ id: string; name: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();
  const membersSwitchId = useId();

  // Points or orders, and whether the shop runs a program at all — only for
  // someone who may read it; otherwise the badge alone says "member".
  const program = useGetLoyaltySettings(branchId ? { branch_id: branchId } : {}, {
    query: { enabled: fromCustomers && access.canReadProgram },
  });
  const mode = program.data ? modeOf(program.data) : null;
  const showBalance = fromCustomers && mode !== null && (membersOnly || program.data?.enabled === true);

  const member = membersOnly || onlyMembers ? true : undefined;
  const customerFilters = { q: q || undefined, member, source: from ?? undefined };
  const memberFilters = { ...(branchId ? { branch_id: branchId } : {}), ...(q ? { q } : {}) };

  // "Load more" widens the window from the top; a new search or filter starts over.
  const more = useLoadMore({
    resetKey: `${q}|${member ?? ""}|${from ?? ""}`,
    pageSize: PAGE_SIZE,
    max: fromCustomers ? LIMIT_MAX : MEMBERS_LIMIT_MAX,
  });
  const customers = useListCustomers(
    { ...customerFilters, limit: more.limit, offset: 0 },
    { query: { enabled: fromCustomers, placeholderData: keepPreviousData } },
  );
  const members = useListLoyaltyMembers(
    { ...memberFilters, limit: more.limit },
    { query: { enabled: source === "members", placeholderData: keepPreviousData } },
  );
  const list = fromCustomers ? customers : members;

  const rows = useMemo<PersonRow[]>(
    () =>
      fromCustomers
        ? (customers.data ?? []).map((c) => rowOfCustomer(c, mode))
        : (members.data?.members ?? []).map(rowOfMember),
    [fromCustomers, customers.data, members.data, mode],
  );
  const total = fromCustomers ? undefined : members.data?.total;

  const columns = useMemo<ColumnDef<PersonRow>[]>(() => {
    const dash = <span className="text-muted-foreground">—</span>;
    const balanceOf = (r: PersonRow) =>
      r.balance === null || !r.mode ? dash : `${fmtNumber(r.balance)} ${currencyLabel(r.mode, r.balance)}`;

    const name: ColumnDef<PersonRow> = {
      id: "name",
      header: t("customers.name", "Name"),
      meta: { phone: "title", label: t("customers.name", "Name") },
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-2" data-testid="customer-row">
          <span dir="auto" className="truncate font-medium">
            {row.original.name}
          </span>
          {/* In the Members tab every row is one; the badge would be noise. */}
          {row.original.isMember && !membersOnly ? (
            <StatusPill tone="accent" size="sm" icon={Star}>
              {t("customers.member", "Member")}
            </StatusPill>
          ) : null}
        </span>
      ),
    };
    const phone: ColumnDef<PersonRow> = {
      id: "phone",
      header: t("customers.phone", "Phone"),
      meta: { label: t("customers.phone", "Phone") },
      cell: ({ row }) =>
        row.original.phone ? (
          <bdi dir="ltr" className="font-mono text-sm whitespace-nowrap">
            {formatPhoneDisplay(row.original.phone)}
          </bdi>
        ) : (
          dash
        ),
    };
    const balance: ColumnDef<PersonRow> = {
      id: "balance",
      header: t("loyalty.balance", "Balance"),
      meta: { label: t("loyalty.balance", "Balance"), numeric: true },
      cell: ({ row }) => balanceOf(row.original),
    };

    if (!fromCustomers) {
      return [
        name,
        phone,
        balance,
        {
          id: "progress",
          header: t("loyalty.progress", "To next reward"),
          meta: { label: t("loyalty.progress", "To next reward") },
          cell: ({ row }) => {
            const m = row.original.member;
            if (!m) return dash;
            return m.can_redeem ? (
              <StatusPill tone="success">{t("loyalty.rewardReady", "Reward earned")}</StatusPill>
            ) : (
              <span className="text-sm text-muted-foreground">
                <bdi className="font-mono tabular-nums">{m.points_to_next_reward}</bdi>{" "}
                {currencyLabel(row.original.mode ?? "points", m.points_to_next_reward)}
              </span>
            );
          },
        },
        {
          id: "joined",
          header: t("loyalty.joined", "Joined"),
          meta: { label: t("loyalty.joined", "Joined"), numeric: true },
          cell: ({ row }) => (row.original.member ? fmtDate(row.original.member.enrolled_at) : dash),
        },
      ];
    }

    return [
      name,
      phone,
      ...(showBalance ? [balance] : []),
      {
        id: "source",
        header: t("customers.source.label", "Came from"),
        meta: { label: t("customers.source.label", "Came from"), phone: "hidden" },
        cell: ({ row }) => {
          const s = row.original.customer?.source;
          return isSource(s) ? <span className="text-sm text-muted-foreground">{t(`customers.source.${s}`)}</span> : dash;
        },
      },
      {
        id: "orders",
        header: t("customers.orders", "Orders"),
        meta: { numeric: true, label: t("customers.orders", "Orders") },
        cell: ({ row }) => fmtNumber(row.original.customer?.orders_count ?? 0),
      },
      {
        id: "spent",
        header: t("customers.totalSpent", "Total spent"),
        meta: { numeric: true, label: t("customers.totalSpent", "Total spent") },
        cell: ({ row }) => fmtMoney(row.original.customer?.total_spent ?? 0),
      },
      {
        id: "lastVisit",
        header: t("customers.lastVisit", "Last visit"),
        meta: { numeric: true, label: t("customers.lastVisit", "Last visit") },
        cell: ({ row }) => (row.original.customer?.last_order_at ? fmtDate(row.original.customer.last_order_at) : dash),
      },
    ];
  }, [t, fromCustomers, membersOnly, showBalance]);

  // The file must not inherit the window on screen: it walks the same endpoint
  // under the same search and filters, from the top.
  const handleExport = async () => {
    setExporting(true);
    try {
      const people = fromCustomers
        ? (
            await fetchAllPages(async (offset, limit) => ({
              rows: await listCustomers({ ...customerFilters, limit, offset }, EXPORT_REQUEST),
            }))
          ).map((c) => rowOfCustomer(c, mode))
        : (
            await fetchAllPages(async (offset, limit) => {
              const res = await listLoyaltyMembers({ ...memberFilters, limit, offset }, EXPORT_REQUEST);
              return { rows: res.members, total: res.total };
            })
          ).map(rowOfMember);

      const yesNo = (v: boolean) => (v ? t("common.yes", "Yes") : t("common.no", "No"));
      const balanceCols: ExcelColumn<PersonRow>[] = [
        { header: t("loyalty.balance", "Balance"), accessor: (r) => r.balance, type: "integer", width: 12 },
        { header: t("loyalty.balanceUnit", "Unit"), accessor: (r) => (r.mode && r.balance !== null ? currencyLabel(r.mode) : ""), type: "text", width: 12 },
      ];
      const cols: ExcelColumn<PersonRow>[] = [
        { header: t("customers.name", "Name"), accessor: (r) => r.name, type: "text", width: 26 },
        { header: t("customers.phone", "Phone"), accessor: (r) => formatPhoneDisplay(r.phone), type: "text", width: 20 },
        ...(fromCustomers
          ? [
              ...(membersOnly ? [] : [{ header: t("customers.member", "Member"), accessor: (r: PersonRow) => yesNo(r.isMember), type: "text" as const, width: 10 }]),
              ...(showBalance ? balanceCols : []),
              {
                header: t("customers.source.label", "Came from"),
                accessor: (r: PersonRow) => (isSource(r.customer?.source) ? t(`customers.source.${r.customer.source}`) : ""),
                type: "text" as const,
                width: 16,
              },
              { header: t("customers.orders", "Orders"), accessor: (r: PersonRow) => r.customer?.orders_count ?? 0, type: "integer" as const, width: 10 },
              { header: t("customers.totalSpent", "Total spent"), accessor: (r: PersonRow) => r.customer?.total_spent ?? 0, type: "money" as const, width: 16 },
              { header: t("customers.lastVisit", "Last visit"), accessor: (r: PersonRow) => r.customer?.last_order_at ?? null, type: "date" as const, width: 16 },
            ]
          : [
              ...balanceCols,
              {
                header: t("loyalty.progress", "To next reward"),
                accessor: (r: PersonRow) =>
                  !r.member
                    ? ""
                    : r.member.can_redeem
                      ? t("loyalty.rewardReady", "Reward earned")
                      : `${r.member.points_to_next_reward} ${currencyLabel(r.mode ?? "points", r.member.points_to_next_reward)}`,
                type: "text" as const,
                width: 20,
              },
              { header: t("loyalty.joined", "Joined"), accessor: (r: PersonRow) => r.member?.enrolled_at ?? null, type: "date" as const, width: 16 },
            ]),
      ];
      const title = membersOnly ? t("loyalty.members", "Members") : t("customers.title", "Customers");
      await exportToExcel({
        filename: membersOnly ? "Madar-Loyalty-Members" : "Madar-Customers",
        logoUrl,
        sheets: [
          {
            name: title,
            title,
            subtitle: q || undefined,
            rows: people as unknown as Record<string, unknown>[],
            columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
          },
        ],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  if (!source) return null;

  const filtered = !!q || onlyMembers || from !== null;
  const noun = membersOnly
    ? {
        none: t("loyalty.noMembers", "No members yet"),
        noneHint: t("loyalty.noMembersHint", "Customers join by scanning the counter code."),
        noMatch: t("loyalty.noMembersMatch", "No members match that search"),
      }
    : {
        none: t("customers.empty", "No customers yet"),
        noneHint: t("customers.emptyHint", "Customers added at the till or here appear in this list."),
        noMatch: t("customers.emptySearch", "No customers match"),
      };

  return (
    <>
      <PeopleList
        layout="above"
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("customers.searchPlaceholder", "Search by name or phone"),
          className: "sm:max-w-xs",
        }}
        filters={
          fromCustomers ? (
            <>
              <Select value={from ?? ALL} onValueChange={(v) => setFrom(isSource(v) ? v : null)}>
                <SelectTrigger className="w-full sm:w-44" aria-label={t("customers.source.label", "Came from")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("customers.source.all", "Any source")}</SelectItem>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`customers.source.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {membersOnly ? null : (
                <div className="flex items-center gap-2">
                  <Switch id={membersSwitchId} checked={onlyMembers} onCheckedChange={setOnlyMembers} />
                  <Label htmlFor={membersSwitchId} className="font-normal">
                    {t("customers.membersOnly", "Members only")}
                  </Label>
                </div>
              )}
            </>
          ) : undefined
        }
        actions={<ExportButton onExport={handleExport} loading={exporting} disabled={rows.length === 0} className="shrink-0" />}
        footer={
          total !== undefined && total > rows.length ? (
            <ListCount>
              {t("loyalty.showingOf", { defaultValue: "Showing {{shown}} of {{total}}", shown: rows.length, total })}
            </ListCount>
          ) : null
        }
        columns={columns}
        data={rows}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => void list.refetch()}
        getRowId={(r) => r.id}
        onRowClick={(r) => onOpenIdChange(r.id)}
        selectedRowId={openId}
        hideViewOptions
        loadMore={more.props(rows.length, list.isFetching)}
        rowActions={
          // Platform only: it reads Madar's plumbing out of Google in Google's
          // own vocabulary. The endpoint refuses everyone else too.
          access.canInspectWallet
            ? (r) =>
                r.isMember ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("loyalty.googleObject", "Google Wallet object")}
                    onClick={() => setInspecting({ id: r.id, name: r.name })}
                  >
                    <Wallet className="size-4" />
                  </Button>
                ) : null
            : undefined
        }
        emptyState={
          <EmptyState
            icon={Users}
            title={filtered ? noun.noMatch : noun.none}
            description={filtered ? t("customers.emptySearchHint", "Try another name or phone number, or clear the filters.") : noun.noneHint}
          />
        }
      />

      <CustomerDetailSheet
        customerId={openId}
        branchId={branchId}
        onOpenChange={(o) => !o && onOpenIdChange(null)}
        onOpenOrder={setOpenOrder}
        onSwitch={onOpenIdChange}
      />
      <OrderDetailSheet
        orderId={openOrder}
        open={!!openOrder}
        onOpenChange={(o) => !o && setOpenOrder(null)}
        onSwitchOrder={setOpenOrder}
      />
      {access.canInspectWallet ? (
        <GoogleObjectDialog
          memberId={inspecting?.id ?? null}
          memberName={inspecting?.name ?? ""}
          onOpenChange={(o) => !o && setInspecting(null)}
        />
      ) : null}
    </>
  );
}
