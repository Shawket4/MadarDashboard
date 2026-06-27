import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Boxes, CheckCircle2, MoreHorizontal, MinusCircle, PackageCheck, PlusCircle, SendHorizonal, Truck, TrendingDown, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PurchaseOrder, ReorderSuggestion, Supplier } from "@/data/api/generated/models";
import {
  cancelPurchaseOrder, deleteSupplier, submitPurchaseOrder,
  useListCatalog, useListPurchaseOrders, useListSuppliers, useReorderSuggestions,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtDate, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { PO_STATUS_STYLES, PO_STATUSES, invalidateInventory } from "./lib";
import { PurchaseOrderDialog, type POPrefillLine } from "./purchase-order-dialog";
import { ReceiveDialog } from "./receive-dialog";
import { SupplierDialog } from "./supplier-dialog";

export function PurchasingPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const orgId = useOrgId();
  const { branchId, scopeBranchId, isAllBranches } = useScope();
  const [tab, setTab] = useState("orders");

  // Orders state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [reorderPrefill, setReorderPrefill] = useState<{ supplierId: string | null; lines: POPrefillLine[] } | null>(null);

  // Suppliers state
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const suppliers = useListSuppliers(orgId ?? "", { query: { enabled: !!orgId } });
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: !!orgId } });
  const orders = useListPurchaseOrders(
    scopeBranchId,
    { status: statusFilter === "all" ? undefined : statusFilter },
    { query: { enabled: !!scopeBranchId } },
  );
  const reorder = useReorderSuggestions(branchId ?? "", { query: { enabled: tab === "reorder" && !!branchId } });

  const onSubmitPo = async (po: PurchaseOrder) => {
    setSubmittingId(po.id);
    try {
      await submitPurchaseOrder(po.id);
      await invalidateInventory();
      toast.success(t("inventory.purchasing.orderPlaced", "Order placed"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmittingId(null);
    }
  };

  const openReorderPo = (suggestion: ReorderSuggestion) => {
    setReorderPrefill({
      supplierId: suggestion.supplier_id ?? null,
      lines: suggestion.lines.map((l) => ({ org_ingredient_id: l.org_ingredient_id, quantity_ordered: l.suggested_qty })),
    });
    setPoDialogOpen(true);
  };

  const onCancelPo = async (po: PurchaseOrder) => {
    if (await confirm({
      title: t("inventory.purchasing.cancel", "Cancel order"),
      description: t("inventory.purchasing.cancelConfirm", "Cancel this purchase order?"),
      destructive: true,
      confirmLabel: t("inventory.purchasing.cancel", "Cancel order"),
    })) {
      try {
        await cancelPurchaseOrder(po.id);
        await invalidateInventory();
        toast.success(t("common.done", "Done"));
      } catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const onDeleteSupplier = async (s: Supplier) => {
    if (await confirm({
      title: t("common.delete", "Delete"),
      description: t("inventory.purchasing.deleteSupplierConfirm", { name: s.name, defaultValue: `Delete supplier "${s.name}"?` }),
      destructive: true,
      confirmLabel: t("common.delete", "Delete"),
    })) {
      try {
        await deleteSupplier(s.id);
        await invalidateInventory();
        toast.success(t("common.done", "Done"));
      } catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const orderColumns = useMemo<ColumnDef<PurchaseOrder>[]>(() => [
    {
      accessorKey: "reference",
      header: t("inventory.purchasing.reference", "Reference"),
      cell: ({ row }) => row.original.reference || `#${row.original.id.slice(0, 8)}`,
    },
    ...(isAllBranches
      ? ([{
          accessorKey: "branch_name",
          header: t("inventory.purchasing.branch", "Branch"),
          cell: ({ row }) => <span>{row.original.branch_name ?? "—"}</span>,
        }] as ColumnDef<PurchaseOrder>[])
      : []),
    {
      accessorKey: "supplier_name",
      header: t("inventory.purchasing.supplier", "Supplier"),
      cell: ({ row }) => row.original.supplier_name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "status",
      header: t("inventory.purchasing.status", "Status"),
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn(PO_STATUS_STYLES[row.original.status] ?? "")}>
          {t(`inventory.purchasing.statuses.${row.original.status}`, row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "expected_at",
      header: t("inventory.purchasing.expectedAt", "Expected"),
      cell: ({ row }) => <span className="tabular">{fmtDate(row.original.expected_at)}</span>,
    },
    {
      accessorKey: "created_at",
      header: t("inventory.purchasing.createdAt", "Created"),
      cell: ({ row }) => <span className="tabular">{fmtDate(row.original.created_at)}</span>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const po = row.original;
        const canSubmit = po.status === "draft";
        const canReceive = po.status === "ordered" || po.status === "partially_received" || po.status === "draft";
        // Partially-received POs cannot be cancelled (backend 409) — must reverse first.
        const canCancel = po.status === "draft" || po.status === "ordered";
        return (
          <div className="flex items-center justify-end gap-1">
            {canSubmit ? (
              <Button
                variant="outline" size="sm"
                loading={submittingId === po.id}
                onClick={(e) => { e.stopPropagation(); void onSubmitPo(po); }}
              >
                <SendHorizonal className="size-4" />
                {t("inventory.purchasing.placeOrder", "Place order")}
              </Button>
            ) : null}
            {canReceive ? (
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setReceivePoId(po.id); }}>
                <PackageCheck className="size-4" />
                {po.status === "partially_received" ? t("inventory.purchasing.receiveRemaining", "Receive remaining") : t("inventory.purchasing.receive", "Receive")}
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setReceivePoId(po.id)}>{t("inventory.purchasing.viewOrder", "View order")}</DropdownMenuItem>
                {canCancel ? (
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => void onCancelPo(po)}>
                    <XCircle className="size-4" />
                    {t("inventory.purchasing.cancel", "Cancel order")}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, isAllBranches]);

  const supplierColumns = useMemo<ColumnDef<Supplier>[]>(() => [
    { accessorKey: "name", header: t("inventory.purchasing.supplier", "Supplier") },
    {
      accessorKey: "contact_name",
      header: t("inventory.purchasing.contactName", "Contact name"),
      cell: ({ row }) => row.original.contact_name ?? "—",
    },
    {
      accessorKey: "email",
      header: t("inventory.purchasing.email", "Email"),
      cell: ({ row }) => row.original.email ?? "—",
    },
    {
      accessorKey: "phone",
      header: t("inventory.purchasing.phone", "Phone"),
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "is_active",
      header: t("common.status", "Status"),
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn("flex items-center gap-1", row.original.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
          {row.original.is_active
            ? <><CheckCircle2 className="size-3" />{t("common.active", "Active")}</>
            : <><MinusCircle className="size-3" />{t("common.inactive", "Inactive")}</>}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="text-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => { setEditSupplier(row.original); setSupplierDialogOpen(true); }}>{t("common.edit", "Edit")}</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => void onDeleteSupplier(row.original)}>{t("common.delete", "Delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  const handleExport = () => {
    if (tab === "orders") {
      const cols: ExcelColumn<PurchaseOrder>[] = [
        { header: t("inventory.purchasing.reference", "Reference"), accessor: (po) => po.reference || `#${po.id.slice(0, 8)}`, type: "text", width: 20 },
        { header: t("inventory.purchasing.supplier", "Supplier"), accessor: (po) => po.supplier_name ?? "—", type: "text", width: 22 },
        { header: t("inventory.purchasing.status", "Status"), accessor: (po) => t(`inventory.purchasing.statuses.${po.status}`, po.status), type: "text", width: 16 },
        { header: t("inventory.purchasing.expectedAt", "Expected"), accessor: (po) => po.expected_at ?? "", type: "date", width: 16 },
        { header: t("inventory.purchasing.createdAt", "Created"), accessor: (po) => po.created_at, type: "date", width: 16 },
      ];
      void exportToExcel({ filename: "Madar-PurchaseOrders", sheets: [{ name: t("inventory.purchasing.orders", "Purchase orders"), title: t("inventory.purchasing.orders", "Purchase orders"), rows: (orders.data ?? []) as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } else {
      const cols: ExcelColumn<Supplier>[] = [
        { header: t("inventory.purchasing.supplier", "Supplier"), accessor: (s) => s.name, type: "text", width: 26 },
        { header: t("inventory.purchasing.contactName", "Contact name"), accessor: (s) => s.contact_name ?? "—", type: "text", width: 22 },
        { header: t("inventory.purchasing.email", "Email"), accessor: (s) => s.email ?? "—", type: "text", width: 26 },
        { header: t("inventory.purchasing.phone", "Phone"), accessor: (s) => s.phone ?? "—", type: "text", width: 18 },
        { header: t("common.status", "Status"), accessor: (s) => (s.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
      ];
      void exportToExcel({ filename: "Madar-Suppliers", sheets: [{ name: t("inventory.purchasing.suppliers", "Suppliers"), title: t("inventory.purchasing.suppliers", "Suppliers"), rows: (suppliers.data ?? []) as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    }
  };

  if (!orgId) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.purchasing.title", "Purchasing")}</h1>
        </div>
        <EmptyState icon={Boxes} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.purchasing.title", "Purchasing")}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton onExport={handleExport} disabled={tab === "orders" ? !(orders.data?.length) : !(suppliers.data?.length)} />
          {tab === "orders" ? (
            <Button onClick={() => setPoDialogOpen(true)} disabled={!branchId}>
              <PlusCircle className="size-4" />
              {t("inventory.purchasing.newOrder", "New purchase order")}
            </Button>
          ) : (
            <Button onClick={() => { setEditSupplier(null); setSupplierDialogOpen(true); }}>
              <PlusCircle className="size-4" />
              {t("inventory.purchasing.newSupplier", "New supplier")}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <PageTabsList>
          <PageTabsTrigger value="orders"><Truck className="size-4" /> {t("inventory.purchasing.orders", "Purchase orders")}</PageTabsTrigger>
          <PageTabsTrigger value="suppliers"><Users className="size-4" /> {t("inventory.purchasing.suppliers", "Suppliers")}</PageTabsTrigger>
          <PageTabsTrigger value="reorder" disabled={!branchId}><TrendingDown className="size-4" /> {t("inventory.purchasing.reorder", "Reorder")}</PageTabsTrigger>
        </PageTabsList>

        <TabsContent value="orders">
          <DataTable
            columns={orderColumns}
            data={orders.data ?? []}
            loading={orders.isLoading}
            getRowId={(po) => po.id}
            onRowClick={(po) => setReceivePoId(po.id)}
            toolbar={
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("inventory.purchasing.allStatuses", "All statuses")}</SelectItem>
                  {PO_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`inventory.purchasing.statuses.${s}`, s)}</SelectItem>)}
                </SelectContent>
              </Select>
            }
            emptyState={<EmptyState icon={Truck} title={t("inventory.purchasing.noOrders", "No purchase orders yet")} />}
          />
        </TabsContent>

        <TabsContent value="suppliers">
          <DataTable
            columns={supplierColumns}
            data={suppliers.data ?? []}
            loading={suppliers.isLoading}
            getRowId={(s) => s.id}
            searchPlaceholder={t("common.search", "Search")}
            emptyState={<EmptyState icon={Users} title={t("inventory.purchasing.noSuppliers", "No suppliers yet")} />}
          />
        </TabsContent>

        <TabsContent value="reorder">
          {reorder.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : (reorder.data ?? []).length === 0 ? (
            <EmptyState icon={TrendingDown} title={t("inventory.purchasing.noReorder", "No items to reorder")} description={t("inventory.purchasing.noReorderHint", "All stocked items are above their reorder point.")} />
          ) : (
            <div className="space-y-4">
              {(reorder.data ?? []).map((suggestion) => {
                const key = suggestion.supplier_id ?? "none";
                return (
                  <div key={key} className="rounded-lg border">
                    <div className="flex items-center justify-between border-b p-3">
                      <p className="font-medium">{suggestion.supplier_name ?? t("inventory.purchasing.noSupplier", "No supplier")}</p>
                      <Button size="sm" onClick={() => openReorderPo(suggestion)}>
                        <PlusCircle className="size-4" />
                        {t("inventory.purchasing.createDraftPo", "Create draft PO")}
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("inventory.catalog.name", "Ingredient")}</TableHead>
                          <TableHead className="text-end">{t("inventory.catalog.onHand", "On hand")}</TableHead>
                          <TableHead className="text-end">{t("inventory.purchasing.suggested", "Suggested qty")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestion.lines.map((l) => (
                          <TableRow key={l.org_ingredient_id}>
                            <TableCell>{l.ingredient_name}</TableCell>
                            <TableCell className="text-end tabular text-destructive">{fmtNumber(l.current_stock)} {fmtUnit(l.unit)}</TableCell>
                            <TableCell className="text-end tabular font-medium">{fmtNumber(l.suggested_qty)} {fmtUnit(l.unit)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {branchId ? (
        <PurchaseOrderDialog
          branchId={branchId}
          open={poDialogOpen}
          onOpenChange={(o) => { setPoDialogOpen(o); if (!o) setReorderPrefill(null); }}
          suppliers={suppliers.data ?? []}
          catalog={catalog.data ?? []}
          prefillSupplierId={reorderPrefill?.supplierId}
          prefillLines={reorderPrefill?.lines}
        />
      ) : null}
      <ReceiveDialog poId={receivePoId} open={!!receivePoId} onOpenChange={(o) => !o && setReceivePoId(null)} />
      <SupplierDialog orgId={orgId} open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen} supplier={editSupplier} />
    </Page>
  );
}
