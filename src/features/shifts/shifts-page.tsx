import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Clock, MoreHorizontal, PlusCircle, Wallet, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OpenShiftDialog, invalidateShifts } from "./open-shift-dialog";
import { CloseShiftDialog } from "./close-shift-dialog";
import { CashMovementDialog } from "./cash-movement-dialog";
import { ShiftReportSheet } from "./shift-report-sheet";
import {
  getGetShiftReportQueryOptions,
  useDeleteShift,
  useForceCloseShift,
  useGetCurrentShift,
  useListShifts,
} from "@/data/api/generated/api";
import { queryClient } from "@/data/api/query";
import type { Shift } from "@/data/api/generated/models";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime, fmtDuration, fmtMoney } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { getErrorMessage } from "@/data/api/errors";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
  force_closed: "bg-warning/10 text-warning",
};

function ShiftStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="secondary" className={cn("capitalize", STATUS_STYLES[status] ?? "")}>
      {t(`shiftStatus.${status}`, status.replace("_", " "))}
    </Badge>
  );
}

export function ShiftsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "super_admin" || role === "org_admin" || role === "branch_manager";
  const { branchId, scopeBranchId, isAllBranches } = useScope();

  const [openShift, setOpenShift] = useState(false);
  const [closeShift, setCloseShift] = useState<Shift | null>(null);
  const [cashShiftId, setCashShiftId] = useState<string | null>(null);
  // Opened shift report lives in the URL (?report=<id>) so it's shareable.
  const navigate = useNavigate();
  const reportId = (useSearch({ strict: false }) as { report?: string }).report ?? null;
  const setReportId = (id: string | null) =>
    void navigate({ to: ".", replace: true, search: (p: Record<string, unknown>) => ({ ...p, report: id ?? undefined }) });

  // The current-shift banner + opening a shift are branch-specific actions, so
  // they stay tied to a concrete branch. The list scopes to the selected branch
  // or rolls up across the org ("All branches").
  const current = useGetCurrentShift(branchId ?? "", { query: { enabled: !!branchId } });
  // No page/per_page params → the backend returns every shift in one envelope
  // (the export below needs the full set, and this page has no pagination UI).
  const shifts = useListShifts(scopeBranchId, undefined, { query: { enabled: !!scopeBranchId } });

  const forceClose = useForceCloseShift({
    mutation: {
      onSuccess: () => {
        toast.success(t("shifts.forceClosed", "Shift force-closed"));
        void invalidateShifts();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });
  const removeShift = useDeleteShift({
    mutation: {
      onSuccess: () => {
        toast.success(t("shifts.deleted", "Shift deleted"));
        void invalidateShifts();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const onForceClose = async (s: Shift) => {
    if (
      await confirm({
        title: t("shifts.forceClose", "Force close shift"),
        description: t("shifts.forceCloseDesc", "Closes the shift without a cash count. Use only when a teller can't close normally."),
        destructive: true,
        confirmLabel: t("shifts.forceClose", "Force close"),
      })
    ) {
      forceClose.mutate({ shiftId: s.id, data: { reason: null } });
    }
  };

  const onDelete = async (s: Shift) => {
    if (
      await confirm({
        title: t("shifts.deleteTitle", "Delete shift"),
        description: t("common.confirmDelete", { name: fmtDateTime(s.opened_at), defaultValue: "Delete this shift?" }),
        destructive: true,
        confirmLabel: t("common.delete", "Delete"),
      })
    ) {
      removeShift.mutate({ shiftId: s.id });
    }
  };

  const columns = useMemo<ColumnDef<Shift>[]>(
    () => [
      {
        accessorKey: "opened_at",
        header: t("shifts.opened", "Opened"),
        cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.opened_at)}</span>,
      },
      ...(isAllBranches
        ? ([{
            accessorKey: "branch_name",
            header: t("shifts.branch", "Branch"),
            cell: ({ row }) => <span>{row.original.branch_name ?? "—"}</span>,
          }] as ColumnDef<Shift>[])
        : []),
      { accessorKey: "teller_name", header: t("shifts.teller", "Teller") },
      {
        accessorKey: "status",
        header: t("common.status", "Status"),
        cell: ({ row }) => <ShiftStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "opening_cash",
        header: t("shifts.openingCash", "Opening"),
        cell: ({ row }) => {
          const s = row.original;
          if (!s.opening_cash_was_edited) {
            return <span className="tabular">{fmtMoney(s.opening_cash)}</span>;
          }
          // Flag a shift that opened with an amount different from the carryover.
          const tip = [
            s.opening_cash_original != null
              ? `${t("shifts.expectedOpening", "Expected (carryover)")}: ${fmtMoney(s.opening_cash_original)}`
              : null,
            s.opening_cash_edit_reason,
          ]
            .filter(Boolean)
            .join(" — ");
          return (
            <span className="inline-flex items-center gap-1 text-warning" title={tip || undefined}>
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="tabular">{fmtMoney(s.opening_cash)}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "closing_cash_declared",
        header: t("shifts.closingCash", "Closing"),
        cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.closing_cash_declared)}</span>,
      },
      {
        accessorKey: "cash_discrepancy",
        header: t("shifts.discrepancy", "Discrepancy"),
        cell: ({ row }) => {
          const d = row.original.cash_discrepancy;
          if (d == null) return <span className="text-muted-foreground">—</span>;
          return <span className={cn("tabular", d === 0 ? "text-success" : "text-destructive")}>{fmtMoney(d)}</span>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="text-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => setReportId(s.id)}>{t("shifts.viewReport", "View report")}</DropdownMenuItem>
                  {canManage && s.status === "open" ? (
                    <DropdownMenuItem onClick={() => onForceClose(s)}>
                      <XCircle className="size-4" />
                      {t("shifts.forceClose", "Force close")}
                    </DropdownMenuItem>
                  ) : null}
                  {canManage ? (
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() => onDelete(s)}
                    >
                      <Trash2 className="size-4" />
                      {t("common.delete", "Delete")}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, canManage, isAllBranches],
  );

  const handleExport = () => {
    const rows = shifts.data?.data ?? [];
    const cols: ExcelColumn<Shift>[] = [
      { header: t("shifts.opened", "Opened"), accessor: (s) => s.opened_at, type: "dateTime", width: 20 },
      { header: t("shifts.teller", "Teller"), accessor: (s) => s.teller_name, type: "text", width: 22 },
      { header: t("common.status", "Status"), accessor: (s) => t(`shiftStatus.${s.status}`, s.status.replace("_", " ")), type: "text", width: 14 },
      { header: t("shifts.openingCash", "Opening"), accessor: (s) => s.opening_cash, type: "money", width: 14 },
      { header: t("shifts.expectedOpening", "Expected (carryover)"), accessor: (s) => s.opening_cash_original ?? null, type: "money", width: 16 },
      { header: t("shifts.openingEditReason", "Opening edit reason"), accessor: (s) => (s.opening_cash_was_edited ? (s.opening_cash_edit_reason ?? "—") : ""), type: "text", width: 24 },
      { header: t("shifts.closingCash", "Closing"), accessor: (s) => s.closing_cash_declared ?? null, type: "money", width: 14 },
      { header: t("shifts.discrepancy", "Discrepancy"), accessor: (s) => s.cash_discrepancy ?? null, type: "money", width: 14 },
    ];
    void exportToExcel({ filename: "Sufrix-Shifts", sheets: [{ name: t("nav.shifts", "Shifts"), title: t("nav.shifts", "Shifts"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  // No current-shift banner / "Open shift" action in the all-branches roll-up —
  // those need a concrete branch. The list still shows every branch's shifts.
  const openShiftData = branchId && current.data?.has_open_shift ? current.data.open_shift : null;

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("nav.shifts", "Shifts")}</h1>
          <p className="text-sm text-muted-foreground">{t("shifts.subtitle", "Open and close shifts and reconcile the cash drawer")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton onExport={handleExport} disabled={!(shifts.data?.data?.length)} />
          {branchId && !openShiftData ? (
            <Button onClick={() => setOpenShift(true)}>
              <PlusCircle className="size-4" />
              {t("shifts.openShift", "Open shift")}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Current shift banner */}
      {openShiftData ? (
        <Card className="border-success/30 bg-success/5 py-0">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-success/10 text-success">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {openShiftData.teller_name}
                  <ShiftStatusBadge status={openShiftData.status} />
                </p>
                <p className="text-sm text-muted-foreground tabular">
                  {t("shifts.opened", "Opened")} {fmtDateTime(openShiftData.opened_at)} ·{" "}
                  {fmtDuration(openShiftData.opened_at)} · {fmtMoney(openShiftData.opening_cash)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCashShiftId(openShiftData.id)}>
                <Wallet className="size-4" />
                {t("shifts.cashMovement", "Cash movement")}
              </Button>
              <Button onClick={() => setCloseShift(openShiftData)}>{t("shifts.closeShift", "Close shift")}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={shifts.data?.data ?? []}
        loading={shifts.isLoading}
        onRowClick={(s) => setReportId(s.id)}
        onRowPrefetch={(s) => void queryClient.prefetchQuery(getGetShiftReportQueryOptions(s.id))}
        getRowId={(s) => s.id}
        emptyState={<EmptyState icon={Clock} title={t("shifts.empty", "No shifts yet")} />}
      />

      <OpenShiftDialog
        branchId={branchId ?? ""}
        open={openShift}
        onOpenChange={setOpenShift}
        suggestedCash={current.data?.suggested_opening_cash ?? 0}
      />
      <CloseShiftDialog shift={closeShift} open={!!closeShift} onOpenChange={(o) => !o && setCloseShift(null)} />
      <CashMovementDialog shiftId={cashShiftId} open={!!cashShiftId} onOpenChange={(o) => !o && setCashShiftId(null)} />
      <ShiftReportSheet shiftId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} />
    </Page>
  );
}
