import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight, Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
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
import { useListCatalog, getListBranchStockQueryKey, useListTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer, getListTransfersQueryKey, useListBranches as useBranches } from "@/shared/api/generated/api";
import { type TransferSuggestion } from "./stock-tools";
import { transferSchema, type TransferValues } from "@/entities/inventory/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtDateTime, fmtUnit } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { BranchInventoryTransfer, OrgIngredient } from "@/shared/api/generated/models";

// ── Transfers Tab ────────────────────────────────────────────────────────────
export function TransfersTab({
  orgId,
  branchId,
  prefill,
  onPrefillConsumed,
}: {
  orgId: string;
  branchId: string;
  prefill?: TransferSuggestion | null;
  onPrefillConsumed?: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [direction, setDirection] = useState<"all" | "incoming" | "outgoing">("all");
  const { data: transfers = [], isLoading } = useListTransfers(branchId, direction === "all" ? undefined : { direction }, { query: { enabled: !!branchId } });
  const { data: catalog = [] } = useListCatalog(orgId, { query: { enabled: !!orgId } });
  const { data: branches = [] } = useBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const [newDlg, setNewDlg] = useState(false);
  const [editNote, setEditNote] = useState<BranchInventoryTransfer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BranchInventoryTransfer | null>(null);
  const [noteVal, setNoteVal] = useState("");

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { source_branch_id: branchId, destination_branch_id: "", org_ingredient_id: "", quantity: 0 as any, note: "" },
  });

  useMemo(() => form.setValue("source_branch_id", branchId), [branchId, form]);

  // Apply the "transfer from surplus branch" suggestion and open the dialog
  useEffect(() => {
    if (!prefill) return;
    form.reset({
      source_branch_id: prefill.source_branch_id,
      destination_branch_id: branchId,
      org_ingredient_id: prefill.org_ingredient_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quantity: prefill.quantity as any,
      note: t("inventory.stock.transferFromNote", { branch: prefill.source_branch_name }),
    });
    setNewDlg(true);
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const { mutate: createTransfer, isPending: isCreating } = useCreateTransfer();

  const create = (v: TransferValues) => {
    createTransfer(
      {
        data: {
          source_branch_id: v.source_branch_id,
          destination_branch_id: v.destination_branch_id,
          org_ingredient_id: v.org_ingredient_id,
          quantity: v.quantity,
          note: v.note || undefined,
        }
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTransfersQueryKey(branchId) });
          qc.invalidateQueries({ queryKey: getListBranchStockQueryKey(branchId) });
          toast.success(t("inventory.transfers.transferredToast"));
          setNewDlg(false);
          form.reset();
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const { mutate: updateTransferMutate, isPending: isUpdating } = useUpdateTransfer();

  const updateNote = () => {
    updateTransferMutate(
      { id: editNote!.id, data: { note: noteVal || null } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTransfersQueryKey(branchId) });
          toast.success(t("inventory.transfers.noteUpdatedToast"));
          setEditNote(null);
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const { mutate: deleteTransfer, isPending: isRemoving } = useDeleteTransfer();

  const remove = (id: string) => {
    deleteTransfer(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTransfersQueryKey(branchId) });
          qc.invalidateQueries({ queryKey: getListBranchStockQueryKey(branchId) });
          toast.success(t("inventory.transfers.reversedToast"));
          setConfirmDelete(null);
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const cols: ColumnDef<BranchInventoryTransfer>[] = [
    {
      accessorKey: "ingredient_name",
      header: t("recipes.ingredient"),
      cell: ({ row }) => (
        <div><p className="font-semibold text-sm">{row.original.ingredient_name}</p><p className="text-xs text-muted-foreground">{fmtUnit(row.original.unit)}</p></div>
      ),
    },
    {
      accessorKey: "source_branch_name",
      header: t("inventory.transfers.fromBranch"),
      cell: ({ row }) => <span className={row.original.source_branch_id === branchId ? "font-semibold text-sm" : "text-muted-foreground text-sm"}>{row.original.source_branch_name}</span>,
    },
    {
      accessorKey: "destination_branch_name",
      header: t("inventory.transfers.toBranch"),
      cell: ({ row }) => <span className={row.original.destination_branch_id === branchId ? "font-semibold text-sm" : "text-muted-foreground text-sm"}>{row.original.destination_branch_name}</span>,
    },
    { accessorKey: "quantity", header: t("common.qty"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{Number(row.original.quantity).toFixed(3)}</span> },
    { accessorKey: "note", header: t("common.notes"), cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.note ?? "—"}</span> },
    { accessorKey: "initiated_by_name", header: t("common.by") },
    { accessorKey: "initiated_at", header: t("common.date"), cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDateTime(row.original.initiated_at)}</span> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="iconSm" onClick={() => { setEditNote(row.original); setNoteVal(row.original.note ?? ""); }}>
            <Edit2 size={13} />
          </Button>
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setConfirmDelete(row.original)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Transfers",
      sheets: [
        {
          name: "Transfers",
          title: t("inventory.transfers.title"),
          columns: [
            { key: "ingredient", header: t("recipes.ingredient"), accessor: (tr: BranchInventoryTransfer) => tr.ingredient_name, width: 22 },
            { key: "from", header: t("inventory.transfers.fromBranch"), accessor: (tr: BranchInventoryTransfer) => tr.source_branch_name, width: 20 },
            { key: "to", header: t("inventory.transfers.toBranch"), accessor: (tr: BranchInventoryTransfer) => tr.destination_branch_name, width: 20 },
            { key: "qty", header: t("common.qty"), accessor: (tr: BranchInventoryTransfer) => Number(tr.quantity), type: "number", width: 12 },
            { key: "note", header: t("common.notes"), accessor: (tr: BranchInventoryTransfer) => tr.note ?? "—", width: 28 },
            { key: "by", header: t("common.by"), accessor: (tr: BranchInventoryTransfer) => tr.initiated_by_name, width: 18 },
            { key: "at", header: t("common.date"), accessor: (tr: BranchInventoryTransfer) => new Date(tr.initiated_at), type: "dateTime", width: 20 },
          ],
          rows: transfers,
        },
      ],
    });

  if (!branchId) return <EmptyState icon={ArrowLeftRight} title={t("orders.selectBranch")} />;
  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <Select value={direction} onValueChange={(v) => setDirection(v as "all" | "incoming" | "outgoing")}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.transfers.directionAll")}</SelectItem>
            <SelectItem value="incoming">{t("inventory.transfers.directionIncoming")}</SelectItem>
            <SelectItem value="outgoing">{t("inventory.transfers.directionOutgoing")}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setNewDlg(true)}><Plus /> {t("inventory.transfers.newTransfer")}</Button>
      </div>

      {transfers.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title={t("inventory.transfers.empty")} />
      ) : (
        <DataTable columns={cols} data={transfers} searchKey="ingredient_name" onExport={handleExport} />
      )}

      <Dialog open={newDlg} onOpenChange={setNewDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("inventory.transfers.newTransfer")}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(create)}>
              <DialogBody>
                <FormField control={form.control} name="source_branch_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.transfers.fromBranch")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destination_branch_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.transfers.toBranch")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {branches.filter((b) => b.id !== form.watch("source_branch_id")).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="org_ingredient_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recipes.ingredient")}</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={catalog.filter((c: OrgIngredient) => c.is_active).map((c: OrgIngredient) => ({ value: c.id, label: c.name, hint: fmtUnit(c.unit) }))}
                        value={field.value || null}
                        onChange={(v) => field.onChange(v ?? "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>{t("common.qty")}</FormLabel><FormControl><Input type="number" step="0.001" min="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="note" render={({ field }) => (
                  <FormItem><FormLabel>{t("common.notes")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNewDlg(false)}>{t("common.cancel")}</Button>
                <Button type="submit" loading={isCreating}>{t("common.save")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editNote} onOpenChange={(o) => !o && setEditNote(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("inventory.transfers.editNote")}</DialogTitle></DialogHeader>
          <DialogBody>
            <Input value={noteVal} onChange={(e) => setNoteVal(e.target.value)} />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNote(null)}>{t("common.cancel")}</Button>
            <Button loading={isUpdating} onClick={updateNote}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

