/**
 * Bookings: the host's day. One page, two reads of the same list — a table for
 * working the phone and a timeline by table for seeing the room fill — with
 * create/edit, seat, no-show, cancel and complete in reach.
 *
 * The dashboard authors bookings; the POS seats them. A booking here never
 * touches a table's status: the floor shows the table as reserved from
 * `held_from` and the POS turns it into a ticket. The list refetches on a
 * timer as well as on realtime nudges, so it is right even without the stream.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangle, Armchair, CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight,
  MoreHorizontal, Pencil, Phone, Plus, Settings2, UserX, Users, XCircle,
} from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import type { ColumnDef } from "@tanstack/react-table";
import { ExportButton } from "@/components/app/export-button";
import { StatCard } from "@/components/app/stat-card";
import { DatePicker } from "@/components/app/date-picker";
import { SegmentedControl } from "@/components/app/segmented-control";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  cancelBooking, completeBooking, listBookings, noShowBooking, seatBooking,
  useGetBookingSettings, useListBookings, useListFloorTables,
} from "@/data/api/generated/api";
import type { BookingView } from "@/data/api/generated/models/bookingView";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { useExportLogo } from "@/hooks/use-export-logo";
import { EXPORT_REQUEST } from "@/lib/export-all";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { fmtTime } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

import { CustomerLink } from "@/features/customers/customer-link";
import { useCustomerSheet } from "@/features/customers/use-customer-sheet";

import { BookingDialog } from "./booking-dialog";
import { BookingSettingsDialog } from "./settings-dialog";
import {
  STATUS_TONES, addDays, dayTotals, dayWindow, hourTicks, invalidateBookings, isActive, isHeld, isLate,
  serviceToday, timelineSpan, type BookingStatus,
} from "./util";

type View = "list" | "timeline";
type Filter = "active" | "all" | BookingStatus;

export function BookingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <StatusPill tone={STATUS_TONES[status as BookingStatus] ?? "neutral"}>
      {t(`bookings.status.${status}`, status.replace("_", " "))}
    </StatusPill>
  );
}

export function BookingsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const scope = useScope();
  const branchId = scope.branchId ?? null;

  const [date, setDate] = useState(() => serviceToday());
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<Filter>("active");
  const [editing, setEditing] = useState<BookingView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();

  // The hold and "late" flags flip by the clock, not by an event.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // The guest's name opens the customer who booked.
  const customerSheet = useCustomerSheet();

  const enabled = { query: { enabled: !!branchId } };
  const settingsQ = useGetBookingSettings({ branch_id: branchId ?? "" }, enabled);
  const tablesQ = useListFloorTables({ branch_id: branchId ?? "" }, enabled);
  const listQ = useListBookings(
    { branch_id: branchId ?? "", date },
    { query: { enabled: !!branchId, refetchInterval: 30_000, refetchOnWindowFocus: true } },
  );

  const all = useMemo(() => listQ.data ?? [], [listQ.data]);
  const rows = useMemo(() => {
    if (filter === "all") return all;
    if (filter === "active") return all.filter(isActive);
    return all.filter((b) => b.status === filter);
  }, [all, filter]);
  const totals = useMemo(() => dayTotals(all), [all]);
  const needsTable = useMemo(() => all.filter((b) => b.needs_table), [all]);
  const tables = useMemo(
    () => [...(tablesQ.data ?? [])].filter((x) => x.is_active).sort((a, b) => a.label.localeCompare(b.label)),
    [tablesQ.data],
  );

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (b: BookingView) => { setEditing(b); setDialogOpen(true); };

  const act = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast.success(label);
      await invalidateBookings();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const onSeat = (b: BookingView) => act(t("bookings.seated", "Marked as seated"), () => seatBooking(b.id, {}));
  const onComplete = (b: BookingView) => act(t("bookings.completed", "Booking completed"), () => completeBooking(b.id));
  const onNoShow = async (b: BookingView) => {
    const ok = await confirm({
      title: t("bookings.noShowTitle", "Mark {{name}} as a no-show?", { name: b.guest_name }),
      description: t("bookings.noShowBody", "The table is released for other parties."),
      confirmLabel: t("bookings.noShow", "No-show"),
      destructive: true,
    });
    if (ok) await act(t("bookings.noShowDone", "Marked as no-show"), () => noShowBooking(b.id));
  };
  const onCancel = async (b: BookingView) => {
    const ok = await confirm({
      title: t("bookings.cancelTitle", "Cancel {{name}}'s booking?", { name: b.guest_name }),
      description: t("bookings.cancelBody", "The guest is told by WhatsApp and the table is released."),
      confirmLabel: t("bookings.cancelBooking", "Cancel booking"),
      destructive: true,
    });
    if (ok) await act(t("bookings.cancelled", "Booking cancelled"), () => cancelBooking(b.id, { reason: null, notify_guest: true }));
  };

  // The day's list is one unpaged request, so the export re-runs that request
  // rather than walking pages — but it re-runs it all the same, both to declare
  // the export intent and so a file never reports a list that has since moved.
  // The status filter is the page's own, applied here the way the table does.
  const handleExport = async () => {
    if (!branchId) return;
    setExporting(true);
    try {
      const day = await listBookings({ branch_id: branchId, date }, EXPORT_REQUEST);
      const picked = filter === "all" ? day : filter === "active" ? day.filter(isActive) : day.filter((b) => b.status === filter);
      const cols: ExcelColumn<BookingView>[] = [
        { header: t("bookings.time", "Time"), accessor: (b) => b.starts_at, type: "dateTime", width: 22 },
        { header: t("bookings.endsAt", "Ends"), accessor: (b) => b.ends_at, type: "dateTime", width: 22 },
        { header: t("bookings.guest", "Guest"), accessor: (b) => b.guest_name, type: "text", width: 24 },
        { header: t("bookings.phone", "Phone"), accessor: (b) => formatPhoneDisplay(b.guest_phone), type: "text", width: 18 },
        { header: t("bookings.party", "Party"), accessor: (b) => b.party_size, type: "integer", width: 10 },
        {
          header: t("bookings.tables", "Tables"),
          accessor: (b) => (b.needs_table ? t("bookings.needsTable", "Needs a table") : b.table_labels.join(" + ") || "—"),
          type: "text",
          width: 20,
        },
        { header: t("common.status", "Status"), accessor: (b) => t(`bookings.status.${b.status}`, b.status), type: "text", width: 16 },
        {
          header: t("bookings.source", "Source"),
          accessor: (b) => (b.source === "public" ? t("bookings.online", "Online") : t("bookings.byPhone", "Taken here")),
          type: "text",
          width: 14,
        },
        { header: t("bookings.notes", "Notes"), accessor: (b) => b.notes ?? "", type: "text", width: 36 },
      ];
      const title = t("bookings.title", "Bookings");
      await exportToExcel({
        filename: `Madar-Bookings-${date}`,
        logoUrl,
        meta: date,
        sheets: [{
          name: title,
          title,
          subtitle: filter === "all" ? t("common.all", "All") : filter === "active" ? t("bookings.filterActive", "Active") : t(`bookings.status.${filter}`, filter),
          rows: picked as unknown as Record<string, unknown>[],
          columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
        }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<BookingView>[]>(
    () => [
      {
        id: "time",
        header: t("bookings.time", "Time"),
        meta: { label: t("bookings.time", "Time"), numeric: true, align: "start" },
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <div className="font-medium">{fmtTime(row.original.starts_at)}</div>
            <div className="text-xs text-muted-foreground">{t("bookings.until", "until {{time}}", { time: fmtTime(row.original.ends_at) })}</div>
          </div>
        ),
      },
      {
        id: "guest",
        header: t("bookings.guest", "Guest"),
        meta: { label: t("bookings.guest", "Guest"), phone: "title" },
        cell: ({ row }) => {
          const b = row.original;
          const late = isLate(b, now);
          const held = isHeld(b, now);
          return (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CustomerLink name={b.guest_name} customerId={b.customer_id} control={customerSheet} className="font-medium" />
                {b.source === "public" ? <Badge variant="outline">{t("bookings.online", "Online")}</Badge> : null}
                {late ? (
                  <StatusPill tone="warning" size="sm">{t("bookings.late", "Late")}</StatusPill>
                ) : held ? (
                  <StatusPill tone="warning" size="sm" icon={CalendarClock}>{t("bookings.dueNow", "Due")}</StatusPill>
                ) : null}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone aria-hidden className="size-3" />
                <bdi dir="ltr" className="font-mono tabular-nums">{formatPhoneDisplay(b.guest_phone)}</bdi>
                {b.notes ? <span className="ms-2 max-w-64 truncate" title={b.notes}>· {b.notes}</span> : null}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "party_size",
        header: t("bookings.party", "Party"),
        meta: { label: t("bookings.party", "Party"), numeric: true },
      },
      {
        id: "tables",
        header: t("bookings.tables", "Tables"),
        meta: { label: t("bookings.tables", "Tables") },
        cell: ({ row }) =>
          row.original.needs_table ? (
            <StatusPill tone="warning" size="sm">{t("bookings.needsTable", "Needs a table")}</StatusPill>
          ) : (
            row.original.table_labels.join(" + ") || "—"
          ),
      },
      {
        accessorKey: "status",
        header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the control's two fields, not its per-render object
    [t, now, customerSheet.canOpen, customerSheet.open],
  );

  if (!branchId) {
    return (
      <Page>
        <PageHeader title={t("bookings.title", "Bookings")} />
        <EmptyState icon={CalendarClock} title={t("bookings.pickBranch", "Select a branch in the top bar to see its bookings")} />
      </Page>
    );
  }

  const today = serviceToday();
  const isToday = date === today;

  return (
    <Page>
      <PageHeader
        title={t("bookings.title", "Bookings")}
        description={t("bookings.description", "Reserve tables for guests, then seat them from the POS when they arrive.")}
        actions={
          <>
            <ExportButton onExport={handleExport} loading={exporting} disabled={!all.length} />
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="size-4" />
              {t("bookings.settings", "Settings")}
            </Button>
            <Button onClick={openNew}>
              <Plus className="size-4" />
              {t("bookings.new", "New booking")}
            </Button>
          </>
        }
        below={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-9" onClick={() => setDate(addDays(date, -1))} aria-label={t("common.previous", "Previous")}>
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <DatePicker value={date} onChange={setDate} dateOnly triggerClassName="min-w-40" />
            <Button variant="outline" size="icon" className="size-9" onClick={() => setDate(addDays(date, 1))} aria-label={t("common.next", "Next")}>
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
            {!isToday ? (
              <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
                {t("bookings.today", "Today")}
              </Button>
            ) : null}
          </div>
          <span className="flex-1" />
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: t("bookings.viewList", "List") },
              { value: "timeline", label: t("bookings.viewTimeline", "Timeline") },
            ]}
          />
        </div>
        }
      />

      {settingsQ.data && !settingsQ.data.enabled ? (
        <Alert>
          <CalendarClock className="size-4" />
          <AlertTitle>{t("bookings.onlineOffTitle", "Online booking is off for this branch")}</AlertTitle>
          <AlertDescription>
            {t("bookings.onlineOffBody", "Guests can't book from the website yet. You can still take bookings here. Turn it on in Settings.")}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard dense label={t("bookings.statBookings", "Bookings")} value={totals.total} formatType="number" icon={CalendarDays} loading={listQ.isLoading} />
        <StatCard dense label={t("bookings.statCovers", "Covers seated")} value={totals.covers} formatType="number" icon={Users} loading={listQ.isLoading} />
        <StatCard dense label={t("bookings.statSeated", "Seated now")} value={totals.seated} formatType="number" icon={Armchair} loading={listQ.isLoading} />
        <StatCard dense label={t("bookings.statNoShow", "No-shows")} value={totals.noShow} formatType="number" icon={UserX} accent={totals.noShow > 0 ? "destructive" : "neutral"} loading={listQ.isLoading} />
      </div>

      {needsTable.length > 0 ? (
        <Alert className="border-warning/50">
          <AlertTriangle className="size-4 text-[color-mix(in_oklch,var(--color-warning)_55%,var(--color-foreground))]" />
          <AlertTitle>{t("bookings.needsTableTitle", "{{count}} booking(s) have no table", { count: needsTable.length })}</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 pt-1">
              {needsTable.map((b) => (
                <Button key={b.id} size="sm" variant="outline" onClick={() => openEdit(b)}>
                  <bdi className="font-mono tabular-nums">{fmtTime(b.starts_at)}</bdi> · {b.guest_name} · {b.party_size}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {view === "list" ? (
        <div className="space-y-3">
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={(["active", "all", "confirmed", "seated", "completed", "no_show", "cancelled"] as Filter[]).map((f) => ({
              value: f,
              label: f === "active" ? t("bookings.filterActive", "Active") : f === "all" ? t("common.all", "All") : t(`bookings.status.${f}`, f),
            }))}
          />
          <DataTable
            columns={columns}
            data={rows}
            loading={listQ.isLoading}
            error={listQ.error}
            onRetry={() => void listQ.refetch()}
            getRowId={(b) => b.id}
            onRowClick={(b) => (isActive(b) ? openEdit(b) : undefined)}
            pageSize={50}
            hideViewOptions
            emptyState={
              <EmptyState
                icon={CalendarClock}
                title={all.length === 0 ? t("bookings.emptyDay", "No bookings for this day") : t("bookings.emptyFilter", "Nothing matches this filter")}
                description={all.length === 0 ? t("bookings.emptyHint", "Take one by phone with “New booking”, or turn on online booking in Settings.") : undefined}
                action={all.length === 0 ? <Button onClick={openNew}><Plus className="size-4" />{t("bookings.new", "New booking")}</Button> : undefined}
              />
            }
            rowActions={(b) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={t("common.actions", "Actions")}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isActive(b) ? (
                    <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="size-4" />{t("common.edit", "Edit")}</DropdownMenuItem>
                  ) : null}
                  {b.status === "confirmed" ? (
                    <DropdownMenuItem onClick={() => void onSeat(b)}><Armchair className="size-4" />{t("bookings.seat", "Mark seated")}</DropdownMenuItem>
                  ) : null}
                  {b.status === "seated" ? (
                    <DropdownMenuItem onClick={() => void onComplete(b)}><Check className="size-4" />{t("bookings.complete", "Complete")}</DropdownMenuItem>
                  ) : null}
                  {b.status === "confirmed" ? (
                    <DropdownMenuItem onClick={() => void onNoShow(b)}><UserX className="size-4" />{t("bookings.noShow", "No-show")}</DropdownMenuItem>
                  ) : null}
                  {isActive(b) ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => void onCancel(b)}><XCircle className="size-4" />{t("bookings.cancelBooking", "Cancel booking")}</DropdownMenuItem>
                    </>
                  ) : null}
                  {!isActive(b) ? (
                    <DropdownMenuItem disabled>{t(`bookings.status.${b.status}`, b.status)}</DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </div>
      ) : (
        <Timeline
          date={date}
          bookings={all.filter(isActive)}
          tables={tables.map((x) => ({ id: x.id, label: x.label, seats: x.seats }))}
          window={dayWindow(settingsQ.data, date)}
          now={now}
          onOpen={openEdit}
        />
      )}

      <BookingDialog
        branchId={branchId}
        date={date}
        booking={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        settings={settingsQ.data}
        tables={tables}
      />
      <BookingSettingsDialog branchId={branchId} open={settingsOpen} onOpenChange={setSettingsOpen} />
      {customerSheet.sheet}
    </Page>
  );
}

/** Rows per table, columns across the day's booking window. */
function Timeline({
  date, bookings, tables, window, now, onOpen,
}: {
  date: string;
  bookings: BookingView[];
  tables: { id: string; label: string; seats: number }[];
  window: { open: number; close: number };
  now: Date;
  onOpen: (b: BookingView) => void;
}) {
  const { t } = useTranslation();
  const ticks = hourTicks(window);
  const unassigned = bookings.filter((b) => b.table_ids.length === 0);
  const byTable = (id: string) => bookings.filter((b) => b.table_ids.includes(id));
  const rows = [
    ...tables.map((tb) => ({ key: tb.id, label: `${tb.label} · ${tb.seats}`, items: byTable(tb.id) })),
    ...(unassigned.length ? [{ key: "__none", label: t("bookings.needsTable", "Needs a table"), items: unassigned }] : []),
  ];
  if (tables.length === 0) {
    return <EmptyState icon={Armchair} title={t("bookings.noTables", "This branch has no tables yet")} description={t("bookings.noTablesHint", "Draw the floor first; bookings claim its tables.")} />;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <div className="min-w-[720px]">
        <div className="flex border-b bg-muted/40 text-xs text-muted-foreground">
          <div className="w-32 shrink-0 border-e px-2 py-1.5">{t("bookings.table", "Table")}</div>
          <div className="relative h-7 flex-1">
            {ticks.map((tk) => (
              <span key={tk.label} className="absolute top-1.5 font-mono tabular-nums -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${tk.left}%` }}>{tk.label}</span>
            ))}
          </div>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="flex border-b last:border-b-0">
            <div className="w-32 shrink-0 truncate border-e px-2 py-2 text-sm font-medium">{row.label}</div>
            <div className="relative h-11 flex-1">
              {ticks.map((tk) => (
                <span key={tk.label} aria-hidden className="absolute inset-y-0 border-s border-border/40" style={{ insetInlineStart: `${tk.left}%` }} />
              ))}
              {row.items.map((b) => {
                const span = timelineSpan(b, date, window);
                const tone = b.status === "seated" ? "border-foreground/30 bg-secondary text-foreground" : isHeld(b, now) ? "border-warning/60 bg-warning/14 text-[color-mix(in_oklch,var(--color-warning)_55%,var(--color-foreground))]" : "border-border bg-accent text-foreground";
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onOpen(b)}
                    title={`${b.guest_name} · ${b.party_size} · ${fmtTime(b.starts_at)}–${fmtTime(b.ends_at)}`}
                    className={cn("absolute top-1.5 h-8 truncate rounded-md border px-2 text-start text-xs font-medium transition-colors duration-150 hover:brightness-95 motion-reduce:transition-none", tone)}
                    style={{ insetInlineStart: `${span.left}%`, width: `${span.width}%` }}
                  >
                    {b.status === "seated" ? <Armchair aria-hidden className="me-1 inline size-3" /> : isHeld(b, now) ? <CalendarClock aria-hidden className="me-1 inline size-3" /> : null}
                    {b.guest_name} · {b.party_size}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
