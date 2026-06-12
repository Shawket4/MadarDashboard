import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Clock, DollarSign, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import type { Shift } from "@/shared/api/generated/models/shift";
import { StatCard } from "@/shared/ui/stat-card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useListShifts, useGetCurrentShift, useDeleteShift, getListShiftsQueryKey, getGetCurrentShiftQueryKey } from "@/shared/api/generated/api";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { useScopedParams } from "@/shared/scope/use-scoped-params";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtDateTime, fmtDuration, fmtMoney } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { ShiftStatus } from "@/shared/config/constants";


import { OpenShiftDialog, CloseShiftDialog, ForceCloseDialog, CashMovementDialog } from "./dialogs";
import { ShiftReportDrawer } from "./report-drawer";

const STATUS_VARIANT: Record<ShiftStatus, "success" | "secondary" | "warning"> = {
  open: "success",
  closed: "secondary",
  force_closed: "warning",
};

export default function Shifts() {
  const { t } = useTranslation();
  const { role: currentUserRole } = useCurrentContext();
  // Branch comes from the global scope bar in the header (B.1)
  const { branchId } = useScopedParams();
  const selBranch = branchId ?? "";

  const { data: shifts = [], isLoading } = useListShifts(selBranch ?? "", { query: { enabled: !!selBranch } });
  const { data: preFill } = useGetCurrentShift(selBranch ?? "", { query: { enabled: !!selBranch } });

  const [openDlg, setOpenDlg] = useState(false);
  const [closeDlg, setCloseDlg] = useState(false);
  const [forceDlg, setForceDlg] = useState(false);
  const [cashDlg, setCashDlg] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);

  const openShift = preFill?.open_shift ?? null;
  const canDeleteShift = currentUserRole === "org_admin" || currentUserRole === "super_admin";

  const qc = useQueryClient();
  const deleteShiftMutation = useDeleteShift({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListShiftsQueryKey(selBranch ?? "") });
        qc.invalidateQueries({ queryKey: getGetCurrentShiftQueryKey(selBranch ?? "") });
        toast.success(t("shifts.toasts.deleted") || "Shift deleted successfully");
        setDeleteShiftId(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const cols: ColumnDef<Shift>[] = [
    {
      accessorKey: "teller_name",
      header: t("shifts.teller", { defaultValue: t("dashboard.teller") }),
      cell: ({ row }) => <span className="font-semibold text-sm">{row.original.teller_name}</span>,
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status as ShiftStatus] || "secondary"}>{t(`shiftStatus.${row.original.status}`)}</Badge>,
    },
    { accessorKey: "opened_at", header: t("shifts.opened"), cell: ({ row }) => <span className="text-xs">{fmtDateTime(row.original.opened_at)}</span> },
    {
      accessorKey: "closed_at",
      header: t("shifts.closed"),
      cell: ({ row }) => row.original.closed_at ? <span className="text-xs">{fmtDateTime(row.original.closed_at)}</span> : <span className="text-success text-xs font-semibold">{t("shifts.stillOpen")}</span>,
    },
    { accessorKey: "opening_cash", header: t("shifts.openingCash"), cell: ({ row }) => <span className="tabular text-sm">{fmtMoney(row.original.opening_cash)}</span> },
    {
      accessorKey: "cash_discrepancy",
      header: t("shifts.cashDiscrepancy"),
      cell: ({ row }) => {
        const d = row.original.cash_discrepancy;
        if (d === null || d === undefined) return <span className="text-muted-foreground">—</span>;
        return <span className={`tabular text-sm font-semibold ${d === 0 ? "" : d > 0 ? "text-success" : "text-destructive"}`}>{d >= 0 ? "+" : "−"}{fmtMoney(Math.abs(d))}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="iconSm" onClick={() => setReportId(row.original.id)}>
            <FileText size={13} />
          </Button>
          {canDeleteShift && (
            <Button
              variant="ghost"
              size="iconSm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteShiftId(row.original.id)}
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Shifts",
      sheets: [
        {
          name: "Shifts",
          title: t("shifts.title"),
          columns: [
            { key: "teller", header: t("dashboard.teller"), accessor: (s: Shift) => s.teller_name, width: 22 },
            { key: "status", header: t("common.status"), accessor: (s: Shift) => t(`shiftStatus.${s.status}`), width: 16 },
            { key: "opened", header: t("shifts.opened"), accessor: (s: Shift) => new Date(s.opened_at), type: "dateTime", width: 22 },
            { key: "closed", header: t("shifts.closed"), accessor: (s: Shift) => s.closed_at ? new Date(s.closed_at) : "—", type: "dateTime", width: 22 },
            { key: "opening", header: t("shifts.openingCash"), accessor: (s: Shift) => s.opening_cash, type: "money", width: 16, total: true },
            { key: "declared", header: t("shifts.declaredCash"), accessor: (s: Shift) => s.closing_cash_declared ?? 0, type: "money", width: 16, total: true },
            { key: "discrepancy", header: t("shifts.cashDiscrepancy"), accessor: (s: Shift) => s.cash_discrepancy ?? 0, type: "money", width: 16, total: true },
          ],
          rows: shifts,
          totals: true,
        },
      ],
    });

  return (
    <PageShell title={t("shifts.title")} description={t("shifts.subtitle")}>
      {openShift && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <p className="font-bold">{t("shifts.shiftIsOpen")}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{openShift.teller_name} · {fmtDuration(openShift.opened_at)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setCashDlg(true)}><DollarSign /> {t("shifts.cashMovement")}</Button>
              <Button size="sm" variant="outline" onClick={() => setReportId(openShift.id)}><FileText /> {t("shifts.reportBtn")}</Button>
              <Button size="sm" variant="warning" onClick={() => setForceDlg(true)}><AlertTriangle /> {t("shifts.forceClose")}</Button>
              <Button size="sm" onClick={() => setCloseDlg(true)}><Clock /> {t("shifts.close")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!openShift && selBranch && (
        <div className="flex justify-end">
          <Button onClick={() => setOpenDlg(true)}><Plus /> {t("shifts.openShift")}</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label={t("common.total")} value={shifts.length} loading={isLoading} />
        <StatCard label={t("shiftStatus.open")} value={shifts.filter((s) => s.status === "open").length} loading={isLoading} accent="success" icon={Clock} />
        <StatCard label={t("shiftStatus.closed")} value={shifts.filter((s) => s.status === "closed").length} loading={isLoading} accent="info" />
        <StatCard label={t("shiftStatus.force_closed")} value={shifts.filter((s) => s.status === "force_closed").length} loading={isLoading} accent="warning" />
      </div>

      {!selBranch ? (
        <EmptyState icon={Clock} title={t("orders.selectBranch")} />
      ) : shifts.length === 0 && !isLoading ? (
        <EmptyState icon={Clock} title={t("shifts.noShiftsYet")} description={t("shifts.noShiftsHint")} />
      ) : (
        <DataTable columns={cols} data={shifts} isLoading={isLoading} searchKey="teller_name" onExport={handleExport} />
      )}

      {selBranch && (
        <OpenShiftDialog
          open={openDlg}
          onClose={() => setOpenDlg(false)}
          branchId={selBranch}
          suggested={preFill?.suggested_opening_cash ?? 0}
          key={`open-${preFill?.suggested_opening_cash ?? 0}`}
        />
      )}
      {openShift && <CloseShiftDialog open={closeDlg} onClose={() => setCloseDlg(false)} shiftId={openShift.id} />}
      {openShift && <ForceCloseDialog open={forceDlg} onClose={() => setForceDlg(false)} shiftId={openShift.id} />}
      {openShift && <CashMovementDialog open={cashDlg} onClose={() => setCashDlg(false)} shiftId={openShift.id} />}

      <ShiftReportDrawer open={!!reportId} onClose={() => setReportId(null)} shiftId={reportId} />

      <ConfirmDialog
        open={!!deleteShiftId}
        onOpenChange={(open) => !open && setDeleteShiftId(null)}
        title={t("shifts.deleteConfirmTitle") || "Delete Shift?"}
        description={t("shifts.deleteConfirmDesc") || "This will permanently delete the shift, all of its orders, and all related records. This action is extremely destructive and cannot be undone."}
        confirmLabel={t("common.delete") || "Delete"}
        destructive
        loading={deleteShiftMutation.isPending}
        onConfirm={() => deleteShiftId && deleteShiftMutation.mutate({ shiftId: deleteShiftId })}
      />
    </PageShell>
  );
}

