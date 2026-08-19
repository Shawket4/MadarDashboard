import type { ReactNode } from "react";
import { Sparkles, Users } from "lucide-react";

import { TABLE_TONE_STYLE, toneFor, type TableTone } from "./util";

/** The id of the hatch pattern each floor canvas defines once (see `FloorDefs`). */
export const HATCH_ID = "floorNeedsClearing";
export const SHEEN_ID = "floorTableSheen";
export const LIFT_ID = "floorTableLift";

/**
 * Canvas-level defs every floor SVG renders once. The hatch marks a table that
 * still owes the floor a bus: colour alone would leave the one state that
 * demands WORK indistinguishable for a colour-blind manager, and it is the
 * state the whole post-checkout flow depends on being noticed.
 */
export function FloorDefs() {
  return (
    <>
      <pattern id={HATCH_ID} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-destructive)" strokeWidth="2.5" opacity="0.28" />
      </pattern>
      {/* The soft top-light that turns a tinted shape into a surface, and the
          lift that puts the table ON the floor rather than printed on it.
          Both a few percent — material, not gloss. */}
      <linearGradient id={SHEEN_ID} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity="0.05" />
        <stop offset="55%" stopColor="var(--color-foreground)" stopOpacity="0" />
        <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity="0.06" />
      </linearGradient>
      <filter id={LIFT_ID} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="var(--color-foreground)" floodOpacity="0.16" />
      </filter>
    </>
  );
}

/**
 * How far chairs reach beyond the table edge. Each canvas pads its viewBox by
 * this much so a table sitting hard against the wall keeps its chairs on
 * screen; `getScreenCTM` absorbs the offset, so pointer math is untouched.
 */
export const SEAT_ALLOWANCE = 22;

/** Past this many seats the rim turns into a smear — the count carries it. */
export const SEAT_RENDER_CAP = 12;

/** One chair, in table-local units (origin = the table's top-left). */
export interface SeatSlot {
  x: number;
  y: number;
  /** Degrees; 0 = the capsule lies along a horizontal edge. */
  angle: number;
}

/** Chair capsule dimensions for a table of this size, in canvas units. */
export function seatMetrics(w: number, h: number) {
  const len = Math.min(Math.max(Math.min(w, h) * 0.26, 10), 28);
  return { len, thick: len * 0.42, gap: 4 };
}

/**
 * Where the chairs go.
 *
 * People sit in PAIRS facing each other, so pairs are allocated to opposite
 * sides by side length and an odd seat takes the HEAD of the table. Splitting
 * raw seat counts instead leaves a 6-top with 2 chairs on one side and 1 on the
 * other, which reads as a drawing mistake rather than a room.
 *
 * The POS paints the same chairs from the same numbers (madar:
 * `packages/features/order/lib/src/tables_screen.dart`, `seatSlots`) — change a
 * constant here and change it there.
 */
export function seatSlots(shape: string, w: number, h: number, seats: number): SeatSlot[] {
  if (seats <= 0 || seats > SEAT_RENDER_CAP) return [];
  const { thick, gap } = seatMetrics(w, h);
  const out: SeatSlot[] = [];

  if (shape === "circle") {
    const rx = w / 2 + gap + thick / 2;
    const ry = h / 2 + gap + thick / 2;
    for (let i = 0; i < seats; i += 1) {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / seats;
      out.push({
        x: w / 2 + rx * Math.cos(a),
        y: h / 2 + ry * Math.sin(a),
        angle: (a * 180) / Math.PI + 90,
      });
    }
    return out;
  }

  const pairs = Math.floor(seats / 2);
  const horizPairs = Math.max(0, Math.min(pairs, Math.round((pairs * w) / (w + h))));
  const vertPairs = pairs - horizPairs;
  const wide = w >= h;
  const odd = seats % 2;
  const sides = [
    { n: horizPairs, edge: "top" as const },
    { n: horizPairs + (odd && !wide ? 1 : 0), edge: "bottom" as const },
    { n: vertPairs, edge: "left" as const },
    { n: vertPairs + (odd && wide ? 1 : 0), edge: "right" as const },
  ];
  const off = gap + thick / 2;
  for (const { n, edge } of sides) {
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      if (edge === "top") out.push({ x: w * t, y: -off, angle: 0 });
      else if (edge === "bottom") out.push({ x: w * t, y: h + off, angle: 0 });
      else if (edge === "left") out.push({ x: -off, y: h * t, angle: 90 });
      else out.push({ x: w + off, y: h * t, angle: 90 });
    }
  }
  return out;
}

/** The glyph that names each tone — state never rests on colour alone. */
const TONE_ICON: Record<TableTone, typeof Users | null> = {
  available: null,
  seated: Users,
  dirty: Sparkles,
};

interface TableGlyphProps {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  shape: string;
  label: string;
  seats: number;
  seatsWord: string;
  status: string;
  selected?: boolean;
  inactive?: boolean;
  /** Occupant chip (live board): held-order name or ticket ref. */
  occupant?: string | null;
  /** Extra nodes rendered inside the rotated group (editor handles). */
  children?: ReactNode;
}

/**
 * One table rendered on the SVG floor canvas. Pure presentational: the editor
 * wraps it with drag/resize/rotate behavior, the live board renders it as-is.
 *
 * Three display tones — taken, available, or still owing the floor a bus (see
 * `toneFor`). The drawing is deliberately the same object the POS paints, so a
 * room authored here and a room worked there are recognisably the same room:
 * chairs around the rim, a tinted body lit from above, a corner tone glyph, the
 * label over the seat count, and an occupant chip on the bottom edge.
 */
export function TableGlyph({
  x, y, w, h, rotation, shape, label, seats, seatsWord, status,
  selected = false, inactive = false, occupant = null, children,
}: TableGlyphProps) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const tone = toneFor({ status }, occupant);
  const style = TABLE_TONE_STYLE[tone];
  const ToneIcon = TONE_ICON[tone];
  const compact = h < 64 || w < 72;
  const { len: seatLen, thick: seatThick } = seatMetrics(w, h);
  const chairs = seatSlots(shape, w, h, seats);

  // Occupant chip geometry: below the seats line, clipped to the table width.
  const chipMax = Math.max(w - 12, 48);
  const chipChars = Math.max(3, Math.floor((chipMax - 16) / 8));
  const chipText = occupant && occupant.length > chipChars ? `${occupant.slice(0, chipChars - 1)}…` : occupant;
  const chipW = chipText ? Math.min(chipMax, chipText.length * 8 + 18) : 0;

  return (
    <g transform={`rotate(${rotation} ${cx} ${cy})`} opacity={inactive ? 0.4 : 1}>
      {/* Chairs first, so the table surface always sits on top of them. They
          are what make a rectangle read as a TABLE rather than a box, and they
          make party size legible without reading the seat count. Decorative
          only — never hit targets, so they never compete with the table for a
          click. */}
      {chairs.map((seat, i) => (
        <rect
          key={i}
          x={x + seat.x - seatLen / 2}
          y={y + seat.y - seatThick / 2}
          width={seatLen}
          height={seatThick}
          rx={seatThick / 2}
          fill={style.ring}
          fillOpacity={0.55}
          transform={`rotate(${seat.angle} ${x + seat.x} ${y + seat.y})`}
          style={{ pointerEvents: "none" }}
        />
      ))}
      <g filter={`url(#${LIFT_ID})`}>
        {shape === "circle" ? (
          <>
            <ellipse
              cx={cx} cy={cy} rx={w / 2} ry={h / 2}
              fill={style.fill} fillOpacity={0.18}
              stroke={selected ? "var(--color-ring)" : style.ring}
              strokeWidth={selected ? 3 : 2}
            />
            <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={`url(#${SHEEN_ID})`} style={{ pointerEvents: "none" }} />
          </>
        ) : (
          <>
            <rect
              x={x} y={y} width={w} height={h} rx={10}
              fill={style.fill} fillOpacity={0.18}
              stroke={selected ? "var(--color-ring)" : style.ring}
              strokeWidth={selected ? 3 : 2}
            />
            <rect x={x} y={y} width={w} height={h} rx={10} fill={`url(#${SHEEN_ID})`} style={{ pointerEvents: "none" }} />
          </>
        )}
      </g>
      {tone === "dirty" ? (
        shape === "circle" ? (
          <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={`url(#${HATCH_ID})`} />
        ) : (
          <rect x={x} y={y} width={w} height={h} rx={10} fill={`url(#${HATCH_ID})`} />
        )
      ) : null}
      {ToneIcon ? (
        <ToneIcon
          x={x + 7} y={y + 7} width={16} height={16}
          color={style.ring} strokeWidth={2.5} aria-hidden
        />
      ) : null}
      <text
        x={cx} y={compact ? cy + 6 : cy - 2}
        textAnchor="middle" fontSize={18} fontWeight={700}
        fill="var(--color-foreground)" style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
      {!compact ? (
        <text
          x={cx} y={cy + 16}
          textAnchor="middle" fontSize={12}
          fill="var(--color-muted-foreground)" style={{ pointerEvents: "none" }}
        >
          {seats} {seatsWord}
        </text>
      ) : null}
      {chipText ? (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={cx - chipW / 2} y={y + h - 14} width={chipW} height={24} rx={12}
            fill="var(--color-card)" stroke={style.ring} strokeWidth={1.5}
          />
          <text
            x={cx} y={y + h + 3}
            textAnchor="middle" fontSize={13} fontWeight={600}
            fill="var(--color-foreground)"
          >
            {chipText}
          </text>
        </g>
      ) : null}
      {children}
    </g>
  );
}
