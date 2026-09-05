import { queryClient } from "@/data/api/query";

/** Floor geometry (sections + tables) lives under `/floor/*` query keys. */
export const invalidateFloor = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/floor"),
  });

/** Open tickets feed the live board's occupant chips. */
export const invalidateOccupants = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/open-tickets"),
  });

/**
 * The dashboard shows whether a table is taken, free, or still owes the floor
 * work. The raw API `status` (`free` | `held` | `seated` | `dirty`) is read
 * verbatim; `held` is a teller's short-lived reservation hold and stays a POS
 * concern folded into "available".
 *
 * `dirty` is NOT folded in. A checkout no longer hands its table back to the
 * room automatically — the party paid and left their plates, so the table sits
 * `dirty` until a human clears it on the POS. Showing that as "available" would
 * put a manager's free-table count above what the room can actually seat.
 */
export const TABLE_TONES = ["available", "held", "seated", "dirty"] as const;
export type TableTone = (typeof TABLE_TONES)[number];

/** Color tokens per display tone, shared by the editor, glyph, and live board. */
export const TABLE_TONE_STYLE: Record<TableTone, { fill: string; ring: string; label: string }> = {
  available: { fill: "var(--color-success)", ring: "var(--color-success)", label: "Available" },
  // A booked party is due: the table is kept for them (derived from the
  // booking's `held_from`, never written to the table's status).
  held: { fill: "var(--color-warning)", ring: "var(--color-warning)", label: "Reserved" },
  seated: { fill: "var(--color-primary)", ring: "var(--color-primary)", label: "Seated" },
  dirty: { fill: "var(--color-destructive)", ring: "var(--color-destructive)", label: "Needs clearing" },
};

/**
 * Is this table currently taken? True when the POS marked it `seated`, or when
 * a live held order / open ticket occupies it (the live board passes the chip).
 */
export const isTableTaken = (table: { status: string }, occupant?: string | null): boolean =>
  table.status === "seated" || !!occupant;

/**
 * Does this table need bussing before anyone can sit at it? A live occupant
 * always wins: `dirty` alongside a held order is a contradiction the mirror can
 * briefly hold mid-sync, and "someone is sitting here" is the safer read.
 */
export const needsClearing = (table: { status: string }, occupant?: string | null): boolean =>
  table.status === "dirty" && !isTableTaken(table, occupant);

/**
 * The single mapper every floor surface uses to pick a tone. `held` says a
 * booking's hold window has started for this table (see `isHeldNow`); it only
 * shows on a table nobody is sitting at — a party that already sat down, or a
 * table still owing a bus, tells the truer story.
 */
export const toneFor = (
  table: { status: string },
  occupant?: string | null,
  held = false,
): TableTone => {
  if (isTableTaken(table, occupant)) return "seated";
  if (needsClearing(table, occupant)) return "dirty";
  return held ? "held" : "available";
};

/** The slice of `FloorTable.next_booking` the floor reads. */
export interface NextBooking {
  booking_id: string;
  status: string;
  guest_name: string;
  party_size: number;
  starts_at: string;
  held_from: string;
}

/**
 * Has the booking's hold begun? True from `held_from` (branch `hold_minutes`
 * before the start) until the booking is seated/over. Pure on `now` so the
 * board can re-evaluate on a timer without a server round trip.
 */
export const isHeldNow = (b: NextBooking | null | undefined, now: Date = new Date()): boolean =>
  !!b && b.status === "confirmed" && new Date(b.held_from).getTime() <= now.getTime();

/** Snap grid pitch (canvas units) used by drag / resize / nudge in the editor. */
export const GRID = 10;

/** Rotation step for the handle snap + the ± stepper. */
export const ROTATION_STEP = 15;

export const snapTo = (v: number, on: boolean, pitch = GRID): number =>
  on ? Math.round(v / pitch) * pitch : Math.round(v);

export const normalizeAngle = (deg: number): number => ((deg % 360) + 360) % 360;

/**
 * The patch of floor to show when an area has no tables yet. The plane itself
 * is unbounded — this is only somewhere to point the camera, never a limit on
 * where a table may go.
 */
export const EMPTY_VIEW = { x: 0, y: 0, w: 1000, h: 700 } as const;

/** Default table footprint per shape (canvas units). */
export const DEFAULT_TABLE_SIZE: Record<string, { w: number; h: number }> = {
  rect: { w: 120, h: 80 },
  circle: { w: 90, h: 90 },
};

export const MIN_TABLE_SIZE = 24;

// ── Infinite canvas viewport ────────────────────────────────────────────────
//
// The floor is an UNBOUNDED plane: a room is not a fixed rectangle, tables may
// sit anywhere (including at negative coordinates), and the view is a window
// that pans and zooms over it. The maths lives here, apart from the component,
// because "did the zoom anchor hold?" and "is the fit centred?" are the kind of
// questions a pixel can answer wrongly and a test cannot.

/** The window onto the plane: world coordinate at the top-left, plus scale. */
export interface Viewport {
  x: number;
  y: number;
  /** Pixels per world unit. */
  zoom: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Zoom range. The plane is unbounded but a person's usefulness is not: below
 * 10% a table is a speck, above 400% you are placing sub-millimetre.
 */
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;
/** One notch of the zoom buttons / keyboard. */
export const ZOOM_STEP = 1.25;
/** Breathing room left around the content when fitting. */
export const FIT_PADDING = 80;

export const clampZoom = (z: number): number => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/**
 * The world-space box a set of tables occupies. A rotated table sweeps a wider
 * area than its width and height, so each one contributes the circle its
 * diagonal describes — an envelope that can never crop a corner off.
 */
export const boundsOf = (
  items: { x: number; y: number; w: number; h: number }[],
  fallback: Rect,
): Rect => {
  if (items.length === 0) return fallback;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const it of items) {
    const r = Math.hypot(it.w, it.h) / 2;
    const cx = it.x + it.w / 2;
    const cy = it.y + it.h / 2;
    minX = Math.min(minX, cx - r);
    minY = Math.min(minY, cy - r);
    maxX = Math.max(maxX, cx + r);
    maxY = Math.max(maxY, cy + r);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

/** Frame `bounds` centred in a viewport of `size` pixels. */
export const fitView = (
  bounds: Rect,
  size: { w: number; h: number },
  padding = FIT_PADDING,
): Viewport => {
  const zoom = clampZoom(
    Math.min(size.w / (bounds.w + padding * 2), size.h / (bounds.h + padding * 2)),
  );
  return {
    zoom,
    x: bounds.x + bounds.w / 2 - size.w / (2 * zoom),
    y: bounds.y + bounds.h / 2 - size.h / (2 * zoom),
  };
};

/**
 * Scale about a fixed world point, so whatever sits under the cursor stays
 * under the cursor. Zooming about the origin instead is the classic bug that
 * makes a canvas feel like it is sliding away from you.
 */
export const zoomAt = (
  view: Viewport,
  factor: number,
  anchor: { x: number; y: number },
): Viewport => {
  const zoom = clampZoom(view.zoom * factor);
  if (zoom === view.zoom) return view;
  return {
    zoom,
    x: anchor.x - (anchor.x - view.x) * (view.zoom / zoom),
    y: anchor.y - (anchor.y - view.y) * (view.zoom / zoom),
  };
};

/** The world rectangle currently visible — what the viewBox must describe. */
export const viewRect = (view: Viewport, size: { w: number; h: number }): Rect => ({
  x: view.x,
  y: view.y,
  w: size.w / view.zoom,
  h: size.h / view.zoom,
});

// ── Undo history ────────────────────────────────────────────────────────────
//
// Arranging a floor is fiddly — a table gets nudged a hair too far, a resize
// grabs the wrong corner. Without a way back, the only recovery is discarding
// every change since the last save. Snapshots are per GESTURE, not per frame:
// one drag is one undo, not two hundred.

export interface UndoHistory<T> {
  past: T[];
  future: T[];
}

/** Deep enough for a session of arranging, bounded so it cannot grow forever. */
export const HISTORY_LIMIT = 100;

export const emptyHistory = <T,>(): UndoHistory<T> => ({ past: [], future: [] });

/**
 * Record the state a gesture is about to change. Recording CLEARS the redo
 * branch: once you undo and then do something new, the abandoned future is
 * genuinely gone, and pretending otherwise makes redo unpredictable.
 */
export const pushHistory = <T,>(history: UndoHistory<T>, snapshot: T): UndoHistory<T> => ({
  past: [...history.past, snapshot].slice(-HISTORY_LIMIT),
  future: [],
});

/** Step back. Returns null when there is nothing to undo, so callers no-op. */
export const applyUndo = <T,>(
  history: UndoHistory<T>,
  current: T,
): { value: T; history: UndoHistory<T> } | null => {
  if (history.past.length === 0) return null;
  return {
    value: history.past[history.past.length - 1],
    history: { past: history.past.slice(0, -1), future: [current, ...history.future] },
  };
};

/** Step forward again. Returns null when the redo branch is empty. */
export const applyRedo = <T,>(
  history: UndoHistory<T>,
  current: T,
): { value: T; history: UndoHistory<T> } | null => {
  if (history.future.length === 0) return null;
  return {
    value: history.future[0],
    history: { past: [...history.past, current], future: history.future.slice(1) },
  };
};

// ── Multi-select, alignment, clipboard ──────────────────────────────────────
//
// Everything below is pure geometry or pure serialization, deliberately kept
// out of the component: "did the marquee catch a rotated table?" and "does a
// paste keep its shape?" are questions a pixel answers wrongly and a test
// answers once.

/** A table as far as geometry is concerned. */
export interface GeoItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
}

/** Axis-aligned envelope of one item, rotation included. */
export const envelopeOf = (it: GeoItem): Rect => {
  const r = Math.hypot(it.w, it.h) / 2;
  return { x: it.x + it.w / 2 - r, y: it.y + it.h / 2 - r, w: r * 2, h: r * 2 };
};

/** Do two rectangles overlap at all? */
export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Which items a marquee caught.
 *
 * Touch, not containment. A box that must fully enclose a table means a
 * near-miss selects nothing, and on a dense floor you can rarely draw a box
 * that encloses what you want without also enclosing what you do not.
 */
export const marqueeHits = (marquee: Rect, items: GeoItem[]): string[] => {
  const norm: Rect = {
    x: marquee.w < 0 ? marquee.x + marquee.w : marquee.x,
    y: marquee.h < 0 ? marquee.y + marquee.h : marquee.y,
    w: Math.abs(marquee.w),
    h: Math.abs(marquee.h),
  };
  return items.filter((it) => rectsIntersect(norm, envelopeOf(it))).map((it) => it.id);
};

export const ALIGNMENTS = ["left", "hcenter", "right", "top", "vcenter", "bottom"] as const;
export type Alignment = (typeof ALIGNMENTS)[number];

/**
 * Align a selection, returning only the items that actually move.
 *
 * Aligns on the ENVELOPE, not the raw box, so a rotated table lines up by the
 * space it really occupies — which is what someone looking at the room means
 * by "these should be flush".
 */
export const alignItems = (items: GeoItem[], how: Alignment): GeoItem[] => {
  if (items.length < 2) return [];
  const env = items.map((it) => ({ it, e: envelopeOf(it) }));
  const minX = Math.min(...env.map((v) => v.e.x));
  const maxX = Math.max(...env.map((v) => v.e.x + v.e.w));
  const minY = Math.min(...env.map((v) => v.e.y));
  const maxY = Math.max(...env.map((v) => v.e.y + v.e.h));

  const out: GeoItem[] = [];
  for (const { it, e } of env) {
    let dx = 0;
    let dy = 0;
    switch (how) {
      case "left": dx = minX - e.x; break;
      case "right": dx = maxX - (e.x + e.w); break;
      case "hcenter": dx = (minX + maxX) / 2 - (e.x + e.w / 2); break;
      case "top": dy = minY - e.y; break;
      case "bottom": dy = maxY - (e.y + e.h); break;
      case "vcenter": dy = (minY + maxY) / 2 - (e.y + e.h / 2); break;
    }
    if (dx !== 0 || dy !== 0) out.push({ ...it, x: it.x + dx, y: it.y + dy });
  }
  return out;
};

/**
 * Space a selection evenly along an axis, holding the two outermost still.
 * GAPS are equalised rather than centres, so tables of different sizes end up
 * looking evenly spaced instead of merely measuring evenly.
 */
export const distributeItems = (items: GeoItem[], axis: "x" | "y"): GeoItem[] => {
  if (items.length < 3) return [];
  const key = axis;
  const span = axis === "x" ? "w" : "h";
  const sorted = [...items]
    .map((it) => ({ it, e: envelopeOf(it) }))
    .sort((a, b) => a.e[key] - b.e[key]);

  const first = sorted[0].e;
  const last = sorted[sorted.length - 1].e;
  const total = last[key] + last[span] - first[key];
  const used = sorted.reduce((sum, v) => sum + v.e[span], 0);
  const gap = (total - used) / (sorted.length - 1);

  const out: GeoItem[] = [];
  let cursor = first[key] + first[span] + gap;
  for (let i = 1; i < sorted.length - 1; i += 1) {
    const { it, e } = sorted[i];
    const delta = cursor - e[key];
    if (delta !== 0) {
      out.push(axis === "x" ? { ...it, x: it.x + delta } : { ...it, y: it.y + delta });
    }
    cursor += e[span] + gap;
  }
  return out;
};

// ── Clipboard ───────────────────────────────────────────────────────────────

/** What a copied table carries. Blueprint only — never live status. */
export interface ClipboardTable {
  label: string;
  seats: number;
  shape: string;
  w: number;
  h: number;
  rot: number;
  /** Offset from the copied selection's top-left, so a paste keeps its shape. */
  dx: number;
  dy: number;
}

/**
 * A magic key, so a paste from an unrelated app is ignored rather than throwing.
 * The payload rides the REAL clipboard as text/plain JSON, which means copying
 * in one branch and pasting into another — or into a second tab — works for
 * free, and costs nothing extra to support.
 */
export const CLIPBOARD_KIND = "madar.floor.tables.v1";

export const serializeTables = (
  tables: { label: string; seats: number; shape: string }[],
  geo: GeoItem[],
): string => {
  const minX = Math.min(...geo.map((g) => g.x));
  const minY = Math.min(...geo.map((g) => g.y));
  return JSON.stringify({
    kind: CLIPBOARD_KIND,
    tables: geo.map((g, i) => ({
      label: tables[i].label,
      seats: tables[i].seats,
      shape: tables[i].shape,
      w: g.w,
      h: g.h,
      rot: g.rot,
      dx: g.x - minX,
      dy: g.y - minY,
    })),
  });
};

/** `null` for anything that is not ours — a stray paste must never throw. */
export const parseClipboard = (text: string): ClipboardTable[] | null => {
  try {
    const v = JSON.parse(text) as { kind?: string; tables?: ClipboardTable[] };
    if (v?.kind !== CLIPBOARD_KIND || !Array.isArray(v.tables) || v.tables.length === 0) {
      return null;
    }
    const ok = v.tables.filter(
      (t) => typeof t?.dx === "number" && typeof t?.dy === "number" && typeof t?.w === "number",
    );
    return ok.length > 0 ? ok : null;
  } catch {
    return null;
  }
};

/**
 * A label for a pasted copy that is not already on the floor.
 *
 * Table labels are how staff refer to a table out loud ("drinks to 12"), so two
 * tables called 12 is an operational problem, not a cosmetic one.
 */
export const uniqueLabel = (base: string, taken: Set<string>): string => {
  const stem = base.replace(/\s+\(\d+\)$/, "");
  if (!taken.has(stem)) return stem;
  for (let n = 2; n < 999; n += 1) {
    const candidate = `${stem} (${n})`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${stem} ${Date.now()}`;
};
