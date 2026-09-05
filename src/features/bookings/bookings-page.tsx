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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  cancelBooking, completeBooking, noShowBooking, seatBooking,
  useGetBookingSettings, useListBookings, useListFloorTables,
} from "@/data/api/generated/api";
import type { BookingView } from "@/data/api/generated/models/bookingView";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { BookingDialog } from "./booking-dialog";
import { BookingSettingsDialog } from "./settings-dialog";
import {
  STATUS_STYLES, addDays, dayTotals, dayWindow, hourTicks, invalidateBookings, isActive, isHeld, isLate,
  serviceToday, timelineSpan, type BookingStatus,
} from "./util";

type View = "list" | "timeline";
type Filter = "active" | "all" | BookingStatus;

export function BookingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="secondary" className={cn(STATUS_STYLES[status as BookingStatus] ?? "")}>
      {t(`bookings.status.${status}`, status.replace("_", " "))}
    </Badge>
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

  // The hold and "late" flags flip by the clock, not by an event.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

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

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => setDate(addDays(date, -1))} aria-label={t("common.previous", "Previous")}>
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <DatePicker value={date} onChange={setDate} dateOnly triggerClassName="min-w-40" />
          <Button variant="outline" size="icon" className="size-8" onClick={() => setDate(addDays(date, 1))} aria-label={t("common.next", "Next")}>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard dense label={t("bookings.statBookings", "Bookings")} value={totals.total} formatType="number" icon={CalendarDays} loading={listQ.isLoading} />
        <StatCard dense label={t("bookings.statCovers", "Covers seated")} value={totals.covers} formatType="number" icon={Users} accent="primary" loading={listQ.isLoading} />
        <StatCard dense label={t("bookings.statSeated", "Seated now")} value={totals.seated} formatType="number" icon={Armchair} accent="success" loading={listQ.isLoading} />
        <StatCard dense label={t("bookings.statNoShow", "No-shows")} value={totals.noShow} formatType="number" icon={UserX} accent={totals.noShow > 0 ? "destructive" : "neutral"} loading={listQ.isLoading} />
      </div>

      {needsTable.length > 0 ? (
        <Alert className="border-warning/50">
          <AlertTriangle className="size-4 text-warning" />
          <AlertTitle>{t("bookings.needsTableTitle", "{{count}} booking(s) have no table", { count: needsTable.length })}</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 pt-1">
              {needsTable.map((b) => (
                <Button key={b.id} size="sm" variant="outline" onClick={() => openEdit(b)}>
                  {fmtTime(b.starts_at)} · {b.guest_name} · {b.party_size}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {view === "list" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(["active", "all", "confirmed", "seated", "completed", "no_show", "cancelled"] as Filter[]).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "secondary" : "ghost"} onClick={() => setFilter(f)}>
                {f === "active" ? t("bookings.filterActive", "Active") : f === "all" ? t("common.all", "All") : t(`bookings.status.${f}`, f)}
              </Button>
            ))}
          </div>
          {listQ.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={all.length === 0 ? t("bookings.emptyDay", "No bookings for this day") : t("bookings.emptyFilter", "Nothing matches this filter")}
              description={all.length === 0 ? t("bookings.emptyHint", "Take one by phone with “New booking”, or turn on online booking in Settings.") : undefined}
              action={all.length === 0 ? <Button onClick={openNew}><Plus className="size-4" />{t("bookings.new", "New booking")}</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("bookings.time", "Time")}</TableHead>
                    <TableHead>{t("bookings.guest", "Guest")}</TableHead>
                    <TableHead className="text-end">{t("bookings.party", "Party")}</TableHead>
                    <TableHead>{t("bookings.tables", "Tables")}</TableHead>
                    <TableHead>{t("common.status", "Status")}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((b) => {
                    const late = isLate(b, now);
                    const held = isHeld(b, now);
                    return (
                      <TableRow key={b.id} className={cn(!isActive(b) && "text-muted-foreground")}>
                        <TableCell className="tabular whitespace-nowrap">
                          <div className="font-medium">{fmtTime(b.starts_at)}</div>
                          <div className="text-xs text-muted-foreground">{t("bookings.until", "until {{time}}", { time: fmtTime(b.ends_at) })}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{b.guest_name}</span>
                            {b.source === "public" ? <Badge variant="outline">{t("bookings.online", "Online")}</Badge> : null}
                            {late ? <Badge variant="secondary" className="bg-warning/10 text-warning">{t("bookings.late", "Late")}</Badge> : held ? <Badge variant="secondary" className="bg-warning/10 text-warning">{t("bookings.dueNow", "Due")}</Badge> : null}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
                            <Phone className="size-3" />+{b.guest_phone}
                            {b.notes ? <span className="ms-2 truncate max-w-64" title={b.notes}>· {b.notes}</span> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-end tabular">{b.party_size}</TableCell>
                        <TableCell>
                          {b.needs_table ? (
                            <Badge variant="secondary" className="bg-warning/10 text-warning">{t("bookings.needsTable", "Needs a table")}</Badge>
                          ) : (
                            b.table_labels.join(" + ") || "—"
                          )}
                        </TableCell>
                        <TableCell><BookingStatusBadge status={b.status} /></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label={t("common.actions", "Actions")}>
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
                                  <DropdownMenuItem className="text-destructive" onClick={() => void onCancel(b)}><XCircle className="size-4" />{t("bookings.cancelBooking", "Cancel booking")}</DropdownMenuItem>
                                </>
                              ) : null}
                              {!isActive(b) ? (
                                <DropdownMenuItem disabled>{t(`bookings.status.${b.status}`, b.status)}</DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
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
    <div className="overflow-x-auto rounded-lg border">
      <div className="min-w-[720px]">
        <div className="flex border-b bg-muted/40 text-xs text-muted-foreground">
          <div className="w-32 shrink-0 border-e px-2 py-1.5">{t("bookings.table", "Table")}</div>
          <div className="relative h-7 flex-1">
            {ticks.map((tk) => (
              <span key={tk.label} className="absolute top-1.5 -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${tk.left}%` }}>{tk.label}</span>
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
                const tone = b.status === "seated" ? "bg-primary/15 border-primary text-primary" : isHeld(b, now) ? "bg-warning/15 border-warning text-warning" : "bg-info/10 border-info/60 text-info";
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onOpen(b)}
                    title={`${b.guest_name} · ${b.party_size} · ${fmtTime(b.starts_at)}–${fmtTime(b.ends_at)}`}
                    className={cn("absolute top-1.5 h-8 truncate rounded-md border px-2 text-start text-xs font-medium", tone)}
                    style={{ insetInlineStart: `${span.left}%`, width: `${span.width}%` }}
                  >
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
