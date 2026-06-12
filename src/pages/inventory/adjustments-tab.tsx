import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { Skeleton } from "@/shared/ui/skeleton";
import { useListBranchStock, getListBranchStockQueryKey, useListAdjustments, useCreateAdjustment as useCreateAdjustmentMutation, getListAdjustmentsQueryKey } from "@/shared/api/generated/api";
import { adjustmentSchema, type AdjustmentValues } from "@/entities/inventory/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtDateTime, fmtUnit } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { BranchInventoryAdjustment } from "@/shared/api/generated/models";

// ── Adjustments Tab ──────────────────────────────────────────────────────────
export function AdjustmentsTab({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: adjs = [], isLoading } = useListAdjustments(branchId, { query: { enabled: !!branchId } });
  const { data: stock = [] } = useListBranchStock(branchId, { query: { enabled: !!branchId } });
  const [dlg, setDlg] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<BranchInventoryAdjustment | null>(null);

  const form = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { branch_inventory_id: "", adjustment_type: "add", quantity: 0 as any, note: "" },
  });

  const { mutate: createAdjustmentMutate, isPending: isSaving } = useCreateAdjustmentMutation();

  const save = (v: AdjustmentValues) => {
    createAdjustmentMutate(
      { branchId, data: v },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAdjustmentsQueryKey(branchId) });
          qc.invalidateQueries({ queryKey: getListBranchStockQueryKey(branchId) });
          toast.success(t("inventory.adjustments.savedToast"));
          setDlg(false);
          form.reset();
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const { mutate: reverseAdjustment, isPending: isReversing } = useCreateAdjustmentMutation();

  const reverse = (adj: BranchInventoryAdjustment) => {
    reverseAdjustment(
      {
        branchId,
        data: {
          branch_inventory_id: adj.branch_inventory_id,
          adjustment_type: adj.adjustment_type === "add" ? "remove" : "add",
          quantity: Number(adj.quantity),
          note: `Reversal of: ${adj.note}`,
        }
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAdjustmentsQueryKey(branchId) });
          qc.invalidateQueries({ queryKey: getListBranchStockQueryKey(branchId) });
          toast.success(t("inventory.adjustments.reversedToast"));
          setReverseTarget(null);
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const cols: ColumnDef<BranchInventoryAdjustment>[] = [
    {
      accessorKey: "ingredient_name",
      header: t("recipes.ingredient"),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.ingredient_name}</p>
          <p className="text-xs text-muted-foreground">{fmtUnit(row.original.unit)}</p>
        </div>
      ),
    },
    {
      accessorKey: "adjustment_type",
      header: t("common.type"),
      cell: ({ row }) => {
        const variant = row.original.adjustment_type === "add" || row.original.adjustment_type === "transfer_in" ? "success" : "destructive";
        return <Badge variant={variant}>{t(`inventory.adjustments.types.${row.original.adjustment_type}`)}</Badge>;
      },
    },
    { accessorKey: "quantity", header: t("common.qty"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{Number(row.original.quantity).toFixed(3)}</span> },
    { accessorKey: "note", header: t("common.notes"), cell: ({ row }) => <span className="text-sm text-muted-foreground max-w-[180px] truncate block">{row.original.note}</span> },
    { accessorKey: "adjusted_by_name", header: t("common.by") },
    { accessorKey: "created_at", header: t("common.date"), cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDateTime(row.original.created_at)}</span> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const a = row.original;
        if (a.adjustment_type !== "add" && a.adjustment_type !== "remove") return null;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="iconSm" title={t("inventory.adjustments.reverse")} onClick={() => setReverseTarget(a)}>
              <RotateCcw size={13} />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Adjustments",
      sheets: [
        {
          name: "Adjustments",
          title: t("inventory.adjustments.title"),
          columns: [
            { key: "ingredient", header: t("recipes.ingredient"), accessor: (a: BranchInventoryAdjustment) => a.ingredient_name, width: 24 },
            { key: "type", header: t("common.type"), accessor: (a: BranchInventoryAdjustment) => t(`inventory.adjustments.types.${a.adjustment_type}`), width: 16 },
            { key: "qty", header: t("common.qty"), accessor: (a: BranchInventoryAdjustment) => Number(a.quantity), type: "number", width: 12 },
            { key: "note", header: t("common.notes"), accessor: (a: BranchInventoryAdjustment) => a.note, width: 36 },
            { key: "by", header: t("common.by"), accessor: (a: BranchInventoryAdjustment) => a.adjusted_by_name, width: 18 },
            { key: "at", header: t("common.date"), accessor: (a: BranchInventoryAdjustment) => new Date(a.created_at), type: "dateTime", width: 20 },
          ],
          rows: adjs,
        },
      ],
    });

  if (!branchId) return <EmptyState icon={ClipboardList} title={t("orders.selectBranch")} />;
  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDlg(true)}><Plus /> {t("inventory.adjustments.adjustStock")}</Button>
      </div>

      {adjs.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t("inventory.adjustments.empty")} />
      ) : (
        <DataTable columns={cols} data={adjs} searchKey="ingredient_name" onExport={handleExport} />
      )}

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("inventory.adjustments.manualTitle")}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(save)}>
              <DialogBody>
                <FormField control={form.control} name="branch_inventory_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recipes.ingredient")}</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={stock.map((s) => ({ value: s.id, label: s.ingredient_name, hint: `${Number(s.current_stock).toFixed(3)} ${fmtUnit(s.unit)}` }))}
                        value={field.value || null}
                        onChange={(v) => field.onChange(v ?? "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="adjustment_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="add">{t("inventory.adjustments.types.add")}</SelectItem>
                        <SelectItem value="remove">{t("inventory.adjustments.types.remove")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>{t("common.qty")}</FormLabel><FormControl><Input type="number" step="0.001" min="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="note" render={({ field }) => (
                  <FormItem><FormLabel>{t("inventory.adjustments.note")}</FormLabel><FormControl><Input placeholder={t("inventory.adjustments.notePh")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDlg(false)}>{t("common.cancel")}</Button>
                <Button type="submit" loading={isSaving}>{t("common.save")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!reverseTarget}
        onOpenChange={(o) => !o && setReverseTarget(null)}
        title={t("inventory.adjustments.reverseTitle")}
        description={t("inventory.adjustments.reverseConfirm", { note: reverseTarget?.note ?? "" })}
        loading={isReversing}
        onConfirm={() => reverseTarget && reverse(reverseTarget)}
      />
    </div>
  );
}

