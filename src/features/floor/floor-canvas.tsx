/**
 * The floor itself: one canvas, always live.
 *
 * There is no separate "live board" and "editor" any more. A floor plan is one
 * thing — the room — and splitting it across two tabs meant checking whether a
 * table was free and moving it were different places, with the same drawing
 * rendered twice from two code paths.
 *
 * Editing is behind a lock instead. Status is always visible; handles appear
 * only when you ask for them, so nobody nudges a table into the wall while
 * glancing at the room mid-service.
 */
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { FloorTable } from "@/data/api/generated/models";
import { FloorDefs, TableGlyph } from "./table-glyph";
import type { FloorViewport } from "./use-floor-viewport";
import {
  GRID, MIN_TABLE_SIZE, ROTATION_STEP, marqueeHits, normalizeAngle, snapTo,
  type GeoItem, type Rect,
} from "./util";

type Corner = "nw" | "ne" | "se" | "sw";
const CORNERS: Corner[] = ["nw", "ne", "se", "sw"];
const CORNER_SIGN: Record<Corner, { x: number; y: number }> = {
  nw: { x: -1, y: -1 },
  ne: { x: 1, y: -1 },
  se: { x: 1, y: 1 },
  sw: { x: -1, y: 1 },
};
const CORNER_CURSOR: Record<Corner, string> = {
  nw: "nwse-resize", ne: "nesw-resize", se: "nwse-resize", sw: "nesw-resize",
};

const rotatePoint = (p: { x: number; y: number }, theta: number) => ({
  x: p.x * Math.cos(theta) - p.y * Math.sin(theta),
  y: p.x * Math.sin(theta) + p.y * Math.cos(theta),
});

type Interaction =
  | { kind: "drag"; from: { x: number; y: number }; origin: Map<string, GeoItem>; moved: boolean }
  | { kind: "resize"; id: string; sign: { x: number; y: number }; theta: number; fixed: { x: number; y: number }; rot: number }
  | { kind: "rotate"; id: string; cx: number; cy: number }
  | { kind: "pan"; clientX: number; clientY: number }
  | { kind: "marquee"; from: { x: number; y: number } };

export interface FloorCanvasProps {
  tables: FloorTable[];
  geoOf: (t: FloorTable) => GeoItem;
  occupants: Map<string, string>;
  selection: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  /** Editing enabled? When false the canvas is pan/zoom only. */
  editable: boolean;
  viewport: FloorViewport;
  beginGesture: () => void;
  onGeoChange: (updates: GeoItem[]) => void;
  className?: string;
}

export function FloorCanvas({
  tables, geoOf, occupants, selection, onSelectionChange,
  editable, viewport, beginGesture, onGeoChange, className,
}: FloorCanvasProps) {
  const { t } = useTranslation();
  const interaction = useRef<Interaction | null>(null);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const { rect, toWorld } = viewport;

  const byId = useCallback(
    (id: string) => tables.find((tb) => tb.id === id),
    [tables],
  );

  /** ⌥/Alt bypasses the grid. Snapping is otherwise always on — a toggle for
   *  it was one more decision for no benefit, and off-grid was almost never
   *  what anyone wanted. */
  const snap = (v: number, e: { altKey: boolean }) => snapTo(v, !e.altKey, GRID);

  // ── Pointer handling ──────────────────────────────────────────────────────

  const onPointerDownTable = (e: React.PointerEvent, tb: FloorTable) => {
    if (viewport.trackPointerDown(e)) return;
    if (!editable) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    // Shift extends; a plain click on an unselected table replaces. Clicking a
    // table already in the selection keeps the whole group, so dragging a
    // multi-selection does not collapse it to one.
    let next = selection;
    if (e.shiftKey) {
      next = new Set(selection);
      if (next.has(tb.id)) next.delete(tb.id);
      else next.add(tb.id);
      onSelectionChange(next);
      return;
    }
    if (!selection.has(tb.id)) {
      next = new Set([tb.id]);
      onSelectionChange(next);
    }

    beginGesture();
    const origin = new Map<string, GeoItem>();
    for (const id of next) {
      const table = byId(id);
      if (table) origin.set(id, geoOf(table));
    }
    interaction.current = {
      kind: "drag", from: toWorld(e.clientX, e.clientY), origin, moved: false,
    };
  };

  const onPointerDownEmpty = (e: React.PointerEvent) => {
    if (viewport.trackPointerDown(e)) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    // Pan when there is nothing to select into: a locked canvas, a middle-drag,
    // or a finger. Left-drag on an unlocked canvas draws a marquee instead.
    if (!editable || e.button === 1 || e.pointerType === "touch") {
      interaction.current = { kind: "pan", clientX: e.clientX, clientY: e.clientY };
      return;
    }

    if (!e.shiftKey) onSelectionChange(new Set());
    interaction.current = { kind: "marquee", from: toWorld(e.clientX, e.clientY) };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (viewport.trackPointerMove(e)) return;
    const it = interaction.current;
    if (!it) return;

    if (it.kind === "pan") {
      viewport.panBy(it.clientX - e.clientX, it.clientY - e.clientY);
      interaction.current = { ...it, clientX: e.clientX, clientY: e.clientY };
      return;
    }

    const p = toWorld(e.clientX, e.clientY);

    if (it.kind === "marquee") {
      setMarquee({ x: it.from.x, y: it.from.y, w: p.x - it.from.x, h: p.y - it.from.y });
      return;
    }

    if (it.kind === "drag") {
      const dx = p.x - it.from.x;
      const dy = p.y - it.from.y;
      const updates: GeoItem[] = [];
      for (const g of it.origin.values()) {
        updates.push({ ...g, x: snap(g.x + dx, e), y: snap(g.y + dy, e) });
      }
      interaction.current = { ...it, moved: true };
      onGeoChange(updates);
      return;
    }

    const table = byId(it.id);
    if (!table) return;
    const g = geoOf(table);

    if (it.kind === "rotate") {
      const deg = (Math.atan2(p.y - it.cy, p.x - it.cx) * 180) / Math.PI + 90;
      const rot = e.altKey ? deg : Math.round(deg / ROTATION_STEP) * ROTATION_STEP;
      onGeoChange([{ ...g, rot: normalizeAngle(rot) }]);
      return;
    }

    if (it.kind === "resize") {
      // Work in the table's own frame so a rotated table resizes along its own
      // edges rather than the screen's.
      const local = rotatePoint({ x: p.x - it.fixed.x, y: p.y - it.fixed.y }, -it.theta);
      const w = Math.max(MIN_TABLE_SIZE, snap(Math.abs(local.x), e));
      const h = Math.max(MIN_TABLE_SIZE, snap(Math.abs(local.y), e));
      // Keep the opposite corner pinned: grow away from it, never through it.
      const centreLocal = { x: (it.sign.x * w) / 2, y: (it.sign.y * h) / 2 };
      const centre = rotatePoint(centreLocal, it.theta);
      onGeoChange([
        { ...g, w, h, x: it.fixed.x + centre.x - w / 2, y: it.fixed.y + centre.y - h / 2 },
      ]);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    viewport.trackPointerUp(e);
    const it = interaction.current;
    interaction.current = null;

    if (it?.kind === "marquee" && marquee) {
      const hits = marqueeHits(marquee, tables.map(geoOf));
      const next = e.shiftKey ? new Set([...selection, ...hits]) : new Set(hits);
      onSelectionChange(next);
    }
    setMarquee(null);
  };

  const startResize = (e: React.PointerEvent, tb: FloorTable, corner: Corner) => {
    e.preventDefault();
    e.stopPropagation();
    beginGesture();
    (e.target as Element).setPointerCapture(e.pointerId);
    const g = geoOf(tb);
    const theta = (g.rot * Math.PI) / 180;
    const cx = g.x + g.w / 2;
    const cy = g.y + g.h / 2;
    const sign = CORNER_SIGN[corner];
    // The corner diagonally opposite stays put for the whole gesture.
    const opp = rotatePoint({ x: (-sign.x * g.w) / 2, y: (-sign.y * g.h) / 2 }, theta);
    interaction.current = {
      kind: "resize", id: tb.id, sign, theta,
      fixed: { x: cx + opp.x, y: cy + opp.y }, rot: g.rot,
    };
  };

  const startRotate = (e: React.PointerEvent, tb: FloorTable) => {
    e.preventDefault();
    e.stopPropagation();
    beginGesture();
    (e.target as Element).setPointerCapture(e.pointerId);
    const g = geoOf(tb);
    interaction.current = {
      kind: "rotate", id: tb.id, cx: g.x + g.w / 2, cy: g.y + g.h / 2,
    };
  };

  const soleSelected = selection.size === 1 ? byId([...selection][0]) : undefined;
  const handleScale = 1 / viewport.view.zoom;

  return (
    <svg
      viewBox={`${rect.x} ${rect.y} ${rect.w} ${rect.h}`}
      className={cn(
        "h-full w-full touch-none select-none",
        editable ? "cursor-default" : "cursor-grab",
        className,
      )}
      role="img"
      aria-label={t("floor.canvasAria", "Floor map")}
      onPointerDown={onPointerDownEmpty}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <defs>
        <pattern
          id="floor-grid"
          width={GRID * 5}
          height={GRID * 5}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={handleScale}
            opacity="0.5"
          />
        </pattern>
        <FloorDefs />
      </defs>

      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill="url(#floor-grid)" />

      {tables.map((tb) => {
        const g = geoOf(tb);
        const occupant = occupants.get(tb.id) ?? null;
        const isSelected = selection.has(tb.id);
        return (
          <g key={tb.id} onPointerDown={(e) => onPointerDownTable(e, tb)}>
            <title>
              {`${tb.label} · ${tb.seats} ${t("floor.seatsShort", "seats")}${occupant ? ` · ${occupant}` : ""}`}
            </title>
            <TableGlyph
              x={g.x} y={g.y} w={g.w} h={g.h} rotation={g.rot}
              shape={tb.shape} label={tb.label} seats={tb.seats}
              seatsWord={t("floor.seatsShort", "seats")}
              status={tb.status}
              occupant={occupant}
            />
            {isSelected ? (
              <rect
                x={g.x - 4} y={g.y - 4} width={g.w + 8} height={g.h + 8}
                transform={`rotate(${g.rot} ${g.x + g.w / 2} ${g.y + g.h / 2})`}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth={2 * handleScale}
                strokeDasharray={`${6 * handleScale} ${4 * handleScale}`}
                pointerEvents="none"
              />
            ) : null}
          </g>
        );
      })}

      {/* Handles only for a single selection: a resize handle on a group would
          have to mean "scale the room", which nobody wants to do to a floor. */}
      {editable && soleSelected ? (
        <SelectionHandles
          geo={geoOf(soleSelected)}
          scale={handleScale}
          onResizeStart={(e, corner) => startResize(e, soleSelected, corner)}
          onRotateStart={(e) => startRotate(e, soleSelected)}
        />
      ) : null}

      {marquee ? (
        <rect
          x={marquee.w < 0 ? marquee.x + marquee.w : marquee.x}
          y={marquee.h < 0 ? marquee.y + marquee.h : marquee.y}
          width={Math.abs(marquee.w)}
          height={Math.abs(marquee.h)}
          fill="var(--color-primary)"
          fillOpacity={0.08}
          stroke="var(--color-primary)"
          strokeWidth={handleScale}
          pointerEvents="none"
        />
      ) : null}
    </svg>
  );
}

/**
 * Resize and rotate affordances for a single selected table.
 *
 * Sized in inverse proportion to the zoom, so a handle is the same number of
 * SCREEN pixels at every scale — otherwise they become unusable specks when
 * you zoom out to see the whole room.
 */
function SelectionHandles({
  geo, scale, onResizeStart, onRotateStart,
}: {
  geo: GeoItem;
  scale: number;
  onResizeStart: (e: React.PointerEvent, corner: Corner) => void;
  onRotateStart: (e: React.PointerEvent) => void;
}) {
  const cx = geo.x + geo.w / 2;
  const cy = geo.y + geo.h / 2;
  const r = 6 * scale;
  const armLength = 28 * scale;

  return (
    <g transform={`rotate(${geo.rot} ${cx} ${cy})`}>
      {CORNERS.map((corner) => {
        const sign = CORNER_SIGN[corner];
        return (
          <rect
            key={corner}
            x={cx + (sign.x * geo.w) / 2 - r}
            y={cy + (sign.y * geo.h) / 2 - r}
            width={r * 2}
            height={r * 2}
            rx={2 * scale}
            fill="var(--color-background)"
            stroke="var(--color-primary)"
            strokeWidth={1.5 * scale}
            style={{ cursor: CORNER_CURSOR[corner] }}
            onPointerDown={(e) => onResizeStart(e, corner)}
          />
        );
      })}
      <line
        x1={cx}
        y1={geo.y}
        x2={cx}
        y2={geo.y - armLength}
        stroke="var(--color-primary)"
        strokeWidth={1.5 * scale}
      />
      <circle
        cx={cx}
        cy={geo.y - armLength}
        r={r}
        fill="var(--color-background)"
        stroke="var(--color-primary)"
        strokeWidth={1.5 * scale}
        style={{ cursor: "grab" }}
        onPointerDown={onRotateStart}
      />
    </g>
  );
}
