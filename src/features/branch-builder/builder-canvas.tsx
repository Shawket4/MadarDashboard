/**
 * The branch as a drawing: every piece of hardware a card, every connection a
 * line.
 *
 * Built on the floor editor's camera (`useFloorViewport`: an unbounded plane,
 * trackpad pan and pinch, touch pinch) and its grid, so the two canvases move
 * the same way under the hand. What differs is what you do on it: pieces are
 * dragged into place, and a line is drawn by dragging from a piece's port onto
 * another piece. Only lines that mean something are accepted (see
 * `linkKindFor`); while dragging, the pieces that would accept it are lifted
 * and the rest fade.
 *
 * Dragging is never the only way (WCAG 2.2 "dragging movements"): every piece
 * can be reached with Tab, moved with the arrow keys, and linked from the
 * inspector's checklists.
 */
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TriangleAlert, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FloorViewport } from "@/features/floor/use-floor-viewport";
import { GRID, snapTo } from "@/features/floor/util";
import {
  linkKindFor, linksOf, parsePieceKey, pieceKey, type LinkKind, type PieceBox, type PieceRef, type Plan,
  type PlanLink,
} from "./plan";
import { linkLabel } from "./vocabulary";

/** What a card shows. Built by the page, which knows the live state. */
export interface PieceView {
  key: string;
  box: PieceBox;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** A third line, for sections: what cooks there. */
  detail?: string;
  /** Live state of a device, told in words as well as colour. */
  presence?: { tone: "online" | "offline" | "unclaimed"; label: string };
  badge?: string;
  /** A slot no device fills yet is drawn dashed: it is a place, not a thing. */
  placeholder: boolean;
  problem: "blocking" | "warning" | null;
}

/** Line style per kind. Dash patterns carry the meaning; colour only helps. */
export const LINK_STYLE: Record<LinkKind, { stroke: string; dash?: string; width: number; marker: string }> = {
  shows: { stroke: "var(--color-primary)", width: 2, marker: "bb-arrow-primary" },
  prints: { stroke: "var(--color-primary)", dash: "7 5", width: 2, marker: "bb-arrow-primary" },
  receipt: { stroke: "var(--color-muted-foreground)", width: 1.5, marker: "bb-arrow-muted" },
  host: { stroke: "var(--color-muted-foreground)", dash: "2 5", width: 1.5, marker: "bb-arrow-muted" },
};

type Interaction =
  | { kind: "drag"; from: { x: number; y: number }; origin: Map<string, { x: number; y: number }>; moved: boolean }
  | { kind: "pan"; clientX: number; clientY: number }
  | { kind: "link"; from: PieceRef; start: { x: number; y: number } };

export interface BuilderCanvasProps {
  plan: Plan;
  pieces: PieceView[];
  editable: boolean;
  viewport: FloorViewport;
  selection: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  selectedLink: PlanLink | null;
  onSelectLink: (link: PlanLink | null) => void;
  beginGesture: () => void;
  onMove: (moves: Map<string, { x: number; y: number }>) => void;
  onLink: (from: PieceRef, to: PieceRef) => void;
  onRemoveLink: (link: PlanLink) => void;
}

const sameLink = (a: PlanLink | null, b: PlanLink) =>
  !!a && a.kind === b.kind && a.from.id === b.from.id && a.to.id === b.to.id;

const centre = (b: PieceBox) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/**
 * Where a line leaves one card and meets the other: the facing sides, so a
 * printer under its till is joined bottom-to-top and a screen beside its
 * section side-to-side, never a line looping round a card.
 */
export const routeBetween = (a: PieceBox, b: PieceBox) => {
  const ca = centre(a);
  const cb = centre(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;
  const horizontal = Math.abs(dx) * (a.h + b.h) >= Math.abs(dy) * (a.w + b.w) * 0.5;
  let p1, p2, c1, c2;
  if (horizontal) {
    const s = Math.sign(dx) || 1;
    p1 = { x: ca.x + (s * a.w) / 2, y: ca.y };
    p2 = { x: cb.x - (s * b.w) / 2, y: cb.y };
    const k = Math.max(32, Math.abs(p2.x - p1.x) / 2);
    c1 = { x: p1.x + s * k, y: p1.y };
    c2 = { x: p2.x - s * k, y: p2.y };
  } else {
    const s = Math.sign(dy) || 1;
    p1 = { x: ca.x, y: ca.y + (s * a.h) / 2 };
    p2 = { x: cb.x, y: cb.y - (s * b.h) / 2 };
    const k = Math.max(24, Math.abs(p2.y - p1.y) / 2);
    c1 = { x: p1.x, y: p1.y + s * k };
    c2 = { x: p2.x, y: p2.y - s * k };
  }
  const mid = {
    x: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8,
    y: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8,
  };
  return { d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`, mid };
};

export function BuilderCanvas({
  plan, pieces, editable, viewport, selection, onSelectionChange, selectedLink, onSelectLink,
  beginGesture, onMove, onLink, onRemoveLink,
}: BuilderCanvasProps) {
  const { t } = useTranslation();
  const interaction = useRef<Interaction | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [linking, setLinking] = useState<PieceRef | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const { rect, toWorld } = viewport;
  const scale = 1 / viewport.view.zoom;

  const boxes = new Map(pieces.map((p) => [p.key, p.box]));
  const hitTest = useCallback(
    (p: { x: number; y: number }): string | null => {
      for (let i = pieces.length - 1; i >= 0; i--) {
        const b = pieces[i].box;
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return pieces[i].key;
      }
      return null;
    },
    [pieces],
  );

  /** ⌥/Alt ignores the grid, as on the floor. */
  const snap = (v: number, e: { altKey: boolean }) => snapTo(v, !e.altKey, GRID);

  const onPointerDownPiece = (e: React.PointerEvent, key: string) => {
    if (viewport.trackPointerDown(e)) return;
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onSelectLink(null);

    let next = selection;
    if (e.shiftKey) {
      next = new Set(selection);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onSelectionChange(next);
      return;
    }
    if (!selection.has(key)) {
      next = new Set([key]);
      onSelectionChange(next);
    }
    if (!editable) {
      interaction.current = { kind: "pan", clientX: e.clientX, clientY: e.clientY };
      return;
    }
    const origin = new Map<string, { x: number; y: number }>();
    for (const k of next) {
      const b = boxes.get(k);
      if (b) origin.set(k, { x: b.x, y: b.y });
    }
    interaction.current = { kind: "drag", from: toWorld(e.clientX, e.clientY), origin, moved: false };
  };

  const onPointerDownPort = (e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const from = parsePieceKey(key);
    const start = toWorld(e.clientX, e.clientY);
    interaction.current = { kind: "link", from, start };
    setLinking(from);
    setPointer(start);
  };

  const onPointerDownEmpty = (e: React.PointerEvent) => {
    if (viewport.trackPointerDown(e)) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (!e.shiftKey) {
      onSelectionChange(new Set());
      onSelectLink(null);
    }
    interaction.current = { kind: "pan", clientX: e.clientX, clientY: e.clientY };
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
    if (it.kind === "link") {
      setPointer(p);
      setHoverKey(hitTest(p));
      return;
    }
    // drag
    if (!it.moved) beginGesture();
    const dx = p.x - it.from.x;
    const dy = p.y - it.from.y;
    const moves = new Map<string, { x: number; y: number }>();
    for (const [k, o] of it.origin) moves.set(k, { x: snap(o.x + dx, e), y: snap(o.y + dy, e) });
    interaction.current = { ...it, moved: true };
    onMove(moves);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    viewport.trackPointerUp(e);
    const it = interaction.current;
    interaction.current = null;
    if (it?.kind === "link") {
      const target = hitTest(toWorld(e.clientX, e.clientY));
      if (target && target !== pieceKey(it.from)) onLink(it.from, parsePieceKey(target));
      setLinking(null);
      setPointer(null);
      setHoverKey(null);
    }
  };

  const links = linksOf(plan);
  /** While drawing a line: which pieces would take it. */
  const accepts = (key: string) => !!linking && key !== pieceKey(linking) && !!linkKindFor(plan, linking, parsePieceKey(key));

  return (
    <svg
      viewBox={`${rect.x} ${rect.y} ${rect.w} ${rect.h}`}
      className={cn("h-full w-full touch-none select-none", linking ? "cursor-crosshair" : "cursor-grab")}
      role="group"
      aria-label={t("builder.canvasAria", "Branch plan")}
      onPointerDown={onPointerDownEmpty}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <defs>
        <pattern id="bb-grid" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
          <path
            d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={scale}
            opacity="0.5"
          />
        </pattern>
        {(["primary", "muted"] as const).map((tone) => (
          <marker
            key={tone}
            id={`bb-arrow-${tone}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={tone === "primary" ? "var(--color-primary)" : "var(--color-muted-foreground)"} />
          </marker>
        ))}
      </defs>

      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill="url(#bb-grid)" />

      {/* ── Lines ─────────────────────────────────────────────────────── */}
      {links.map((link) => {
        const a = boxes.get(pieceKey(link.from));
        const b = boxes.get(pieceKey(link.to));
        if (!a || !b) return null;
        const style = LINK_STYLE[link.kind];
        const { d, mid } = routeBetween(a, b);
        const isSelected = sameLink(selectedLink, link);
        const key = `${link.kind}:${link.from.id}:${link.to.id}`;
        return (
          <g key={key}>
            {/* A wide invisible stroke makes a 2px line easy to hit. */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={14 * scale}
              className="cursor-pointer"
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelectionChange(new Set());
                onSelectLink(link);
              }}
            >
              <title>{linkLabel(t, link.kind)}</title>
            </path>
            <path
              d={d}
              fill="none"
              stroke={style.stroke}
              strokeWidth={(isSelected ? style.width + 1.5 : style.width) * Math.max(1, scale * 0.8)}
              strokeDasharray={style.dash}
              markerEnd={`url(#${style.marker})`}
              opacity={linking ? 0.35 : 1}
              pointerEvents="none"
            />
            {isSelected ? (
              <foreignObject x={mid.x - 70 * scale} y={mid.y - 14 * scale} width={140 * scale} height={28 * scale}>
                <div
                  className="flex h-full origin-top-left items-center justify-center"
                  style={{ transform: `scale(${scale})`, width: 140, height: 28 }}
                >
                  <span className="flex items-center gap-1 rounded-full border bg-card py-0.5 ps-2.5 pe-0.5 text-xs font-medium shadow-sm">
                    {linkLabel(t, link.kind)}
                    {editable ? (
                      <button
                        type="button"
                        aria-label={t("builder.removeLink", "Remove this line")}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onRemoveLink(link)}
                        className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </span>
                </div>
              </foreignObject>
            ) : null}
          </g>
        );
      })}

      {/* The line being drawn. */}
      {linking && pointer ? (() => {
        const a = boxes.get(pieceKey(linking));
        if (!a) return null;
        const target = hoverKey && accepts(hoverKey) ? boxes.get(hoverKey) : undefined;
        const to = target ?? { x: pointer.x, y: pointer.y, w: 0, h: 0, key: "" };
        return (
          <path
            d={routeBetween(a, to).d}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2 * scale}
            strokeDasharray={`${4 * scale} ${4 * scale}`}
            pointerEvents="none"
          />
        );
      })() : null}

      {/* ── Pieces ────────────────────────────────────────────────────── */}
      {pieces.map((piece) => {
        const { box } = piece;
        const isSelected = selection.has(piece.key);
        const takes = accepts(piece.key);
        const faded = !!linking && !takes && piece.key !== pieceKey(linking);
        const Icon = piece.icon;
        const labelParts = [piece.title, piece.subtitle, piece.detail, piece.presence?.label].filter(Boolean);
        return (
          <g
            key={piece.key}
            role="button"
            tabIndex={0}
            aria-label={labelParts.join(", ")}
            aria-pressed={isSelected}
            onPointerDown={(e) => onPointerDownPiece(e, piece.key)}
            onFocus={() => {
              if (!selection.has(piece.key)) onSelectionChange(new Set([piece.key]));
            }}
            className="outline-none"
            opacity={faded ? 0.4 : 1}
          >
            <foreignObject x={box.x} y={box.y} width={box.w} height={box.h} overflow="visible">
              <div
                className={cn(
                  "relative flex h-full flex-col justify-center gap-0.5 rounded-xl border bg-card px-3 shadow-sm transition-shadow duration-150 motion-reduce:transition-none",
                  piece.placeholder && "border-dashed",
                  isSelected && "border-primary ring-2 ring-primary/40",
                  takes && hoverKey === piece.key && "ring-[3px] ring-primary",
                  takes && hoverKey !== piece.key && "ring-2 ring-primary/40",
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg",
                      piece.placeholder ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-tight font-semibold">{piece.title}</p>
                    <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">{piece.subtitle}</span>
                      {piece.badge ? (
                        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-px text-[10px] font-medium">
                          {piece.badge}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {piece.problem ? (
                    <TriangleAlert
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0",
                        piece.problem === "blocking"
                          ? "text-destructive"
                          : "text-[color-mix(in_oklab,var(--color-warning)_55%,var(--color-foreground))]",
                      )}
                    />
                  ) : null}
                </div>
                {piece.detail || piece.presence ? (
                  <div className="flex min-w-0 items-center gap-2 ps-[46px] text-xs">
                    {piece.presence ? <PresenceDot tone={piece.presence.tone} label={piece.presence.label} /> : null}
                    {piece.detail ? <span className="truncate text-muted-foreground">{piece.detail}</span> : null}
                  </div>
                ) : null}
              </div>
            </foreignObject>

            {/* The port a line is drawn from. */}
            {editable ? (
              <g
                onPointerDown={(e) => onPointerDownPort(e, piece.key)}
                className="cursor-crosshair"
                aria-hidden
              >
                <circle cx={box.x + box.w} cy={box.y + box.h / 2} r={12 * scale} fill="transparent" />
                <circle
                  cx={box.x + box.w}
                  cy={box.y + box.h / 2}
                  r={5.5 * scale}
                  fill="var(--color-card)"
                  stroke="var(--color-primary)"
                  strokeWidth={1.75 * scale}
                />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function PresenceDot({ tone, label }: { tone: "online" | "offline" | "unclaimed"; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          tone === "online" && "bg-success",
          tone === "offline" && "bg-muted-foreground/60",
          tone === "unclaimed" && "border border-dashed border-muted-foreground",
        )}
      />
      <span
        className={cn(
          tone === "online"
            ? "text-[color-mix(in_oklab,var(--color-success)_60%,var(--color-foreground))]"
            : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </span>
  );
}
