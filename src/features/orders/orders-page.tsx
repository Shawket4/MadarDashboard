import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Ban, Coins, Eye, MoreHorizontal, Receipt, Ban as VoidIcon } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { StatCard } from "@/components/app/stat-card";
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
import { getGetOrderQueryOptions, getListOrdersQueryOptions, useListOrders } from "@/data/api/generated/api";
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

  const { branchId, from, to } = useScope();

  const [status, setStatus] = useState<string>(ALL);
  const [payment, setPayment] = useState<string>(ALL);
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
  }, [branchId, from, to, status, payment, teller]);

  const baseParams = {
    branch_id: branchId ?? undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    status: status === ALL ? undefined : status,
    payment_method: payment === ALL ? undefined : payment,
    teller_name: teller || undefined,
  };

  const enabled = Boolean(branchId || orgId);
  const { data, isLoading, isFetching } = useListOrders(
    { ...baseParams, page: pagination.pageIndex + 1, per_page: pagination.pageSize },
    { query: { enabled, placeholderData: keepPreviousData } },
  );

  const summary = data?.summary;

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
        accessorKey: "order_number",
        header: "#",
        cell: ({ row }) => <span className="font-medium tabular">#{row.original.order_number}</span>,
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
      <PageHeader
        title={t("nav.orders", "Orders")}
        description={t("orders.subtitle", "Sales history, voids and exports")}
        actions={<ExportButton onExport={() => setExportOpen(true)} disabled={!enabled} />}
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
        <StatCard label={t("dashboard.revenue", "Revenue")} icon={Coins} accent="brand" value={summary?.revenue ?? 0} formatType="money" loading={isLoading} dense />
        <StatCard label={t("orders.completed", "Completed")} icon={Receipt} accent="success" value={summary?.completed ?? 0} formatType="number" loading={isLoading} dense />
        <StatCard label={t("dashboard.voided", "Voided")} icon={Ban} accent="destructive" value={summary?.voided ?? 0} formatType="number" loading={isLoading} dense />
        <StatCard label={t("orders.discounts", "Discounts")} icon={Coins} accent="warning" value={summary?.discounts ?? 0} formatType="money" loading={isLoading} dense />
      </div>

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
