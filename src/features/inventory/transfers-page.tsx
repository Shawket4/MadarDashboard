import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight, ArrowRight, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { SegmentedControl } from "@/components/app/segmented-control";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BranchInventoryTransfer } from "@/data/api/generated/models";
import {
  deleteTransfer, updateTransfer, useListBranches, useListTransfers,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { TransferDialog } from "./transfer-dialog";
import { invalidateInventory } from "./lib";

type Direction = "all" | "incoming" | "outgoing";

export function TransfersPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const orgId = useOrgId();
  const { branchId, scopeBranchId } = useScope();
  const [dir, setDir] = useState<Direction>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [editNote, setEditNote] = useState<BranchInventoryTransfer | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const activeBranches = useMemo(() => (branches.data ?? []).filter((b) => b.is_active), [branches.data]);

  // The list scopes to the selected branch or rolls up across the org
  // ("All branches"). Transfer rows carry source/destination branch names, so
  // no extra Branch column is needed.
  const transfers = useListTransfers(
    scopeBranchId,
    { direction: dir === "all" ? undefined : dir },
    { query: { enabled: !!scopeBranchId } },
  );

  const onReverse = async (tr: BranchInventoryTransfer) => {
    if (await confirm({
      title: t("common.delete", "Delete"),
      description: t("inventory.transfers.deleteConfirm", "Reverse and delete this transfer?"),
      destructive: true,
      confirmLabel: t("common.delete", "Delete"),
    })) {
      try {
        await deleteTransfer(tr.id);
        await invalidateInventory();
        toast.success(t("common.done", "Done"));
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    }
  };

  const saveNote = async () => {
    if (!editNote) return;
    setSavingNote(true);
    try {
      await updateTransfer(editNote.id, { note: noteDraft.trim() || null });
      await invalidateInventory();
      toast.success(t("common.savedChanges", "Changes saved"));
      setEditNote(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSavingNote(false);
    }
  };

  const columns = useMemo<ColumnDef<BranchInventoryTransfer>[]>(
    () => [
      {
        accessorKey: "initiated_at",
        header: t("common.date", "Date"),
        cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.initiated_at)}</span>,
      },
      { accessorKey: "ingredient_name", header: t("inventory.transfers.ingredient", "Ingredient") },
      {
        accessorKey: "quantity",
        header: t("inventory.transfers.quantity", "Quantity"),
        cell: ({ row }) => <span className="tabular">{fmtNumber(row.original.quantity)} {fmtUnit(row.original.unit)}</span>,
      },
      {
        id: "route",
        header: t("inventory.transfers.direction", "Direction"),
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-sm">
            {row.original.source_branch_name}
            <ArrowRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
            {row.original.destination_branch_name}
          </span>
        ),
      },
      {
        accessorKey: "initiated_by_name",
        header: t("inventory.transfers.by", "By"),
        cell: ({ row }) => row.original.initiated_by_name ?? "—",
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => { setEditNote(row.original); setNoteDraft(row.original.note ?? ""); }}>
                  {t("inventory.transfers.editNote", "Edit note")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => void onReverse(row.original)}
                >
                  <Trash2 className="size-4" />
                  {t("common.delete", "Delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const handleExport = () => {
    const rows = transfers.data ?? [];
    const cols: ExcelColumn<BranchInventoryTransfer>[] = [
      { header: t("common.date", "Date"), accessor: (tr) => tr.initiated_at, type: "dateTime", width: 20 },
      { header: t("inventory.transfers.ingredient", "Ingredient"), accessor: (tr) => tr.ingredient_name, type: "text", width: 28 },
      { header: t("inventory.transfers.quantity", "Quantity"), accessor: (tr) => tr.quantity, type: "number", width: 12 },
      { header: t("inventory.catalog.unit", "Unit"), accessor: (tr) => fmtUnit(tr.unit), type: "text", width: 10 },
      { header: t("inventory.transfers.from", "From"), accessor: (tr) => tr.source_branch_name, type: "text", width: 22 },
      { header: t("inventory.transfers.to", "To"), accessor: (tr) => tr.destination_branch_name, type: "text", width: 22 },
      { header: t("inventory.transfers.by", "By"), accessor: (tr) => tr.initiated_by_name ?? "—", type: "text", width: 18 },
      { header: t("inventory.transfers.note", "Note"), accessor: (tr) => tr.note ?? "", type: "text", width: 30 },
    ];
    void exportToExcel({ filename: "Sufrix-Transfers", sheets: [{ name: t("inventory.transfers.title", "Transfers"), title: t("inventory.transfers.title", "Transfers"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.transfers.title", "Transfers")}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton onExport={handleExport} disabled={!(transfers.data?.length)} />
          {/* Creating a transfer needs a concrete source branch, so the action
              is gated to a selected branch — hidden in the all-branches roll-up. */}
          {branchId ? (
            <Button onClick={() => setNewOpen(true)} disabled={activeBranches.length < 2}>
              <PlusCircle className="size-4" />
              {t("inventory.transfers.create", "New transfer")}
            </Button>
          ) : null}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transfers.data ?? []}
        loading={transfers.isLoading}
        getRowId={(tr) => tr.id}
        toolbar={
          <SegmentedControl<Direction>
            value={dir}
            onChange={setDir}
            options={[
              { value: "all", label: t("inventory.transfers.all", "All transfers") },
              { value: "incoming", label: t("inventory.transfers.incoming", "Incoming") },
              { value: "outgoing", label: t("inventory.transfers.outgoing", "Outgoing") },
            ]}
          />
        }
        emptyState={<EmptyState icon={ArrowLeftRight} title={t("inventory.transfers.noTransfers", "No transfers found")} />}
      />

      <TransferDialog open={newOpen} onOpenChange={setNewOpen} branches={activeBranches} defaultSourceId={branchId} />

      <Dialog open={!!editNote} onOpenChange={(o) => !o && setEditNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inventory.transfers.editNote", "Edit note")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t("inventory.transfers.note", "Note")}</Label>
            <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNote(null)}>{t("common.cancel", "Cancel")}</Button>
            <Button loading={savingNote} onClick={() => void saveNote()}>{t("common.save", "Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
