import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Ban, Coins, Eye, MoreHorizontal, Percent, Receipt, Truck, Ban as VoidIcon } from "lucide-react";

import { Page } from "@/components/app/page";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { DeliveryKpis } from "@/components/app/delivery-kpis";
import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

const ALL = "__all__";

function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="secondary"
      className={cn(
        "capitalize",
        status === "voided" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
      )}
    >
      {t(`orderStatus.${status}`, status)}
    </Badge>
  );
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
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  // Opened order lives in the URL (?order=<id>) so it's shareable / deep-linkable.
  const navigate = useNavigate();
  const detailId = (useSearch({ strict: false }) as { order?: string }).order ?? null;
  const setDetailId = useCallback(
    (id: string | null) => void navigate({ to: ".", replace: true, search: (p: Record<string, unknown>) => ({ ...p, order: id ?? undefined }) }),
    [navigate],
  );
  const [voidOrder, setVoidOrder] = useState<Order | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Reset to first page whenever the scope or filters change.
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [branchId, from, to, status, payment, teller, orderType, channel]);

  const baseParams = {
    branch_id: branchId ?? undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    status: status === ALL ? undefined : status,
    payment_method: payment === ALL ? undefined : payment,
    teller_name: teller || undefined,
    order_type: orderType === ALL ? undefined : orderType,
    // Channel only narrows delivery orders; ignored unless Delivery is picked.
    channel: orderType === "delivery" && channel !== ALL ? channel : undefined,
  };

  const enabled = Boolean(branchId || orgId);
  const { data, isLoading, isFetching } = useListOrders(
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
    { key: "revenue", label: t("dashboard.revenue", "Revenue"), value: summary?.revenue ?? 0, formatType: "money", icon: Coins, accent: "brand", loading: isLoading },
    { key: "completed", label: t("orders.completed", "Completed"), value: summary?.completed ?? 0, formatType: "number", icon: Receipt, accent: "success", loading: isLoading },
    { key: "voided", label: t("dashboard.voided", "Voided"), value: summary?.voided ?? 0, formatType: "number", icon: Ban, accent: "destructive", loading: isLoading },
    { key: "discounts", label: t("orders.discounts", "Discounts"), value: summary?.discounts ?? 0, formatType: "money", icon: Percent, accent: "warning", loading: isLoading },
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
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 font-medium tabular">
            {row.original.order_ref ?? `#${row.original.order_number}`}
            {row.original.order_type === "delivery" ? (
              <Badge variant="secondary" className="gap-1 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                <Truck className="size-3" />
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
        cell: ({ row }) => <span className="text-muted-foreground tabular">{fmtDateTime(row.original.created_at)}</span>,
      },
      { accessorKey: "teller_name", header: t("shifts.teller", "Teller") },
      {
        accessorKey: "status",
        header: t("common.status", "Status"),
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "payment_method",
        header: t("orders.payment", "Payment"),
        cell: ({ row }) => t(`payments.${row.original.payment_method}`, row.original.payment_method),
      },
      {
        accessorKey: "tax_amount",
        header: () => <div className="text-end">{t("orders.tax", "Tax")}</div>,
        cell: ({ row }) => <div className="text-end tabular text-muted-foreground">{fmtMoney(row.original.tax_amount)}</div>,
      },
      {
        accessorKey: "total_amount",
        header: () => <div className="text-end">{t("common.total", "Total")}</div>,
        cell: ({ row }) => <div className="text-end font-medium tabular">{fmtMoney(row.original.total_amount)}</div>,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="text-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => setDetailId(order.id)}>
                    <Eye className="size-4" />
                    {t("common.details", "Details")}
                  </DropdownMenuItem>
                  {order.status === "completed" ? (
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() => setVoidOrder(order)}
                    >
                      <VoidIcon className="size-4" />
                      {t("orders.void", "Void order")}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [t, setDetailId],
  );

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("nav.orders", "Orders")}</h1>
          <p className="text-sm text-muted-foreground">{t("orders.subtitle", "Sales history, voids and exports")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton onExport={() => setExportOpen(true)} disabled={!enabled} />
        </div>
      </div>

      <LedgerStrip items={primaryKpis} />

      {(deliverySales.data?.total_orders ?? 0) > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{t("delivery.kpisTitle", "Delivery")}</h2>
            <span className="text-sm text-muted-foreground">{t("delivery.byChannel", "By channel")}</span>
          </div>
          <DeliveryKpis data={deliverySales.data} loading={deliverySales.isLoading} />
        </section>
      ) : null}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading || (isFetching && !data)}
        onRowClick={(o) => setDetailId(o.id)}
        onRowPrefetch={(o) => void queryClient.prefetchQuery(getGetOrderQueryOptions(o.id))}
        onPrefetchNext={prefetchNext}
        getRowId={(o) => o.id}
        manualPagination
        pageCount={data?.total_pages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        toolbar={
          <>
            <Input
              value={tellerInput}
              onChange={(e) => setTellerInput(e.target.value)}
              placeholder={t("orders.searchTeller", "Search teller…")}
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
          </>
        }
      />

      <OrderDetailSheet
        orderId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
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
