import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useListFloorTables, useListFloorTransfers, useListHeldOrders, useListOpenTickets, useListSections,
} from "@/data/api/generated/api";
import { EMPTY_VIEW, GRID, toneFor } from "./util";
import { StatusLegend } from "./status-legend";
import { FloorDefs, SEAT_ALLOWANCE, TableGlyph } from "./table-glyph";
import { TransferQueue } from "./transfer-queue";

/** Poll cadence for the board (TanStack pauses it while the tab is hidden). */
const POLL_MS = 10_000;

const UNASSIGNED = "__unassigned__";

/**
 * Read-only, auto-refreshing view of the floor: table tones mirror live status
 * and occupied tables carry the occupant's chip (held-order name / ticket ref).
 */
export function LiveBoard({ branchId }: { branchId: string }) {
  const { t } = useTranslation();

  const q = { query: { enabled: !!branchId, refetchInterval: POLL_MS } };
  const sectionsQ = useListSections({ branch_id: branchId }, q);
  const tablesQ = useListFloorTables({ branch_id: branchId }, q);
  const heldQ = useListHeldOrders({ branch_id: branchId }, q);
  const transfersQ = useListFloorTransfers({ branch_id: branchId }, q);
  // Occupant resolution is best-effort: without the open_tickets permission the
  // board still renders, just without ticket chips.
  const ticketsQ = useListOpenTickets(
    { branch_id: branchId },
    { query: { enabled: !!branchId, refetchInterval: POLL_MS, retry: false } },
  );

  const sections = useMemo(
    () => [...(sectionsQ.data ?? [])].sort((a, b) => a.ordering - b.ordering || a.name.localeCompare(b.name)),
    [sectionsQ.data],
  );
  const tables = useMemo(() => tablesQ.data ?? [], [tablesQ.data]);
  const heldOrders = useMemo(() => heldQ.data?.held_orders ?? [], [heldQ.data]);
  const transfers = useMemo(() => transfersQ.data?.transfers ?? [], [transfersQ.data]);
  const tickets = useMemo(() => ticketsQ.data ?? [], [ticketsQ.data]);

  /** table id → occupant chip text. Held orders win (they own held tables). */
  const occupants = useMemo(() => {
    const map = new Map<string, string>();
    for (const tk of tickets) {
      if (tk.table_id && (tk.status === "open" || tk.status === "ready")) {
        map.set(tk.table_id, tk.ticket_ref ?? tk.customer_name ?? "#");
      }
    }
    for (const ho of heldOrders) {
      if (ho.table_id && (ho.status === "held" || ho.status === "resumed")) {
        map.set(ho.table_id, ho.name);
      }
    }
    return map;
  }, [tickets, heldOrders]);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const hasUnassigned = tables.some((tb) => !tb.section_id);
  const sectionId = activeKey === UNASSIGNED ? null : (activeKey ?? sections[0]?.id ?? null);

  const visibleTables = useMemo(
    () => tables.filter((tb) => tb.is_active && (tb.section_id ?? null) === sectionId),
    [tables, sectionId],
  );

  /**
   * The board frames whatever is actually THERE, not the section's stored size.
   * The editor's plane is unbounded, so a table may legitimately sit outside
   * that nominal rectangle — framing to it would hide tables the floor is
   * really using. Falls back to the nominal room when the area is empty.
   */
  const frame = useMemo(() => {
    if (visibleTables.length === 0) {
      return EMPTY_VIEW;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const tb of visibleTables) {
      // A rotated table sweeps a wider box; the diagonal is the safe envelope.
      const r = Math.hypot(tb.width, tb.height) / 2;
      const cx = tb.pos_x + tb.width / 2;
      const cy = tb.pos_y + tb.height / 2;
      minX = Math.min(minX, cx - r); minY = Math.min(minY, cy - r);
      maxX = Math.max(maxX, cx + r); maxY = Math.max(maxY, cy + r);
    }
    const pad = SEAT_ALLOWANCE + 24;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }, [visibleTables]);

  if (tablesQ.isLoading || sectionsQ.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {sections.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={s.id === sectionId ? "default" : "outline"}
              aria-current={s.id === sectionId ? "true" : undefined}
              onClick={() => setActiveKey(s.id)}
            >
              {s.name}
            </Button>
          ))}
          {hasUnassigned ? (
            <Button
              size="sm"
              variant={sectionId === null ? "default" : "outline"}
              aria-current={sectionId === null ? "true" : undefined}
              onClick={() => setActiveKey(UNASSIGNED)}
            >
              {t("floor.unassigned", "Unassigned")}
            </Button>
          ) : null}
          <span className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            {t("floor.liveUpdates", "Live · refreshes every few seconds")}
          </span>
        </div>

        <StatusLegend />

        <div className="overflow-hidden rounded-xl border bg-muted/20">
          {visibleTables.length === 0 ? (
            <div className="grid min-h-56 place-items-center p-6 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                {t("floor.boardEmpty", "No tables in this area yet — arrange the floor in the Editor tab.")}
              </p>
            </div>
          ) : (
            <svg
              viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
              className="h-auto w-full select-none"
              style={{ aspectRatio: `${frame.w} / ${frame.h}` }}
              role="img"
              aria-label={t("floor.boardAria", "Live floor map")}
            >
              <defs>
                <pattern id="floorgrid-board" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
                  <path
                    d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`}
                    fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.5"
                  />
                </pattern>
                <FloorDefs />
              </defs>
              <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill="url(#floorgrid-board)" />
              {visibleTables.map((tb) => {
                const occupant = occupants.get(tb.id) ?? null;
                return (
                  <g key={tb.id}>
                    <title>
                      {`${tb.label} · ${tb.seats} ${t("floor.seatsShort", "seats")} · ${t(`floor.tone_${toneFor(tb, occupant)}`)}${occupant ? ` · ${occupant}` : ""}`}
                    </title>
                    <TableGlyph
                      x={tb.pos_x} y={tb.pos_y} w={tb.width} h={tb.height} rotation={tb.rotation}
                      shape={tb.shape} label={tb.label} seats={tb.seats}
                      seatsWord={t("floor.seatsShort", "seats")}
                      status={tb.status}
                      occupant={occupant}
                    />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      <TransferQueue transfers={transfers} tables={tables} sections={sections} />
    </div>
  );
}
