import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Ban, Bike, Coins, Eye, MoreHorizontal, Percent, Receipt, ShoppingBasket, Store, TriangleAlert, Ban as VoidIcon } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { SectionHeader } from "@/components/app/section-header";
import { StatusPill, toneFor } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { ExcludeItemsControl, excludeItemsParam, useExcludedItems } from "@/components/app/exclude-items-control";
import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportButton } from "@/components/app/export-button";
import { DeliveryChannels } from "./delivery-channels";
import { OrderDetailSheet } from "./order-detail-sheet";
import { VoidOrderDialog } from "./void-order-dialog";
import { OrderExportDialog } from "./order-export-dialog";
import { getGetOrderQueryOptions, getListOrdersQueryOptions, useBranchDeliverySales, useListOrders } from "@/data/api/generated/api";
import { queryClient } from "@/data/api/query";
import type { Order } from "@/data/api/generated/models";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { useDebounced } from "@/lib/use-debounced";

const ALL = "__all__";

/**
 * This sale was rung against a catalogue that has since moved.
 *
 * It can only happen OFFLINE. A live sale is priced by the server and the till
 * has no way to name a price of its own — so the badge always means the same
 * thing: that till was out of touch when a price changed, and it took the
 * money at the number on its screen. Recorded rather than rejected, because it
 * already happened; shown here because recording it and never surfacing it is
 * the same as not recording it.
 *
 * The tooltip carries the size of the drift, which is the next question.
 */
function PriceFlagBadge({ order }: { order: Order }) {
  const { t } = useTranslation();
  const expected = order.price_expected_total;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <StatusPill tone="warning" size="sm" icon={TriangleAlert}>
            {t("orders.offlinePrice", "Offline price")}
          </StatusPill>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {t(
          "orders.offlinePriceHint",
          "Rung offline against an older menu — the price differs from the menu today.",
        )}
        {expected != null && expected !== order.total_amount ? (
          <span className="ms-1 tabular">
            {t("orders.offlinePriceExpected", "Menu today: {{amount}}", {
              amount: fmtMoney(expected),
            })}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return <StatusPill tone={toneFor(status, "success")}>{t(`orderStatus.${status}`, status)}</StatusPill>;
}

export function OrdersPage() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const userOrgId = useAuthStore((s) => s.user?.org_id);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const orgId = role === "super_admin" ? selectedOrgId : (userOrgId ?? null);

  const { branchId, scopeBranchId, from, to } = useScope();

  const [status, setStatus] = useState<string>(ALL);
  const [payment, setPayment] = useState<string>(ALL);
  const [orderType, setOrderType] = useState<string>(ALL);
  const [channel, setChannel] = useState<string>(ALL);
  const [tellerInput, setTellerInput] = useState("");
  const teller = useDebounced(tellerInput, 350);
  const [waiterInput, setWaiterInput] = useState("");
  const waiter = useDebounced(waiterInput, 350);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  // Opened order lives in the URL (?order=<id>) so it's shareable / deep-linkable.
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { order?: string; till?: string };
  const detailId = search.order ?? null;
  const tillId = search.till;
  const setDetailId = useCallback(
    (id: string | null) => void navigate({ to: ".", replace: true, search: (p: Record<string, unknown>) => ({ ...p, order: id ?? undefined }) }),
    [navigate],
  );
  const [voidOrder, setVoidOrder] = useState<Order | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Reset to first page whenever the scope or filters change.
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [branchId, from, to, status, payment, teller, waiter, orderType, channel]);

  // Excluded from the Items Sold KPI only (server ignores it everywhere else).
  const [excludedItems, setExcludedItems] = useExcludedItems();

  const baseParams = {
    branch_id: branchId ?? undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    status: status === ALL ? undefined : status,
    payment_method: payment === ALL ? undefined : payment,
    teller_name: teller || undefined,
    waiter_name: waiter || undefined,
    order_type: orderType === ALL ? undefined : orderType,
    // Channel only narrows delivery orders; ignored unless Delivery is picked.
    channel: orderType === "delivery" && channel !== ALL ? channel : undefined,
    exclude_items: excludeItemsParam(excludedItems),
    till_id: tillId,
  };

  const enabled = Boolean(branchId || orgId);
  const { data, isLoading, isFetching, error, refetch } = useListOrders(
    { ...baseParams, page: pagination.pageIndex + 1, per_page: pagination.pageSize },
    { query: { enabled, placeholderData: keepPreviousData } },
  );

  const summary = data?.summary;
  // Delivery + per-channel KPIs come from the SAME source the dashboard uses
  // (the delivery_orders aggregate), so the counts always agree across screens.
  const deliverySales = useBranchDeliverySales(
    scopeBranchId,
    { from: from ?? undefined, to: to ?? undefined },
    { query: { enabled } },
  );

  const primaryKpis: LedgerItem[] = [
    { key: "revenue", label: t("dashboard.revenue", "Revenue"), value: summary?.revenue ?? 0, formatType: "money", icon: Coins, loading: isLoading },
    { key: "completed", label: t("orders.completed", "Completed"), value: summary?.completed ?? 0, formatType: "number", icon: Receipt, loading: isLoading },
    {
      key: "line_items",
      label: t("orders.itemsSold", "Items Sold"),
      value: summary?.line_items ?? 0,
      formatType: "number",
      icon: ShoppingBasket,
      loading: isLoading,
      hint: excludedItems.length ? t("analytics.nExcluded", "{{count}} item excluded", { count: excludedItems.length }) : undefined,
      action: <ExcludeItemsControl excluded={excludedItems} onChange={setExcludedItems} />,
    },
    { key: "voided", label: t("dashboard.voided", "Voided"), value: summary?.voided ?? 0, formatType: "number", icon: Ban, accent: (summary?.voided ?? 0) > 0 ? "destructive" : "neutral", loading: isLoading },
    { key: "discounts", label: t("orders.discounts", "Discounts"), value: summary?.discounts ?? 0, formatType: "money", icon: Percent, loading: isLoading },
  ];

  // Predictive prefetch: the next page loads before the user clicks Next.
  const prefetchNext = () => {
    if (data && pagination.pageIndex + 1 < (data.total_pages ?? 0)) {
      void queryClient.prefetchQuery(
        getListOrdersQueryOptions({ ...baseParams, page: pagination.pageIndex + 2, per_page: pagination.pageSize }),
      );
    }
  };
  useEffect(() => {
    prefetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pagination.pageIndex]);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "order_ref",
        header: "#",
        meta: { label: t("orders.orderNumber", "Order #"), numeric: true, align: "start", phone: "title" },
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span className="font-medium">{row.original.order_ref ?? `#${row.original.display_number ?? row.original.order_number}`}</span>
            {row.original.order_type === "delivery" ? (
              <Badge variant="secondary" className="gap-1 px-1.5 py-0 font-sans text-xs font-medium text-muted-foreground">
                {row.original.delivery_channel === "in_mall" ? <Store aria-hidden className="size-3" /> : <Bike aria-hidden className="size-3" />}
                {row.original.delivery_channel === "in_mall"
                  ? t("delivery.channelInMall", "In-mall")
                  : t("orders.deliveryOutside", "Outside")}
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: t("common.date", "Date"),
        meta: { label: t("common.date", "Date"), numeric: true, align: "start" },
        cell: ({ row }) => <span className="text-muted-foreground">{fmtDateTime(row.original.created_at)}</span>,
      },
      { accessorKey: "teller_name", header: t("tills.teller", "Teller"), meta: { label: t("tills.teller", "Teller") } },
      {
        accessorKey: "waiter_name",
        header: t("tills.waiter", "Waiter"),
        meta: { label: t("tills.waiter", "Waiter") },
        cell: ({ row }) => row.original.waiter_name || "—",
      },
      {
        accessorKey: "status",
        header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <OrderStatusBadge status={row.original.status} />
            {row.original.price_flagged ? <PriceFlagBadge order={row.original} /> : null}
          </span>
        ),
      },
      {
        accessorKey: "payment_method",
        header: t("orders.payment", "Payment"),
        meta: { label: t("orders.payment", "Payment") },
        // A split sale's nominal method is the literal "mixed", which appears in
        // no money report — those bucket by the legs actually tendered. Show the
        // legs so this column reconciles with the sales/shift payment breakdown.
        cell: ({ row }) => {
          const legs = row.original.payment_legs ?? [];
          if (legs.length <= 1) {
            return t(`payments.${row.original.payment_method}`, row.original.payment_method);
          }
          return (
            <span className="inline-flex flex-wrap items-center gap-1">
              {legs.map((leg, i) => (
                <span key={`${leg.method}-${i}`} className="text-xs">
                  {t(`payments.${leg.method}`, leg.method)}
                  <bdi className="ms-1 font-mono tabular-nums text-muted-foreground">{fmtMoney(leg.amount)}</bdi>
                </span>
              ))}
            </span>
          );
        },
      },
      {
        accessorKey: "tax_amount",
        header: t("orders.tax", "Tax"),
        meta: { label: t("orders.tax", "Tax"), numeric: true },
        cell: ({ row }) => <span className="text-muted-foreground">{fmtMoney(row.original.tax_amount)}</span>,
      },
      {
        accessorKey: "total_amount",
        header: t("common.total", "Total"),
        meta: { label: t("common.total", "Total"), numeric: true },
        cell: ({ row }) => <span className="font-semibold">{fmtMoney(row.original.total_amount)}</span>,
      },
    ],
    [t],
  );

  return (
    <Page>
      <PageHeader
        title={t("nav.orders", "Orders")}
        subtitle={t("orders.subtitle", "Sales history, voids and exports")}
        actions={<ExportButton onExport={() => setExportOpen(true)} disabled={!enabled} />}
        below={<div className="flex flex-wrap items-center gap-2">
            <Input
              value={tellerInput}
              onChange={(e) => setTellerInput(e.target.value)}
              placeholder={t("orders.searchTeller", "Search teller…")}
              className="h-9 w-full sm:w-48"
            />
            <Input
              value={waiterInput}
              onChange={(e) => setWaiterInput(e.target.value)}
              placeholder={t("orders.searchWaiter", "Search waiter…")}
              className="h-9 w-full sm:w-48"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-auto min-w-28">
                <SelectValue placeholder={t("common.status", "Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("orders.allStatuses", "All statuses")}</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {t(`orderStatus.${s}`, s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="h-9 w-auto min-w-32">
                <SelectValue placeholder={t("orders.payment", "Payment")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("orders.allPayments", "All payments")}</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`payments.${m}`, m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={orderType}
              onValueChange={(v) => {
                setOrderType(v);
                if (v !== "delivery") setChannel(ALL);
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-28">
                <SelectValue placeholder={t("orders.type", "Type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("orders.allTypes", "All types")}</SelectItem>
                <SelectItem value="dine_in">{t("orders.dineIn", "Dine-in")}</SelectItem>
                <SelectItem value="delivery">{t("orders.delivery", "Delivery")}</SelectItem>
              </SelectContent>
            </Select>
            {orderType === "delivery" ? (
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-9 w-auto min-w-28">
                  <SelectValue placeholder={t("orders.channel", "Channel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("orders.allChannels", "All channels")}</SelectItem>
                  <SelectItem value="in_mall">{t("delivery.channelInMall", "In-mall")}</SelectItem>
                  <SelectItem value="outside">{t("orders.deliveryOutside", "Outside")}</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
</div>}
      />

      <LedgerStrip items={primaryKpis} />

      {(deliverySales.data?.total_orders ?? 0) > 0 ? (
        <section className="space-y-3">
          <SectionHeader title={t("delivery.kpisTitle", "Delivery")} description={t("delivery.byChannel", "By channel")} />
          <DeliveryChannels data={deliverySales.data} loading={deliverySales.isLoading} />
        </section>
      ) : null}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading || (isFetching && !data)}
        error={error}
        onRetry={() => void refetch()}
        selectedRowId={detailId}
        emptyState={
          <EmptyState
            icon={Receipt}
            title={t("orders.emptyTitle", "No orders in this range")}
            description={t("orders.emptyBody", "Sales rung on the POS for this branch and period appear here.")}
          />
        }
        rowActions={(order) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t("common.actions", "Actions")}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailId(order.id)}>
                <Eye className="size-4" />
                {t("common.details", "Details")}
              </DropdownMenuItem>
              {order.status === "completed" ? (
                <DropdownMenuItem variant="destructive" onClick={() => setVoidOrder(order)}>
                  <VoidIcon className="size-4" />
                  {t("orders.void", "Void order")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        onRowClick={(o) => setDetailId(o.id)}
        onRowPrefetch={(o) => void queryClient.prefetchQuery(getGetOrderQueryOptions(o.id))}
        onPrefetchNext={prefetchNext}
        getRowId={(o) => o.id}
        manualPagination
        pageCount={data?.total_pages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
      />

      <OrderDetailSheet
        orderId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        onSwitchOrder={setDetailId}
        onVoid={(o) => {
          setDetailId(null);
          setVoidOrder(o);
        }}
      />
      <VoidOrderDialog order={voidOrder} open={!!voidOrder} onOpenChange={(o) => !o && setVoidOrder(null)} />
      <OrderExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        filters={baseParams}
        totalApprox={data?.total ?? 0}
      />
    </Page>
  );
}
