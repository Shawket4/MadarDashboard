import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Ban, ChevronLeft, ChevronRight, CreditCard, Receipt, ShoppingBag, X, CircleDollarSign,
} from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { AsyncBoundary } from "@/shared/ui/async-boundary";
import { StatCard } from "@/shared/ui/stat-card";
import { ExportDrawer } from "@/features/orders-export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useListOrders } from "@/shared/api/generated/api";
import { useListBranches as useBranches } from "@/shared/api/generated/api";
import { useScopedParams } from "@/shared/scope/use-scoped-params";
import { useListShifts } from "@/shared/api/generated/api";
import { ORDER_STATUSES } from "@/shared/config/constants";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { fmtDateTime, fmtMoney } from "@/shared/lib/format";
import type { OrdersQuery, OrderStatus } from "@/shared/types";
import type { Order } from "@/shared/api/generated/models/order";

import { VoidDialog } from "./void-dialog";
import { OrderDetailDrawer } from "./detail-drawer";

export default function Orders() {
  const { t } = useTranslation();
  const { orgId } = useCurrentContext();
  const { data: branches = [] } = useBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  // Branch and period come from the global scope bar in the header (B.1)
  const { branchId, from, to } = useScopedParams();
  const selBranch = branchId ?? "";
  const [selShift, setSelShift] = useState<string>("");
  const [payment, setPayment] = useState<string>("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [tellerName, setTellerName] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [detailId, setDetailId] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<Order | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Scope changes restart pagination (and shift filter, which is per-branch)
  useEffect(() => {
    setPage(1);
    setSelShift("");
  }, [selBranch, from, to]);

  const { data: shifts = [] } = useListShifts(selBranch ?? "", { query: { enabled: !!selBranch } });

  const { activeMethods, colorMap, getLabel } = usePaymentMethods();

  const activeShift = shifts.find((s) => s.id === selShift);
  const shiftLabel = activeShift
    ? `${activeShift.teller_name} · ${fmtDateTime(activeShift.opened_at)}`
    : null;

  const query: OrdersQuery = {
    branch_id: selBranch || undefined,
    shift_id: selShift || undefined,
    payment_method: (payment as any) || undefined,
    status: status || undefined,
    teller_name: tellerName || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: perPage,
  };

  const { data, isLoading } = useListOrders(query as any, { query: { enabled: !!selBranch } });
  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

const stats = data?.summary ?? { revenue: 0, completed: 0, voided: 0, discounts: 0, tips: 0 };

  const cols: ColumnDef<Order>[] = [
    {
      accessorKey: "order_number",
      header: "#",
      cell: ({ row }) => <span className="font-mono font-bold text-xs">#{row.original.order_number}</span>,
    },
    { accessorKey: "created_at", header: t("common.date"), cell: ({ row }) => <span className="text-xs">{fmtDateTime(row.original.created_at)}</span> },
    { accessorKey: "teller_name", header: t("dashboard.teller"), cell: ({ row }) => <span className="text-sm">{row.original.teller_name}</span> },
    { accessorKey: "customer_name", header: t("orders.customer"), cell: ({ row }) => <span className="text-sm">{row.original.customer_name ?? "—"}</span> },
    {
      accessorKey: "payment_method",
      header: t("orders.payment"),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: colorMap[row.original.payment_method] || "#ccc" }} />
          <Badge variant="outline" className="text-xs">{getLabel(row.original.payment_method)}</Badge>
        </span>
      ),
    },
    { accessorKey: "total_amount", header: t("common.total"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{fmtMoney(row.original.total_amount)}</span> },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => <Badge variant={row.original.status === "voided" ? "destructive" : "success"}>{t(`orderStatus.${row.original.status}`)}</Badge>,
    },
  ];

  // Removed legacy handleExport; replaced by orders-export drawer feature

  const clearFilters = () => {
    setSelShift("");
    setPayment("");
    setStatus("");
    setTellerName("");
    setPage(1);
  };

  return (
    <PageShell title={t("orders.title")} description={t("orders.subtitle")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label={t("orders.totalRevenue")} value={stats.revenue} formatType="money" loading={isLoading} icon={Receipt} accent="success" />
        <StatCard label={t("orders.completed")} value={stats.completed} loading={isLoading} icon={ShoppingBag} accent="info" />
        <StatCard label={t("orders.voidedOrders")} value={stats.voided} loading={isLoading} icon={Ban} accent="destructive" />
        <StatCard label={t("orders.totalDiscounts")} value={stats.discounts} formatType="money" loading={isLoading} icon={CreditCard} accent="warning" />
        <StatCard label={t("orders.totalTips")} value={stats.tips} formatType="money" loading={isLoading} icon={CircleDollarSign} accent="info" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selShift || "all"} onValueChange={(v) => { setSelShift(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-48"><SelectValue placeholder={t("orders.allShifts")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("orders.allShifts")}</SelectItem>
                {shifts.map((s) => <SelectItem key={s.id} value={s.id}>{s.teller_name} · {fmtDateTime(s.opened_at)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={payment || "all"} onValueChange={(v) => { setPayment(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder={t("orders.allMethods")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("orders.allMethods")}</SelectItem>
                {activeMethods.map((p) => <SelectItem key={p.name} value={p.name}>{getLabel(p.name)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? "" : (v as OrderStatus)); setPage(1); }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t("orders.allStatuses")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("orders.allStatuses")}</SelectItem>
                {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`orderStatus.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            {(selShift || payment || status || tellerName) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}><X size={12} /> {t("common.clearAll")}</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!selBranch ? (
        <EmptyState icon={ShoppingBag} title={t("orders.selectBranch")} />
      ) : (
        <AsyncBoundary
          isLoading={isLoading && orders.length === 0}
          isEmpty={orders.length === 0}
          emptyState={<EmptyState icon={ShoppingBag} title={t("orders.noMatch")} description={t("orders.noMatchHint")} />}
        >
          <DataTable
            columns={cols}
            data={orders}
            disablePagination={true}
            isLoading={isLoading}
            onRowClick={(o) => setDetailId(o.id)}
            onExport={() => setExportOpen(true)}
            rowClassName={(r) => r.original.status === "voided" ? "opacity-60" : undefined}
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              {t("orders.showing", {
                from: (page - 1) * perPage + 1,
                to: Math.min(page * perPage, total),
                total,
              })}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="iconSm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="rtl:rotate-180" /></Button>
              <span className="px-3 text-sm font-medium">{page} / {totalPages}</span>
              <Button variant="outline" size="iconSm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="rtl:rotate-180" /></Button>
            </div>
          </div>
        </AsyncBoundary>
      )}

      <OrderDetailDrawer
        open={!!detailId}
        onClose={() => setDetailId(null)}
        orderId={detailId}
        onVoid={(o) => { setDetailId(null); setVoidTarget(o); }}
      />
      <VoidDialog
        open={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        order={voidTarget}
        key={voidTarget?.id ?? "none"}
      />
      <ExportDrawer
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filters={query}
        branchName={branches.find((b) => b.id === selBranch)?.name ?? ""}
        shiftLabel={shiftLabel}
        totalApprox={total}
      />
    </PageShell>
  );
}

