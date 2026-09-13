import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, MoreHorizontal, PlusCircle, Trash2, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { queryClient } from "@/data/api/query";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import { useExportLogo } from "@/hooks/use-export-logo";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { fmtDateTime, fmtDuration, fmtMoney } from "@/lib/format";

import {
  tillReportQueryOptions,
  useDeleteTill,
  useForceCloseTill,
  useListTills,
  useOpenTills,
  useTillPreFill,
  type Till,
  type TillStatus,
} from "./api";
import { CashMovementDialog } from "./cash-movement-dialog";
import { CloseTillDialog } from "./close-till-dialog";
import { OpenTillDialog } from "./open-till-dialog";
import { DisagreementBadge, FlagBadge, TillStatusBadge, VerificationBadge } from "./till-badges";
import { TillReportSheet } from "./till-report-sheet";

export interface TillsSearch {
  report?: string;
  status?: TillStatus;
  teller?: string;
  device?: string;
  flagged?: boolean;
  today?: boolean;
}

const STATUSES: TillStatus[] = ["open", "closed", "force_closed"];

export function validateTillsSearch(s: Record<string, unknown>): TillsSearch {
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const bool = (v: unknown) => v === true || v === "true" || v === "1" || undefined;
  const status = str(s.status);
  return {
    report: str(s.report),
    status: STATUSES.includes(status as TillStatus) ? (status as TillStatus) : undefined,
    teller: str(s.teller),
    device: str(s.device),
    flagged: bool(s.flagged),
    today: bool(s.today),
  };
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function TillsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "super_admin" || role === "org_admin" || role === "branch_manager";
  const { branchId, scopeBranchId, isAllBranches } = useScope();

  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as TillsSearch;
  const setSearch = (patch: Partial<TillsSearch>) =>
    void navigate({ to: ".", replace: true, search: (p: Record<string, unknown>) => ({ ...p, ...patch }) });
  const reportId = search.report ?? null;
  const setReportId = (id: string | null) => setSearch({ report: id ?? undefined });

  const [openDialog, setOpenDialog] = useState(false);
  const [closeTill, setCloseTill] = useState<Till | null>(null);
  const [cashTillId, setCashTillId] = useState<string | null>(null);

  const current = useTillPreFill(branchId);
  const openNow = useOpenTills(branchId);
  const tills = useListTills(scopeBranchId, {
    status: search.status,
    teller_id: search.teller,
    device_id: search.device,
    flagged: search.flagged,
    from: search.today ? startOfToday() : undefined,
  });

  const forceClose = useForceCloseTill();
  const removeTill = useDeleteTill();
  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  const onForceClose = async (s: Till) => {
    if (
      await confirm({
        title: t("tills.forceClose", "Force close till"),
        description: t("tills.forceCloseDesc", "Closes the till without a cash count. Use only when a teller can't close it on their device."),
        destructive: true,
        confirmLabel: t("tills.forceClose", "Force close"),
      })
    ) {
      forceClose.mutate(
        { tillId: s.id },
        { onSuccess: () => toast.success(t("tills.forceClosed", "Till force-closed")), onError: (e) => toast.error(getErrorMessage(e)) },
      );
    }
  };

  const onDelete = async (s: Till) => {
    if (
      await confirm({
        title: t("tills.deleteTitle", "Delete till"),
        description: t("common.confirmDelete", { name: fmtDateTime(s.opened_at), defaultValue: "Delete this till?" }),
        destructive: true,
        confirmLabel: t("common.delete", "Delete"),
      })
    ) {
      removeTill.mutate(
        { tillId: s.id },
        { onSuccess: () => toast.success(t("tills.deleted", "Till deleted")), onError: (e) => toast.error(getErrorMessage(e)) },
      );
    }
  };

  const rows = useMemo(() => tills.data?.data ?? [], [tills.data]);
  // Teller/device filter options come from what the branch has actually seen.
  const tellers = useMemo(() => uniqueBy(rows, (r) => r.teller_id, (r) => r.teller_name), [rows]);
  const devices = useMemo(
    () => uniqueBy(rows.filter((r) => r.device_id), (r) => r.device_id!, (r) => r.device_label || r.device_code || "—"),
    [rows],
  );

  const handleExport = async () => {
    const cols: ExcelColumn<Till>[] = [
      { header: t("tills.opened", "Opened"), accessor: (s) => s.opened_at, type: "dateTime", width: 20 },
      { header: t("tills.teller", "Teller"), accessor: (s) => s.teller_name, type: "text", width: 22 },
      { header: t("tills.device", "Device"), accessor: (s) => s.device_code ?? "", type: "text", width: 10 },
      { header: t("common.status", "Status"), accessor: (s) => t(`tillStatus.${s.status}`, s.status), type: "text", width: 14 },
      { header: t("tills.openingCash", "Opening"), accessor: (s) => s.opening_cash, type: "money", width: 14 },
      { header: t("tills.closingCash", "Closing"), accessor: (s) => s.closing_cash_declared ?? null, type: "money", width: 14 },
      { header: t("tills.discrepancy", "Discrepancy"), accessor: (s) => s.cash_discrepancy ?? null, type: "money", width: 14 },
      { header: t("tills.flagged", "Opened while another till was open"), accessor: (s) => (s.opened_while_another_open ? "✓" : ""), type: "text", width: 10 },
      { header: t("tills.reconciliation.title", "Payment check"), accessor: (s) => s.disagreement_count || "", type: "text", width: 10 },
    ];
    setExporting(true);
    try {
      await exportToExcel({
        filename: "Madar-Tills",
        logoUrl,
        sheets: [{ name: t("nav.tills", "Tills"), title: t("nav.tills", "Tills"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const actions = (s: Till) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("common.actions", "Actions")} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => setReportId(s.id)}>{t("tills.viewReport", "View report")}</DropdownMenuItem>
        {s.status === "open" && s.id === current.data?.open_till?.id ? (
          <>
            <DropdownMenuItem onClick={() => setCashTillId(s.id)}>
              <Wallet className="size-4" />
              {t("tills.cashMovement", "Cash movement")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCloseTill(s)}>{t("tills.closeTill", "Close till")}</DropdownMenuItem>
          </>
        ) : null}
        {canManage && s.status === "open" ? (
          <DropdownMenuItem variant="destructive" onClick={() => onForceClose(s)}>
            <XCircle className="size-4" />
            {t("tills.forceClose", "Force close")}
          </DropdownMenuItem>
        ) : null}
        {canManage ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(s)}>
            <Trash2 className="size-4" />
            {t("common.delete", "Delete")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const myOpen = branchId && current.data?.has_open_till ? current.data.open_till : null;

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("nav.tills", "Tills")}</h1>
          <p className="text-sm text-muted-foreground">{t("tills.subtitle", "Each teller's sales session and cash drawer")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton onExport={handleExport} loading={exporting} disabled={!rows.length} />
          {branchId && !myOpen ? (
            <Button onClick={() => setOpenDialog(true)}>
              <PlusCircle className="size-4" />
              {t("tills.openTill", "Open till")}
            </Button>
          ) : null}
        </div>
      </div>

      {branchId ? <OpenNowStrip tills={openNow.data ?? []} onOpen={setReportId} /> : null}

      <TillFilters
        search={search}
        tellers={tellers}
        devices={devices}
        onChange={setSearch}
      />

      <TillsTable
        tills={rows}
        loading={tills.isLoading}
        showBranch={isAllBranches}
        onOpenReport={setReportId}
        renderActions={actions}
      />

      <OpenTillDialog branchId={branchId ?? ""} open={openDialog} onOpenChange={setOpenDialog} suggestedCash={current.data?.suggested_opening_cash ?? 0} />
      <CloseTillDialog till={closeTill} open={!!closeTill} onOpenChange={(o) => !o && setCloseTill(null)} />
      <CashMovementDialog tillId={cashTillId} open={!!cashTillId} onOpenChange={(o) => !o && setCashTillId(null)} />
      <TillReportSheet tillId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} onOpenTill={setReportId} />
    </Page>
  );
}

function uniqueBy<T>(rows: T[], id: (r: T) => string, label: (r: T) => string) {
  const m = new Map<string, string>();
  for (const r of rows) if (!m.has(id(r))) m.set(id(r), label(r));
  return [...m].map(([value, name]) => ({ value, name }));
}

/** Open right now at this branch; kept live by the `tills` realtime topic. */
export function OpenNowStrip({ tills, onOpen }: { tills: Till[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <Card className="py-0">
      <CardContent className="space-y-2 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Clock className="size-4 text-success" aria-hidden="true" />
          {t("tills.openNow", "Open now")} <span className="tabular text-muted-foreground">{tills.length}</span>
        </p>
        {tills.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.noOpenTill", "No open till")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tills.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpen(s.id)}
                  className="flex flex-col items-start rounded-md border px-3 py-2 text-start text-sm hover:bg-muted"
                >
                  <span className="font-medium">
                    {s.teller_name}
                    {s.device_code ? <span className="ms-1 text-muted-foreground">· {s.device_code}</span> : null}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">{fmtDuration(s.opened_at)}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <VerificationBadge verification={s.verification} />
                    <FlagBadge till={s} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TillFilters({
  search,
  tellers,
  devices,
  onChange,
}: {
  search: TillsSearch;
  tellers: { value: string; name: string }[];
  devices: { value: string; name: string }[];
  onChange: (p: Partial<TillsSearch>) => void;
}) {
  const { t } = useTranslation();
  const selectCls = "h-9 rounded-md border bg-background px-2 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select aria-label={t("common.status", "Status")} className={selectCls} value={search.status ?? ""} onChange={(e) => onChange({ status: (e.target.value || undefined) as TillStatus | undefined })}>
        <option value="">{t("common.all", "All")}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{t(`tillStatus.${s}`, s)}</option>
        ))}
      </select>
      <select aria-label={t("tills.teller", "Teller")} className={selectCls} value={search.teller ?? ""} onChange={(e) => onChange({ teller: e.target.value || undefined })}>
        <option value="">{t("tills.allTellers", "All tellers")}</option>
        {tellers.map((o) => (
          <option key={o.value} value={o.value}>{o.name}</option>
        ))}
      </select>
      <select aria-label={t("tills.device", "Device")} className={selectCls} value={search.device ?? ""} onChange={(e) => onChange({ device: e.target.value || undefined })}>
        <option value="">{t("tills.allDevices", "All devices")}</option>
        {devices.map((o) => (
          <option key={o.value} value={o.value}>{o.name}</option>
        ))}
      </select>
      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox checked={!!search.today} onCheckedChange={(c) => onChange({ today: c === true || undefined })} />
        {t("tills.filters.today", "Today")}
      </Label>
      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox checked={!!search.flagged} onCheckedChange={(c) => onChange({ flagged: c === true || undefined })} />
        {t("tills.filters.flagged", "Flagged only")}
      </Label>
    </div>
  );
}

export function TillsTable({
  tills,
  loading,
  showBranch,
  onOpenReport,
  renderActions,
}: {
  tills: Till[];
  loading?: boolean;
  showBranch?: boolean;
  onOpenReport: (id: string) => void;
  renderActions?: (t: Till) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const columns = useMemo<ColumnDef<Till>[]>(
    () => [
      { accessorKey: "opened_at", header: t("tills.opened", "Opened"), cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.opened_at)}</span> },
      { accessorKey: "closed_at", header: t("tills.closed", "Closed"), cell: ({ row }) => <span className="tabular">{row.original.closed_at ? fmtDateTime(row.original.closed_at) : "—"}</span> },
      ...(showBranch ? ([{ accessorKey: "branch_name", header: t("tills.branch", "Branch"), cell: ({ row }) => row.original.branch_name ?? "—" }] as ColumnDef<Till>[]) : []),
      { accessorKey: "teller_name", header: t("tills.teller", "Teller") },
      {
        id: "device",
        header: t("tills.device", "Device"),
        cell: ({ row }) => {
          const s = row.original;
          if (!s.device_code && !s.device_label) return <span className="text-muted-foreground">—</span>;
          return (
            <span>
              <span className="font-mono">{s.device_code}</span>
              {s.device_label ? <span className="ms-1 text-muted-foreground">{s.device_label}</span> : null}
            </span>
          );
        },
      },
      { accessorKey: "status", header: t("common.status", "Status"), cell: ({ row }) => <TillStatusBadge status={row.original.status} /> },
      {
        id: "flags",
        header: t("tills.flags", "Flags"),
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            <VerificationBadge verification={row.original.verification} />
            <FlagBadge till={row.original} onOpenOther={onOpenReport} />
            <DisagreementBadge till={row.original} />
          </span>
        ),
      },
      {
        accessorKey: "cash_discrepancy",
        header: t("tills.discrepancy", "Discrepancy"),
        cell: ({ row }) => {
          const d = row.original.cash_discrepancy;
          if (d == null) return <span className="text-muted-foreground">—</span>;
          if (d === 0)
            return (
              <span className="inline-flex items-center gap-1 tabular text-success">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {fmtMoney(d)}
              </span>
            );
          return (
            <span className="inline-flex items-center gap-1 tabular text-destructive">
              {d > 0 ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : <ArrowDownLeft className="size-3.5" aria-hidden="true" />}
              {fmtMoney(d)}
            </span>
          );
        },
      },
      ...(renderActions
        ? ([{ id: "actions", enableHiding: false, cell: ({ row }) => <div className="text-end">{renderActions(row.original)}</div> }] as ColumnDef<Till>[])
        : []),
    ],
    [t, showBranch, onOpenReport, renderActions],
  );
  return (
    <DataTable
      columns={columns}
      data={tills}
      loading={loading}
      onRowClick={(s) => onOpenReport(s.id)}
      onRowPrefetch={(s) => void queryClient.prefetchQuery(tillReportQueryOptions(s.id))}
      getRowId={(s) => s.id}
      emptyState={<EmptyState icon={Clock} title={t("tills.empty", "No tills yet")} />}
    />
  );
}
