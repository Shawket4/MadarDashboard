import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Boxes, CalendarClock, ChevronRight, ClipboardList, OctagonX, PackageCheck, ShoppingCart, Trash2, Truck, Wallet } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { DataTable } from "@/components/app/data-table";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { StatusPill } from "@/components/app/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import type { LowStockRow } from "@/data/api/generated/models";
import {
  useListBranchStock,
  useListCatalog,
  useListOrgPurchaseOrders,
  useListStocktakes,
  useListSuppliers,
  useListWaste,
  useBranchInventoryValuation,
  useBranchLowStock,
  useOrgInventoryValuation,
  useOrgLowStock,
} from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { useAppStore } from "@/data/stores/app.store";
import { cairoDateISO, cairoNow, fmtDate, fmtNumber, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PurchaseOrderDialog } from "./purchase-order-dialog";
import { ReceiveDialog } from "./receive-dialog";
import { WasteDialog } from "./waste-dialog";
import { countsDue, needsFirstCount } from "./lib";

export function TodayPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId } = useScope();

  const [poBranchId, setPoBranchId] = useState<string | null>(null);
  const [poPrefill, setPoPrefill] = useState<{ supplierId: string | null; lines: { org_ingredient_id: string; quantity_ordered: number }[] } | null>(null);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [wasteOpen, setWasteOpen] = useState(false);

  const tz = useAppStore((st) => st.activeTimezone);
  const { todayStartISO, todayEndISO } = useMemo(() => {
    const now = cairoNow();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    return { todayStartISO: cairoDateISO(y, m, d, false), todayEndISO: cairoDateISO(y, m, d, true) };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cairo* helpers read the active tz
  }, [tz]);

  // Branch-specific when a branch is selected; org-wide roll-up otherwise.
  const branchVal = useBranchInventoryValuation(branchId ?? "", { query: { enabled: !!branchId } });
  const orgVal = useOrgInventoryValuation(orgId ?? "", { query: { enabled: !branchId && !!orgId } });
  const valuation = branchId ? branchVal : orgVal;
  const branchLow = useBranchLowStock(branchId ?? "", { query: { enabled: !!branchId } });
  const orgLow = useOrgLowStock(orgId ?? "", { query: { enabled: !branchId && !!orgId } });
  const lowStock = branchId ? branchLow : orgLow;
  const pos = useListOrgPurchaseOrders(orgId ?? "", { expected_before: todayEndISO }, { query: { enabled: !!orgId } });
  const suppliers = useListSuppliers(orgId ?? "", { query: { enabled: !!orgId } });
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: !!orgId } });
  const branchStock = useListBranchStock(branchId ?? "", { query: { enabled: !!branchId } });
  const stocktakes = useListStocktakes(branchId ?? "", { query: { enabled: !!branchId } });
  const waste = useListWaste(branchId ?? "", undefined, { query: { enabled: !!branchId } });

  const lowRows = useMemo(() => lowStock.data ?? [], [lowStock.data]);
  const criticalCount = useMemo(() => lowRows.filter((r) => r.on_hand <= 0).length, [lowRows]);
  const arriving = useMemo(
    () => (pos.data ?? []).filter((p) => p.status === "ordered" || p.status === "partially_received"),
    [pos.data],
  );
  const todaysWaste = useMemo(() => (waste.data ?? []).filter((m) => m.created_at >= todayStartISO), [waste.data, todayStartISO]);
  const due = useMemo(() => (branchId ? countsDue(branchStock.data ?? []) : null), [branchStock.data, branchId]);
  const firstRun = !!branchId && !stocktakes.isLoading && needsFirstCount(stocktakes.data);

  const openReorderPo = (row: LowStockRow) => {
    setPoBranchId(row.branch_id);
    setPoPrefill({
      supplierId: row.supplier_id ?? null,
      lines: [{ org_ingredient_id: row.org_ingredient_id, quantity_ordered: Math.max(1, Math.ceil(row.suggested_qty)) }],
    });
  };

  const lowColumns = useMemo<ColumnDef<LowStockRow>[]>(() => [
    {
      id: "name",
      header: t("inventory.catalog.name", "Name"),
      meta: { label: t("inventory.catalog.name", "Name"), phone: "title" },
      cell: ({ row: { original: r } }) => (
        <span className="flex items-center gap-2 font-medium">
          {r.ingredient_name}
          {r.on_hand <= 0
            ? <StatusPill tone="danger" size="sm" icon={OctagonX}>{t("inventory.today.statusCritical", "Critical")}</StatusPill>
            : <StatusPill tone="warning" size="sm">{t("inventory.today.statusLow", "Low")}</StatusPill>}
        </span>
      ),
    },
    { id: "branch", header: t("inventory.reports.branchName", "Branch"), meta: { label: t("inventory.reports.branchName", "Branch") }, cell: ({ row }) => row.original.branch_name },
    { id: "onHand", header: t("inventory.today.onHand", "On hand"), meta: { label: t("inventory.today.onHand", "On hand"), numeric: true }, cell: ({ row: { original: r } }) => `${fmtNumber(r.on_hand)} ${fmtUnit(r.unit)}` },
    { id: "par", header: t("inventory.today.reorderPoint", "Reorder point"), meta: { label: t("inventory.today.reorderPoint", "Reorder point"), numeric: true }, cell: ({ row: { original: r } }) => `${fmtNumber(r.par_min)} ${fmtUnit(r.unit)}` },
    { id: "suggested", header: t("inventory.today.suggested", "Order"), meta: { label: t("inventory.today.suggested", "Order"), numeric: true }, cell: ({ row: { original: r } }) => `${fmtNumber(r.suggested_qty)} ${fmtUnit(r.unit)}` },
    { id: "supplier", header: t("inventory.catalog.supplier", "Supplier"), meta: { label: t("inventory.catalog.supplier", "Supplier") }, cell: ({ row }) => row.original.supplier_name ?? <span className="text-muted-foreground">—</span> },
  ], [t]);

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("inventory.today.title", "Today")} />
        <EmptyState icon={Boxes} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={t("inventory.today.title", "Today")}
        description={t("inventory.today.subtitle", "Your morning briefing: alerts, deliveries and counts due")}
      />

      {firstRun ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">{t("inventory.today.firstRunTitle", "Start by counting this branch")}</p>
              <p className="max-w-prose text-sm text-muted-foreground">
                {t("inventory.today.firstRunHint", "Nothing has been counted here yet, so the numbers below are empty. A whole-branch count takes a few minutes and brings stock value, low-stock alerts and usage to life.")}
              </p>
            </div>
            <Link to="/inventory/counts" className={cn(buttonVariants({ size: "lg" }))}>
              <ClipboardList className="size-4" />
              {t("inventory.today.startFirstCount", "Count this branch's stock")}
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <LedgerStrip
        items={[
          {
            key: "value",
            label: t("inventory.today.stockValue", "Stock value"),
            value: valuation.data?.total_value ?? 0,
            formatType: "money",
            icon: Wallet,
            accent: "neutral",
            loading: valuation.isLoading,
            hint: valuation.data ? t("inventory.today.unknownCost", { count: valuation.data.unknown_cost_count, defaultValue: `${valuation.data.unknown_cost_count} unknown cost` }) : undefined,
          },
          {
            key: "low",
            label: t("inventory.today.lowStock", "Low stock"),
            value: lowRows.length,
            icon: AlertTriangle,
            accent: "warning",
            loading: lowStock.isLoading,
            hint: t("inventory.today.critical", { count: criticalCount, defaultValue: `${criticalCount} critical` }),
          },
          {
            key: "deliveries",
            label: t("inventory.today.deliveries", "Deliveries"),
            value: arriving.length,
            icon: Truck,
            accent: "neutral",
            loading: pos.isLoading,
            hint: t("inventory.today.arrivingToday", "arriving today"),
          },
          {
            key: "counts",
            label: t("inventory.today.countsDue", "Counts due"),
            value: due == null ? "—" : due,
            icon: CalendarClock,
            accent: "neutral",
            loading: !!branchId && branchStock.isLoading,
            hint: t("inventory.today.countsOverdue", ">14 days or never"),
          },
        ] satisfies LedgerItem[]}
      />

      {/* Low stock */}
      <section className="space-y-3">
        <SectionHeader
          icon={AlertTriangle}
          title={t("inventory.today.lowStockHeading", "Low stock — reorder soon")}
          count={lowStock.isLoading || lowStock.isError ? undefined : lowRows.length}
          trailing={
            <Link to="/inventory/ingredients" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              {t("inventory.today.viewAll", "View all")}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Link>
          }
        />
        <DataTable
          columns={lowColumns}
          data={lowRows}
          loading={lowStock.isLoading}
          error={lowStock.error}
          onRetry={() => void lowStock.refetch()}
          getRowId={(r) => `${r.branch_id}-${r.org_ingredient_id}`}
          pageSize={12}
          hideViewOptions
          rowActions={(r) => (
            <Button variant="outline" size="sm" onClick={() => openReorderPo(r)}>
              <ShoppingCart className="size-4" /> {t("inventory.today.createPo", "Create PO")}
            </Button>
          )}
          emptyState={
            <EmptyState
              icon={PackageCheck}
              title={firstRun
                ? t("inventory.today.noParsYet", "Low-stock alerts appear once you set a reorder point on an ingredient.")
                : t("inventory.today.allGood", "All good — nothing below its reorder point")}
            />
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Arriving today */}
        <section className="space-y-3">
          <SectionHeader icon={Truck} title={t("inventory.today.arriving", "Arriving today")} />
          {pos.isError ? (
            <ErrorState
              title={t("inventory.today.deliveriesFailed", "Couldn't load deliveries")}
              onRetry={() => void pos.refetch()}
            />
          ) : pos.isLoading ? (
            <ListSkeleton />
          ) : arriving.length === 0 ? (
            <EmptyState className="py-8" title={t("inventory.today.noDeliveries", "No deliveries scheduled today")} />
          ) : (
            <ListCard>
              {arriving.slice(0, 8).map((p) => (
                <ListRow
                  key={p.id}
                  icon={Truck}
                  title={<>{p.reference || <bdi>#{p.id.slice(0, 8)}</bdi>} · {p.supplier_name ?? "—"}</>}
                  meta={<bdi>{fmtDate(p.expected_at)}</bdi>}
                  trailing={
                    <Button variant="outline" size="sm" onClick={() => setReceivePoId(p.id)}>
                      <PackageCheck className="size-4" /> {t("inventory.today.receive", "Receive")}
                    </Button>
                  }
                />
              ))}
            </ListCard>
          )}
        </section>

        {/* Today's waste */}
        <section className="space-y-3">
          <SectionHeader
            icon={Trash2}
            title={t("inventory.today.todaysWaste", "Today's waste")}
            trailing={
              <Button variant="outline" size="sm" onClick={() => setWasteOpen(true)} disabled={!branchId}>
                <Trash2 className="size-4" /> {t("inventory.today.logWaste", "Log waste")}
              </Button>
            }
          />
          {!branchId ? (
            <EmptyState className="py-8" title={t("inventory.pickBranch", "Select a branch to manage its stock")} />
          ) : waste.isError ? (
            <ErrorState
              title={t("inventory.today.wasteFailed", "Couldn't load today's waste")}
              onRetry={() => void waste.refetch()}
            />
          ) : waste.isLoading ? (
            <ListSkeleton />
          ) : todaysWaste.length === 0 ? (
            <EmptyState className="py-8" title={t("inventory.today.noWasteToday", "No waste logged today")} />
          ) : (
            <ListCard>
              {todaysWaste.slice(0, 8).map((m) => (
                <ListRow
                  key={m.id}
                  variant="ledger"
                  sign="out"
                  title={m.ingredient_name}
                  meta={m.reason ? t(`inventory.waste.reasons.${m.reason}`, m.reason) : undefined}
                  value={`${fmtNumber(Math.abs(m.quantity))} ${fmtUnit(m.unit)}`}
                  numericValue
                />
              ))}
            </ListCard>
          )}
        </section>
      </div>

      {poBranchId ? (
        <PurchaseOrderDialog
          branchId={poBranchId}
          open={!!poBranchId}
          onOpenChange={(o) => { if (!o) { setPoBranchId(null); setPoPrefill(null); } }}
          suppliers={suppliers.data ?? []}
          catalog={catalog.data ?? []}
          prefillSupplierId={poPrefill?.supplierId ?? null}
          prefillLines={poPrefill?.lines}
        />
      ) : null}
      <ReceiveDialog poId={receivePoId} open={!!receivePoId} onOpenChange={(o) => !o && setReceivePoId(null)} />
      {branchId ? <WasteDialog branchId={branchId} open={wasteOpen} onOpenChange={setWasteOpen} /> : null}
    </Page>
  );
}

function ListSkeleton() {
  return (
    <ListCard>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5">
          <Skeleton className="size-9 rounded-[10px]" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </ListCard>
  );
}
