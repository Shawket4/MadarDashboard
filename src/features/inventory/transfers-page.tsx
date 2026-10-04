import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight, ArrowRight, PackageSearch, PlusCircle, Warehouse } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import type { StockTransfer, TransferDifferenceRow, TransferLineInput } from "@/data/api/generated/models";
import { listTransfers, useListBranches, useListTransfers, useTransferDifferences } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime, fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { EXPORT_REQUEST, fetchAllPages } from "@/lib/export-all";
import { TransferDialog } from "./transfer-dialog";
import { TransferDrawer, transferStatusLabel } from "./transfer-drawer";
import { ReplenishDialog } from "./replenish-dialog";
import { TRANSFER_TONES } from "./lib";

type Direction = "all" | "incoming" | "outgoing";
type Tab = "all" | "requested" | "draft" | "dispatched" | "received" | "cancelled" | "differences";

const lineSummary = (tr: StockTransfer) =>
  tr.lines.length === 1
    ? `${tr.lines[0].ingredient_name} · ${fmtNumber(tr.lines[0].qty_sent)} ${fmtUnit(tr.lines[0].unit)}`
    : tr.lines.map((l) => l.ingredient_name).join(", ");

export function TransfersPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { can } = useAuthz();
  const { branchId, scopeBranchId, from, to } = useScope();
  const [dir, setDir] = useState<Direction>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ dest: string; lines: TransferLineInput[] } | null>(null);
  const [replenishOpen, setReplenishOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();

  // The server lists the locations this person works at (owners: all), which
  // is exactly the set of sides they can act for.
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const active = useMemo(() => (branches.data ?? []).filter((b) => b.is_active), [branches.data]);
  const myBranchIds = useMemo(() => new Set(active.map((b) => b.id)), [active]);
  const here = active.find((b) => b.id === branchId) ?? null;
  const selling = useMemo(() => active.filter((b) => b.kind !== "warehouse"), [active]);

  const status = tab === "all" || tab === "differences" ? undefined : tab;
  const transfers = useListTransfers(
    scopeBranchId,
    { direction: dir === "all" ? undefined : dir, status },
    { query: { enabled: !!scopeBranchId && tab !== "differences" } },
  );
  const diffs = useTransferDifferences(
    orgId ?? "",
    { from: from ?? undefined, to: to ?? undefined },
    { query: { enabled: !!orgId && tab === "differences" } },
  );
  const opened = (transfers.data ?? []).find((x) => x.id === openId) ?? null;
  const [openedSnapshot, setOpenedSnapshot] = useState<StockTransfer | null>(null);
  const drawerTransfer = opened ?? (openedSnapshot?.id === openId ? openedSnapshot : null);

  const columns = useMemo<ColumnDef<StockTransfer>[]>(
    () => [
      {
        accessorKey: "reference",
        header: t("inventory.transfers.reference", "Ref"),
        meta: { label: t("inventory.transfers.reference", "Ref"), phone: "title" },
        cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.reference}</span>,
      },
      {
        id: "date",
        header: t("common.date", "Date"),
        meta: { label: t("common.date", "Date"), numeric: true, align: "start" },
        cell: ({ row }) => fmtDateTime((row.original.received ?? row.original.dispatched ?? row.original.created).at),
      },
      {
        id: "route",
        header: t("inventory.transfers.direction", "Direction"),
        meta: { label: t("inventory.transfers.direction", "Direction") },
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-sm">
            {row.original.source_kind === "warehouse" ? <Warehouse className="size-3.5 text-muted-foreground" /> : null}
            {row.original.source_branch_name}
            <ArrowRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
            {row.original.destination_kind === "warehouse" ? <Warehouse className="size-3.5 text-muted-foreground" /> : null}
            {row.original.destination_branch_name}
          </span>
        ),
      },
      {
        id: "items",
        header: t("inventory.transfers.items", "Items"),
        meta: { label: t("inventory.transfers.items", "Items") },
        cell: ({ row }) => <span className="line-clamp-1 max-w-72 text-sm">{lineSummary(row.original)}</span>,
      },
      {
        accessorKey: "status",
        header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) => <StatusPill tone={TRANSFER_TONES[row.original.status] ?? "neutral"}>{transferStatusLabel(t, row.original.status)}</StatusPill>,
      },
    ],
    [t],
  );

  const diffColumns = useMemo<ColumnDef<TransferDifferenceRow>[]>(
    () => [
      { accessorKey: "reference", header: t("inventory.transfers.reference", "Ref"), meta: { label: t("inventory.transfers.reference", "Ref"), phone: "title" }, cell: ({ row }) => <span className="font-mono text-sm">{row.original.reference}</span> },
      { accessorKey: "received_at", header: t("inventory.transfers.received", "Received"), meta: { label: t("inventory.transfers.received", "Received"), numeric: true, align: "start" }, cell: ({ row }) => fmtDateTime(row.original.received_at) },
      { id: "route", header: t("inventory.transfers.direction", "Direction"), meta: { label: t("inventory.transfers.direction", "Direction") }, cell: ({ row }) => `${row.original.source_branch_name} → ${row.original.destination_branch_name}` },
      { accessorKey: "ingredient_name", header: t("inventory.transfers.ingredient", "Ingredient"), meta: { label: t("inventory.transfers.ingredient", "Ingredient") } },
      { accessorKey: "difference", header: t("inventory.transfers.difference", "Difference"), meta: { label: t("inventory.transfers.difference", "Difference"), numeric: true }, cell: ({ row }) => `${row.original.difference > 0 ? "+" : ""}${fmtNumber(row.original.difference)} ${fmtUnit(row.original.unit)}` },
      { accessorKey: "value_difference", header: t("inventory.transfers.value", "Value"), meta: { label: t("inventory.transfers.value", "Value"), numeric: true }, cell: ({ row }) => fmtMoney(row.original.value_difference, { signed: true }) },
      { accessorKey: "note", header: t("inventory.transfers.note", "Note"), meta: { label: t("inventory.transfers.note", "Note") }, cell: ({ row }) => row.original.note ?? "—" },
    ],
    [t],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages<StockTransfer>(async (offset, limit) => ({
        rows: await listTransfers(scopeBranchId, { direction: dir === "all" ? undefined : dir, status, limit, offset }, EXPORT_REQUEST),
      }));
      // One row per line: a spreadsheet wants quantities it can sum.
      const flat = rows.flatMap((tr) => tr.lines.map((l) => ({ tr, l })));
      type Row = (typeof flat)[number];
      const cols: ExcelColumn<Row>[] = [
        { header: t("inventory.transfers.reference", "Ref"), accessor: (r) => r.tr.reference, type: "text", width: 10 },
        { header: t("common.date", "Date"), accessor: (r) => r.tr.created.at, type: "dateTime", width: 20 },
        { header: t("common.status", "Status"), accessor: (r) => transferStatusLabel(t, r.tr.status), type: "text", width: 12 },
        { header: t("inventory.transfers.from", "From"), accessor: (r) => r.tr.source_branch_name, type: "text", width: 22 },
        { header: t("inventory.transfers.to", "To"), accessor: (r) => r.tr.destination_branch_name, type: "text", width: 22 },
        { header: t("inventory.transfers.ingredient", "Ingredient"), accessor: (r) => r.l.ingredient_name, type: "text", width: 26 },
        { header: t("inventory.transfers.sent", "Sent"), accessor: (r) => r.l.qty_sent, type: "number", width: 10 },
        { header: t("inventory.transfers.received", "Received"), accessor: (r) => r.l.qty_received ?? "", type: "number", width: 10 },
        { header: t("inventory.catalog.unit", "Unit"), accessor: (r) => fmtUnit(r.l.unit), type: "text", width: 8 },
        { header: t("inventory.transfers.note", "Note"), accessor: (r) => r.tr.note ?? "", type: "text", width: 30 },
      ];
      await exportToExcel({ filename: "Madar-Transfers", logoUrl, sheets: [{ name: t("inventory.transfers.title", "Transfers"), title: t("inventory.transfers.title", "Transfers"), rows: flat as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const canCreate = can(Cap.inventoryTransfersCreate) && active.length >= 2;

  return (
    <Page>
      <PageHeader
        title={t("inventory.transfers.title", "Transfers")}
        actions={
          <>
            <ExportButton onExport={handleExport} loading={exporting} disabled={tab === "differences" || !(transfers.data?.length)} />
            {here?.kind === "warehouse" && canCreate && selling.length ? (
              <Button variant="outline" onClick={() => setReplenishOpen(true)}>
                <PackageSearch className="size-4" />
                {t("inventory.transfers.replenish", "Replenish a branch")}
              </Button>
            ) : null}
            {canCreate ? (
              <Button onClick={() => { setPrefill(null); setNewOpen(true); }}>
                <PlusCircle className="size-4" />
                {t("inventory.transfers.create", "New transfer")}
              </Button>
            ) : null}
          </>
        }
        below={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<Tab>
              value={tab}
              onChange={setTab}
              aria-label={t("common.status", "Status")}
              options={[
                { value: "all", label: t("inventory.transfers.all", "All transfers") },
                { value: "requested", label: t("inventory.transfers.status.requested", "Requested") },
                { value: "draft", label: t("inventory.transfers.status.draft", "Draft") },
                { value: "dispatched", label: t("inventory.transfers.status.dispatched", "In transit") },
                { value: "received", label: t("inventory.transfers.status.received", "Received") },
                { value: "cancelled", label: t("inventory.transfers.status.cancelled", "Cancelled") },
                { value: "differences", label: t("inventory.transfers.differences", "Differences") },
              ]}
            />
            {tab !== "differences" ? (
              <SegmentedControl<Direction>
                value={dir}
                onChange={setDir}
                aria-label={t("inventory.transfers.direction", "Direction")}
                options={[
                  { value: "all", label: t("inventory.transfers.bothWays", "Both ways") },
                  { value: "incoming", label: t("inventory.transfers.incoming", "Incoming") },
                  { value: "outgoing", label: t("inventory.transfers.outgoing", "Outgoing") },
                ]}
              />
            ) : null}
          </div>
        }
      />

      {tab === "differences" ? (
        <DataTable
          columns={diffColumns}
          data={diffs.data ?? []}
          loading={diffs.isLoading}
          error={diffs.error}
          onRetry={() => void diffs.refetch()}
          getRowId={(r) => `${r.transfer_id}:${r.org_ingredient_id}`}
          emptyState={<EmptyState icon={ArrowLeftRight} title={t("inventory.transfers.noDifferences", "Everything arrived as sent")} description={t("inventory.transfers.noDifferencesHint", "Received transfers whose quantities differ from what was sent show up here.")} />}
        />
      ) : (
        <DataTable
          columns={columns}
          data={transfers.data ?? []}
          loading={transfers.isLoading}
          error={transfers.error}
          onRetry={() => void transfers.refetch()}
          getRowId={(tr) => tr.id}
          onRowClick={(tr) => { setOpenedSnapshot(tr); setOpenId(tr.id); }}
          emptyState={<EmptyState icon={ArrowLeftRight} title={t("inventory.transfers.noTransfers", "No transfers found")} />}
        />
      )}

      <TransferDrawer
        transfer={drawerTransfer}
        onOpenChange={(o) => !o && setOpenId(null)}
        onChanged={(tr) => { setOpenedSnapshot(tr); setOpenId(tr.id); }}
        branches={active}
        myBranchIds={myBranchIds}
      />

      <TransferDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        branches={active}
        myBranchIds={myBranchIds}
        defaultSourceId={here?.id ?? null}
        defaultDestinationId={prefill?.dest ?? null}
        prefillLines={prefill?.lines}
        onDone={(tr) => { setOpenedSnapshot(tr); setOpenId(tr.id); }}
      />

      {here?.kind === "warehouse" ? (
        <ReplenishDialog
          open={replenishOpen}
          onOpenChange={setReplenishOpen}
          warehouse={here}
          branches={selling}
          onPick={(dest, lines) => { setReplenishOpen(false); setPrefill({ dest, lines }); setNewOpen(true); }}
        />
      ) : null}
    </Page>
  );
}
