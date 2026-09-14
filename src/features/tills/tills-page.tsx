import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Clock, MoreHorizontal, PlusCircle, ReceiptText, Trash2, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { queryClient } from "@/data/api/query";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import { useExportLogo } from "@/hooks/use-export-logo";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { fmtDateTime, fmtDuration, fmtMoney, fmtMoneySigned } from "@/lib/format";

import {
  tillReportQueryOptions,
  useDeleteTill,
  useForceCloseTill,
  useListTills,
  useOpenBillsNotice,
  useOpenTills,
  useTillPreFill,
  type OpenBillsNotice,
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
  const billsNotice = useOpenBillsNotice(branchId);
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
  const notice = billsNotice.data;
  const flaggedCount = rows.filter((r) => r.opened_while_another_open || r.reconciliation_status === "disagreed").length;

  const kpis: LedgerItem[] = [
    { key: "open", label: t("tills.openNow", "Open now"), value: openNow.data?.length ?? 0, icon: Clock, loading: !!branchId && openNow.isLoading },
    {
      key: "bills",
      label: t("tills.openBills", "Open bills"),
      value: notice?.open_bills_count ?? 0,
      icon: ReceiptText,
      hint: notice && notice.open_bills_count > 0 ? fmtMoney(notice.open_bills_amount) : undefined,
      loading: !!branchId && billsNotice.isLoading,
    },
    {
      key: "old",
      label: t("tills.oldBillsKpi", { hours: notice?.old_bill_hours ?? 3, defaultValue: "Older than {{hours}}h" }),
      value: notice?.old_bills_count ?? 0,
      icon: AlertTriangle,
      accent: notice?.old_bills_count ? "warning" : "neutral",
      loading: !!branchId && billsNotice.isLoading,
    },
    { key: "flagged", label: t("tills.flaggedKpi", "Flagged in list"), value: flaggedCount, accent: flaggedCount ? "warning" : "neutral", loading: tills.isLoading },
  ];

  return (
    <Page>
      <PageHeader
        title={t("nav.tills", "Tills")}
        subtitle={t("tills.subtitle", "Each teller's sales session and cash drawer")}
        actions={
          <>
            <ExportButton onExport={handleExport} loading={exporting} disabled={!rows.length} />
            {branchId && !myOpen ? (
              <Button onClick={() => setOpenDialog(true)}>
                <PlusCircle className="size-4" />
                {t("tills.openTill", "Open till")}
              </Button>
            ) : null}
          </>
        }
        below={<TillFilters search={search} tellers={tellers} devices={devices} onChange={setSearch} />}
      />

      {branchId ? <LedgerStrip items={kpis} /> : null}

      {branchId ? <OpenNowStrip tills={openNow.data ?? []} notice={notice} onOpen={setReportId} /> : null}

      <section className="space-y-3">
        <SectionHeader title={t("tills.history", "All tills")} count={tills.data?.total ?? rows.length} />
        <TillsTable
          tills={rows}
          loading={tills.isLoading}
          error={tills.error}
          onRetry={() => void tills.refetch()}
          showBranch={isAllBranches}
          onOpenReport={setReportId}
          renderActions={actions}
        />
      </section>

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
export function OpenNowStrip({ tills, notice, onOpen }: { tills: Till[]; notice?: OpenBillsNotice; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <SectionHeader
        title={t("tills.openNow", "Open now")}
        count={tills.length}
        description={notice && notice.open_bills_count > 0 ? <OpenBillsLine notice={notice} /> : undefined}
      />
      {tills.length === 0 ? (
        <EmptyState
          icon={Wallet}
          className="py-8"
          title={t("dashboard.noOpenTill", "No open till")}
          description={t("tills.noOpenHint", "A till opens when a teller starts selling on a POS.")}
        />
      ) : (
        <ListCard>
          {tills.map((s) => (
            <ListRow
              key={s.id}
              icon={Wallet}
              onClick={() => onOpen(s.id)}
              title={s.teller_name}
              meta={[s.device_code, s.device_label, fmtDuration(s.opened_at)].filter(Boolean).join(" · ")}
              trailing={
                <span className="hidden flex-wrap items-center justify-end gap-1.5 sm:flex">
                  <VerificationBadge verification={s.verification} />
                  <FlagBadge till={s} />
                </span>
              }
              value={fmtMoney(s.opening_cash)}
              numericValue
            />
          ))}
        </ListCard>
      )}
    </section>
  );
}

/** "N bills left open since …" with the old-bill count (branch's old_bill_hours). */
export function OpenBillsLine({ notice }: { notice: OpenBillsNotice }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1" data-testid="open-bills-notice">
      <span>
        {notice.since
          ? t("tills.openBillsNotice", { count: notice.open_bills_count, since: fmtDateTime(notice.since), defaultValue: "{{count}} bills left open since {{since}}" })
          : t("tills.openBillsCount", { count: notice.open_bills_count, defaultValue: "{{count}} open bills" })}
        <bdi className="ms-1 font-mono tabular-nums">({fmtMoney(notice.open_bills_amount)})</bdi>
      </span>
      {notice.old_bills_count > 0 ? (
        <span data-testid="old-bills" className="contents">
          <StatusPill tone="warning" size="sm">
            {t("tills.oldBills", { count: notice.old_bills_count, hours: notice.old_bill_hours, defaultValue: "{{count}} older than {{hours}}h" })}
          </StatusPill>
        </span>
      ) : null}
    </span>
  );
}

const ALL = "__all__";

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
  const pick = (v: string) => (v === ALL ? undefined : v);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={search.status ?? ALL} onValueChange={(v) => onChange({ status: pick(v) as TillStatus | undefined })}>
        <SelectTrigger className="h-9 w-auto min-w-32" aria-label={t("common.status", "Status")}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("tills.allStatuses", "All statuses")}</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{t(`tillStatus.${s}`, s)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={search.teller ?? ALL} onValueChange={(v) => onChange({ teller: pick(v) })}>
        <SelectTrigger className="h-9 w-auto min-w-36" aria-label={t("tills.teller", "Teller")}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("tills.allTellers", "All tellers")}</SelectItem>
          {tellers.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={search.device ?? ALL} onValueChange={(v) => onChange({ device: pick(v) })}>
        <SelectTrigger className="h-9 w-auto min-w-36" aria-label={t("tills.device", "Device")}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("tills.allDevices", "All devices")}</SelectItem>
          {devices.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label className="flex h-9 items-center gap-2 rounded-[10px] border bg-card px-3 text-sm font-normal">
        <Checkbox checked={!!search.today} onCheckedChange={(c) => onChange({ today: c === true || undefined })} />
        {t("tills.filters.today", "Today")}
      </Label>
      <Label className="flex h-9 items-center gap-2 rounded-[10px] border bg-card px-3 text-sm font-normal">
        <Checkbox checked={!!search.flagged} onCheckedChange={(c) => onChange({ flagged: c === true || undefined })} />
        {t("tills.filters.flagged", "Flagged only")}
      </Label>
    </div>
  );
}

export function TillsTable({
  tills,
  loading,
  error,
  onRetry,
  showBranch,
  onOpenReport,
  renderActions,
}: {
  tills: Till[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  showBranch?: boolean;
  onOpenReport: (id: string) => void;
  renderActions?: (t: Till) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const columns = useMemo<ColumnDef<Till>[]>(
    () => [
      {
        accessorKey: "teller_name",
        header: t("tills.teller", "Teller"),
        meta: { phone: "title", label: t("tills.teller", "Teller") },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-semibold">{row.original.teller_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              <bdi className="font-mono tabular-nums">{fmtDateTime(row.original.opened_at)}</bdi>
              {row.original.closed_at ? <> → <bdi className="font-mono tabular-nums">{fmtDateTime(row.original.closed_at)}</bdi></> : null}
            </p>
          </div>
        ),
      },
      ...(showBranch
        ? ([{ accessorKey: "branch_name", header: t("tills.branch", "Branch"), meta: { label: t("tills.branch", "Branch") }, cell: ({ row }) => row.original.branch_name ?? "—" }] as ColumnDef<Till>[])
        : []),
      {
        id: "device",
        header: t("tills.device", "Device"),
        meta: { label: t("tills.device", "Device") },
        cell: ({ row }) => {
          const s = row.original;
          if (!s.device_code && !s.device_label) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="whitespace-nowrap">
              <span className="font-mono font-medium">{s.device_code}</span>
              {s.device_label ? <span className="ms-1.5 text-muted-foreground">{s.device_label}</span> : null}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) => (
          <span className="flex flex-wrap items-center gap-1.5">
            <TillStatusBadge status={row.original.status} />
            <VerificationBadge verification={row.original.verification} />
            <FlagBadge till={row.original} onOpenOther={onOpenReport} />
            <DisagreementBadge till={row.original} />
          </span>
        ),
      },
      {
        accessorKey: "opening_cash",
        header: t("tills.openingCash", "Opening"),
        meta: { numeric: true, label: t("tills.openingCash", "Opening") },
        cell: ({ row }) => fmtMoney(row.original.opening_cash),
      },
      {
        accessorKey: "cash_discrepancy",
        header: t("tills.discrepancy", "Discrepancy"),
        meta: { numeric: true, label: t("tills.discrepancy", "Discrepancy") },
        cell: ({ row }) => {
          const d = row.original.cash_discrepancy;
          if (d == null) return <span className="text-muted-foreground">—</span>;
          return (
            <span className={d === 0 ? "text-muted-foreground" : "font-semibold text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]"}>
              {d === 0 ? fmtMoney(0) : fmtMoneySigned(d)}
            </span>
          );
        },
      },
    ],
    [t, showBranch, onOpenReport],
  );
  return (
    <DataTable
      columns={columns}
      data={tills}
      loading={loading}
      error={error}
      onRetry={onRetry}
      onRowClick={(s) => onOpenReport(s.id)}
      onRowPrefetch={(s) => void queryClient.prefetchQuery(tillReportQueryOptions(s.id))}
      getRowId={(s) => s.id}
      rowActions={renderActions}
      hideViewOptions
      pageSize={20}
      emptyState={
        <EmptyState
          icon={Clock}
          title={t("tills.empty", "No tills yet")}
          description={t("tills.emptyHint", "Tills appear here once a teller opens one, and stay for the record after they close.")}
        />
      }
    />
  );
}
