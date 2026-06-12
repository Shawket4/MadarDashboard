import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowLeftRight, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { Skeleton } from "@/shared/ui/skeleton";
import { useListCatalog, useListBranchStock, useAddToBranchStock, useRemoveFromBranchStock, getListBranchStockQueryKey, getListAdjustmentsQueryKey, updateBranchStock, createAdjustment } from "@/shared/api/generated/api";
import { EditableGrid, type EditableColumn } from "@/shared/ui/editable-grid";
import { runBulk } from "@/shared/lib/bulk-runner";
import { ReceiveDeliveryDialog, DepletionForecastPanel, suggestTransferSource, type TransferSuggestion } from "./stock-tools";
import { addStockSchema, type AddStockValues } from "@/entities/inventory/schemas";
import { CatalogItemDialog } from "@/features/dialogs/catalog-item-dialog";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtUnit } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { BranchInventoryItem, OrgIngredient } from "@/shared/api/generated/models";
import type { Branch } from "@/shared/types";

// ── Stock Tab ────────────────────────────────────────────────────────────────
export function StockTab({
  orgId,
  branchId,
  branches,
  onTransferSuggested,
}: {
  orgId: string;
  branchId: string;
  branches: Branch[];
  onTransferSuggested: (s: TransferSuggestion) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: stock = [], isLoading } = useListBranchStock(branchId, { query: { enabled: !!branchId } });
  const { data: catalog = [] } = useListCatalog(orgId, { query: { enabled: !!orgId } });
  const [addDlg, setAddDlg] = useState(false);
  const [newIngredient, setNewIngredient] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BranchInventoryItem | null>(null);
  const [receiveRows, setReceiveRows] = useState<BranchInventoryItem[] | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [findingSource, setFindingSource] = useState<string | null>(null);

  const form = useForm<AddStockValues>({
    resolver: zodResolver(addStockSchema),
    defaultValues: { org_ingredient_id: "", current_stock: 0, reorder_threshold: 0 },
  });

  const available = catalog.filter((c: OrgIngredient) => c.is_active && !stock.some((s) => s.org_ingredient_id === c.id));
  const lowRows = stock.filter((s) => s.below_reorder);

  const { mutate: createStock, isPending: isAdding } = useAddToBranchStock();
  const { mutate: deleteStock, isPending: isRemoving } = useRemoveFromBranchStock();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListBranchStockQueryKey(branchId) });
    qc.invalidateQueries({ queryKey: getListAdjustmentsQueryKey(branchId) });
  };

  const add = (v: AddStockValues) => {
    createStock(
      { branchId, data: v },
      {
        onSuccess: () => {
          invalidate();
          toast.success(t("inventory.stock.addedToast"));
          setAddDlg(false);
          form.reset();
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const remove = (id: string) => {
    deleteStock(
      { branchId, id },
      {
        onSuccess: () => {
          invalidate();
          toast.success(t("inventory.stock.removedToast"));
          setConfirmDelete(null);
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  // Inline edits commit immediately; the toast offers a one-click undo that
  // PATCHes the previous values back.
  const commitRow = async (item: BranchInventoryItem, patch: Record<string, unknown>) => {
    const prevPatch: Record<string, number> = {};
    for (const k of Object.keys(patch)) prevPatch[k] = (item as unknown as Record<string, number>)[k];
    try {
      await updateBranchStock(branchId, item.id, patch as never);
      invalidate();
      toast.success(t("inventory.stock.savedToast"), {
        action: {
          label: t("common.undo"),
          onClick: () => {
            void updateBranchStock(branchId, item.id, prevPatch as never).then(invalidate);
          },
        },
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // Stock-take import: counted quantities by ingredient name. The difference
  // is journaled as an adjustment so history explains the change.
  const stockTake = async (rows: Record<string, string>[]) => {
    const byName = new Map(stock.map((s) => [s.ingredient_name.trim().toLowerCase(), s]));
    const { ok, failed } = await runBulk(rows, async (r) => {
      const item = byName.get((r.ingredient ?? "").trim().toLowerCase());
      if (!item) throw new Error(r.ingredient);
      const counted = parseFloat(r.counted);
      const diff = counted - item.current_stock;
      await updateBranchStock(branchId, item.id, { current_stock: counted });
      if (Math.abs(diff) > 1e-9) {
        await createAdjustment(branchId, {
          branch_inventory_id: item.id,
          adjustment_type: diff > 0 ? "add" : "remove",
          quantity: Math.abs(diff),
          note: t("inventory.stock.stockTakeNote"),
        });
      }
    });
    invalidate();
    if (failed.length > 0) toast.error(t("inventory.stock.stockTakeFailed", { ok: ok.length, failed: failed.length }));
    else toast.success(t("inventory.stock.stockTakeDone", { count: ok.length }));
  };

  const transferFromAlert = async (item: BranchInventoryItem) => {
    setFindingSource(item.id);
    try {
      const suggestion = await suggestTransferSource(branches, branchId, item);
      if (!suggestion) {
        toast.info(t("inventory.stock.noSurplus", { name: item.ingredient_name }));
        return;
      }
      onTransferSuggested(suggestion);
    } finally {
      setFindingSource(null);
    }
  };

  const gridColumns: EditableColumn<BranchInventoryItem>[] = [
    {
      key: "ingredient_name",
      header: t("recipes.ingredient"),
      editable: false,
      getValue: (s) => s.ingredient_name,
      renderDisplay: (s) => (
        <div className="flex items-center gap-2">
          {s.below_reorder && <AlertTriangle size={14} className="text-warning shrink-0" />}
          <div>
            <p className="font-semibold text-sm">{s.ingredient_name}</p>
            {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      editable: false,
      getValue: (s) => s.unit,
      renderDisplay: (s) => <Badge variant="outline">{fmtUnit(s.unit)}</Badge>,
    },
    {
      key: "current_stock",
      header: t("inventory.stock.currentStock"),
      type: "number",
      getValue: (s) => s.current_stock,
      renderDisplay: (s) => (
        <span className={`tabular font-semibold text-sm ${s.below_reorder ? "text-warning" : ""}`}>
          {Number(s.current_stock).toFixed(3)}
        </span>
      ),
    },
    {
      key: "reorder_threshold",
      header: t("inventory.stock.reorderAt"),
      type: "number",
      getValue: (s) => s.reorder_threshold,
      renderDisplay: (s) => <span className="tabular text-sm">{Number(s.reorder_threshold).toFixed(3)}</span>,
    },
  ];

  const gridExtraColumns: ColumnDef<BranchInventoryItem>[] = [
    {
      id: "status",
      header: t("common.status"),
      cell: ({ row }) => (
        <Badge variant={row.original.below_reorder ? "destructive" : "outline"}>
          {row.original.below_reorder ? t("inventory.stock.low") : t("inventory.stock.ok")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {row.original.below_reorder && branches.length > 1 && (
            <Button
              variant="ghost"
              size="iconSm"
              title={t("inventory.stock.transferFrom")}
              loading={findingSource === row.original.id}
              onClick={() => void transferFromAlert(row.original)}
            >
              <ArrowLeftRight size={13} />
            </Button>
          )}
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setConfirmDelete(row.original)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Branch-Stock",
      sheets: [
        {
          name: "Stock",
          title: t("inventory.stock.title"),
          columns: [
            { key: "name", header: t("recipes.ingredient"), accessor: (s: BranchInventoryItem) => s.ingredient_name, width: 28 },
            { key: "unit", header: "Unit", accessor: (s: BranchInventoryItem) => fmtUnit(s.unit), width: 10 },
            { key: "stock", header: t("inventory.stock.currentStock"), accessor: (s: BranchInventoryItem) => Number(s.current_stock), type: "number", width: 16 },
            { key: "threshold", header: t("inventory.stock.reorderAt"), accessor: (s: BranchInventoryItem) => Number(s.reorder_threshold), type: "number", width: 16 },
            { key: "low", header: t("common.status"), accessor: (s: BranchInventoryItem) => (s.below_reorder ? t("inventory.stock.low") : t("inventory.stock.ok")), width: 12 },
          ],
          rows: stock,
          stats: [
            { label: t("common.total"), value: stock.length, type: "number" },
            { label: t("dashboard.lowStock"), value: stock.filter((s) => s.below_reorder).length, color: "FFD97706", type: "number" },
          ],
        },
      ],
    });

  if (!branchId) return <EmptyState icon={Package} title={t("orders.selectBranch")} />;
  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowForecast((v) => !v)}>
          {showForecast ? t("inventory.stock.hideForecast") : t("inventory.stock.showForecast")}
        </Button>
        {lowRows.length > 0 && (
          <Button size="sm" variant="outline" className="text-warning border-warning/40" onClick={() => setReceiveRows(lowRows)}>
            <AlertTriangle size={13} /> {t("inventory.stock.restockLow", { count: lowRows.length })}
          </Button>
        )}
        <Button size="sm" disabled={available.length === 0} onClick={() => setAddDlg(true)}>
          <Plus /> {available.length === 0 ? t("inventory.stock.allTracked") : t("inventory.stock.addIngredient")}
        </Button>
      </div>

      {showForecast && <DepletionForecastPanel orgId={orgId} stock={stock} />}

      {stock.length === 0 ? (
        <EmptyState icon={Package} title={t("inventory.stock.empty")} description={t("inventory.stock.emptyHint")} />
      ) : (
        <EditableGrid<BranchInventoryItem>
          rows={stock}
          getRowId={(s) => s.id}
          columns={gridColumns}
          extraColumns={gridExtraColumns}
          onCommitRow={commitRow}
          searchKey="ingredient_name"
          onExport={handleExport}
          bulkActions={(selected, clear) => (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => {
                setReceiveRows(selected);
                clear();
              }}
            >
              <Plus size={13} /> {t("inventory.stock.receiveDelivery")}
            </Button>
          )}
          onPasteRows={stockTake}
          pasteColumns={[
            { key: "ingredient", header: t("recipes.ingredient") },
            { key: "counted", header: t("inventory.stock.countedQty") },
          ]}
          pasteValidate={(row) => {
            const known = stock.some((s) => s.ingredient_name.trim().toLowerCase() === (row.ingredient ?? "").trim().toLowerCase());
            if (!known) return t("inventory.stock.unknownIngredient");
            const n = parseFloat(row.counted);
            if (!Number.isFinite(n) || n < 0) return t("inventory.stock.badQty");
            return null;
          }}
        />
      )}

      <Dialog open={addDlg} onOpenChange={setAddDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("inventory.stock.addIngredient")}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(add)}>
              <DialogBody>
                <FormField control={form.control} name="org_ingredient_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recipes.ingredient")}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <SearchableSelect
                          className="flex-1"
                          options={available.map((c: OrgIngredient) => ({ value: c.id, label: c.name, hint: fmtUnit(c.unit) }))}
                          value={field.value || null}
                          onChange={(v) => field.onChange(v ?? "")}
                        />
                      </FormControl>
                      {/* one-step onboarding: create the catalog entry without leaving the flow */}
                      <Button type="button" variant="outline" size="sm" onClick={() => setNewIngredient(true)}>
                        <Plus size={13} />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="current_stock" render={({ field }) => (
                  <FormItem><FormLabel>{t("inventory.stock.openingStock")}</FormLabel><FormControl><Input type="number" step="0.001" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="reorder_threshold" render={({ field }) => (
                  <FormItem><FormLabel>{t("inventory.stock.reorderThreshold")}</FormLabel><FormControl><Input type="number" step="0.001" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDlg(false)}>{t("common.cancel")}</Button>
                <Button type="submit" loading={isAdding}>{t("common.add")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {newIngredient && (
        <CatalogItemDialog open={newIngredient} onClose={() => setNewIngredient(false)} edit={null} orgId={orgId} />
      )}

      {receiveRows && (
        <ReceiveDeliveryDialog
          open={!!receiveRows}
          onClose={() => setReceiveRows(null)}
          rows={receiveRows}
          branchId={branchId}
          onDone={invalidate}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={t("common.confirmDelete", { name: confirmDelete?.ingredient_name ?? "" })}
        destructive
        loading={isRemoving}
        onConfirm={() => confirmDelete && remove(confirmDelete.id)}
      />
    </div>
  );
}

