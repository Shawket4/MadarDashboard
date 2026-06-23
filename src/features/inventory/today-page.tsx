import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, CalendarClock, PackageCheck, ShoppingCart, Trash2, Truck, Wallet } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { LowStockRow } from "@/data/api/generated/models";
import {
  useListBranchStock,
  useListCatalog,
  useListOrgPurchaseOrders,
  useListSuppliers,
  useListWaste,
  useBranchInventoryValuation,
  useBranchLowStock,
  useOrgInventoryValuation,
  useOrgLowStock,
} from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { cairoDateISO, cairoNow, fmtDate, fmtNumber, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PurchaseOrderDialog } from "./purchase-order-dialog";
import { ReceiveDialog } from "./receive-dialog";
import { WasteDialog } from "./waste-dialog";

const DAY_MS = 86_400_000;
const COUNT_DUE_DAYS = 14;

export function TodayPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId } = useScope();

  const [poBranchId, setPoBranchId] = useState<string | null>(null);
  const [poPrefill, setPoPrefill] = useState<{ supplierId: string | null; lines: { org_ingredient_id: string; quantity_ordered: number }[] } | null>(null);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [wasteOpen, setWasteOpen] = useState(false);

  const { todayStartISO, todayEndISO } = useMemo(() => {
    const now = cairoNow();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    return { todayStartISO: cairoDateISO(y, m, d, false), todayEndISO: cairoDateISO(y, m, d, true) };
  }, []);

  // Branch-specific when a branch is selected; org-wide roll-up otherwise.
  // The all-branches case uses the org endpoints (org_id in the path) so it
  // works for super-admins too, whose token carries no org for the branch
  // endpoints to infer.
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
  const waste = useListWaste(branchId ?? "", { query: { enabled: !!branchId } });

  const lowRows = useMemo(() => lowStock.data ?? [], [lowStock.data]);
  const criticalCount = useMemo(() => lowRows.filter((r) => r.current_stock <= 0).length, [lowRows]);

  const arriving = useMemo(
    () => (pos.data ?? []).filter((p) => p.status === "ordered" || p.status === "partially_received"),
    [pos.data],
  );

  const todaysWaste = useMemo(
    () => (waste.data ?? []).filter((m) => m.created_at >= todayStartISO),
    [waste.data, todayStartISO],
  );

  const countsDue = useMemo(() => {
    if (!branchId) return null;
    const now = Date.now();
    return (branchStock.data ?? []).filter(
      (s) => s.last_counted_at == null || now - new Date(s.last_counted_at).getTime() > COUNT_DUE_DAYS * DAY_MS,
    ).length;
  }, [branchStock.data, branchId]);

  const openReorderPo = (row: LowStockRow) => {
    setPoBranchId(row.branch_id);
    setPoPrefill({
      supplierId: row.supplier_id ?? null,
      lines: [{ org_ingredient_id: row.org_ingredient_id, quantity_ordered: Math.max(1, Math.ceil(row.deficit)) }],
    });
  };

  if (!orgId) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.today.title", "Today")}</h1>
        </div>
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

      <LedgerStrip
        items={[
          {
            key: "value",
            label: t("inventory.today.stockValue", "Stock value"),
            value: valuation.data?.total_value ?? 0,
            formatType: "money",
            icon: Wallet,
            accent: "brand",
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
            accent: "info",
            loading: pos.isLoading,
            hint: t("inventory.today.arrivingToday", "arriving today"),
          },
          {
            key: "counts",
            label: t("inventory.today.countsDue", "Counts due"),
            value: countsDue == null ? "—" : countsDue,
            icon: CalendarClock,
            accent: "primary",
            loading: !!branchId && branchStock.isLoading,
            hint: t("inventory.today.countsOverdue", ">14 days or never"),
          },
        ] satisfies LedgerItem[]}
      />

      {/* Low stock */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-warning" /> {t("inventory.today.lowStockHeading", "Low stock — reorder soon")}
          </CardTitle>
          <Link to="/inventory/items" className="text-sm text-primary hover:underline">{t("inventory.today.viewAll", "View all")}</Link>
        </CardHeader>
        <CardContent>
          {lowStock.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : lowRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("inventory.today.allGood", "All good — nothing below its low-stock level 🎉")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.catalog.name", "Name")}</TableHead>
                    <TableHead>{t("inventory.reports.branchName", "Branch")}</TableHead>
                    <TableHead className="text-end">{t("inventory.today.onHand", "On hand")}</TableHead>
                    <TableHead className="text-end">{t("inventory.today.lowStockLevel", "Low-stock level")}</TableHead>
                    <TableHead>{t("inventory.catalog.supplier", "Supplier")}</TableHead>
                    <TableHead className="text-end">{t("inventory.today.reorder", "Reorder")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowRows.slice(0, 12).map((r) => (
                    <TableRow key={`${r.branch_id}-${r.org_ingredient_id}`}>
                      <TableCell className="flex items-center gap-2 font-medium">
                        {r.ingredient_name}
                        <Badge variant="secondary" className={cn(r.current_stock <= 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                          {r.current_stock <= 0 ? t("inventory.today.statusCritical", "Critical") : t("inventory.today.statusLow", "Low")}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.branch_name}</TableCell>
                      <TableCell className="text-end tabular">{fmtNumber(r.current_stock)} {fmtUnit(r.unit)}</TableCell>
                      <TableCell className="text-end tabular">{fmtNumber(r.reorder_threshold)} {fmtUnit(r.unit)}</TableCell>
                      <TableCell>{r.supplier_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-end">
                        <Button variant="outline" size="sm" onClick={() => openReorderPo(r)}>
                          <ShoppingCart className="size-4" /> {t("inventory.today.createPo", "Create PO")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Arriving today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Truck className="size-4" /> {t("inventory.today.arriving", "Arriving today")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pos.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : arriving.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">{t("inventory.today.noDeliveries", "No deliveries scheduled today")}</p>
            ) : (
              arriving.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.reference || `#${p.id.slice(0, 8)}`} · {p.supplier_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground tabular">{fmtDate(p.expected_at)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setReceivePoId(p.id)}>
                    <PackageCheck className="size-4" /> {t("inventory.today.receive", "Receive")}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's waste */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Trash2 className="size-4" /> {t("inventory.today.todaysWaste", "Today's waste")}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setWasteOpen(true)} disabled={!branchId}>
              <Trash2 className="size-4" /> {t("inventory.today.logWaste", "Log waste")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {!branchId ? (
              <p className="py-2 text-sm text-muted-foreground">{t("inventory.pickBranch", "Select a branch to manage its stock")}</p>
            ) : waste.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : todaysWaste.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">{t("inventory.today.noWasteToday", "No waste logged today")}</p>
            ) : (
              todaysWaste.slice(0, 8).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-0">
                  <span className="min-w-0 truncate">
                    {m.ingredient_name}
                    {m.reason ? <span className="text-muted-foreground"> · {t(`inventory.waste.reasons.${m.reason}`, m.reason)}</span> : null}
                  </span>
                  <span className="shrink-0 tabular">{fmtNumber(Math.abs(m.quantity))} {fmtUnit(m.unit)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reorder → PO */}
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
