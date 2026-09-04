import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ChevronDown, LayoutGrid, Magnet, Maximize2, Minus, Plus,
  Plus as PlusIcon, Redo2, Save, Settings2, Trash2, Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useListSections, useListFloorTables,
  createFloorTable, deleteFloorTable, deleteSection, saveLayout,
  updateFloorTable, updateSection,
} from "@/data/api/generated/api";
import type { FloorSection, FloorTable } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { AddTableDialog } from "./add-table-dialog";
import { PropertiesPanel } from "./properties-panel";
import { SectionDialog } from "./section-dialog";
import { StatusLegend } from "./status-legend";
import { FloorDefs, TableGlyph } from "./table-glyph";
import {
  EMPTY_VIEW, GRID, MIN_TABLE_SIZE, ROTATION_STEP, type UndoHistory,
  applyRedo, applyUndo, emptyHistory, pushHistory,
  ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type Viewport,
  boundsOf, fitView, invalidateFloor, normalizeAngle, snapTo, toneFor, viewRect, zoomAt,
} from "./util";

/** Unsaved geometry for one table (canvas units). */
export interface Geometry {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
}

type Corner = "nw" | "ne" | "se" | "sw";
const CORNER_SIGN: Record<Corner, { x: number; y: number }> = {
  nw: { x: -1, y: -1 },
  ne: { x: 1, y: -1 },
  se: { x: 1, y: 1 },
  sw: { x: -1, y: 1 },
};
const CORNER_CURSOR: Record<Corner, string> = {
  nw: "nwse-resize",
  ne: "nesw-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

type Interaction =
  | { kind: "drag"; id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean }
  | { kind: "resize"; id: string; sign: { x: number; y: number }; theta: number; fixed: { x: number; y: number }; rot: number }
  | { kind: "rotate"; id: string; cx: number; cy: number }
  | { kind: "pan"; clientX: number; clientY: number; origX: number; origY: number; moved: boolean };

const UNASSIGNED = "__unassigned__";

/** Unsaved geometry for every table being arranged. */
type GeoMap = Record<string, Geometry>;



const rotate = (p: { x: number; y: number }, theta: number) => ({
  x: p.x * Math.cos(theta) - p.y * Math.sin(theta),
  y: p.x * Math.sin(theta) + p.y * Math.cos(theta),
});

export function FloorEditor({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const interactionRef = useRef<Interaction | null>(null);

  const sectionsQ = useListSections({ branch_id: branchId }, { query: { enabled: !!branchId } });
  const tablesQ = useListFloorTables(
    { branch_id: branchId },
    // Poll gently so status tones stay live while authoring (paused when the tab is hidden).
    { query: { enabled: !!branchId, refetchInterval: 15_000 } },
  );
  const sections = useMemo(
    () => [...(sectionsQ.data ?? [])].sort((a, b) => a.ordering - b.ordering || a.name.localeCompare(b.name)),
    [sectionsQ.data],
  );
  const tables = useMemo(() => tablesQ.data ?? [], [tablesQ.data]);

  // `null` = auto (first section); UNASSIGNED = the pseudo-section.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapOn, setSnapOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [sectionDialog, setSectionDialog] = useState<{ open: boolean; section: FloorSection | null }>({
    open: false,
    section: null,
  });
  /** Unsaved geometry overrides, keyed by table id. */
  const [geo, setGeo] = useState<GeoMap>({});
  const dirty = Object.keys(geo).length > 0;

  /**
   * Undo history over the UNSAVED geometry. Arranging a floor is fiddly — a
   * table gets nudged a hair too far, a resize grabs the wrong corner — and
   * without a way back the only recovery is discarding every change since the
   * last save. Snapshots are cheap (a handful of numbers per table) and are
   * taken per GESTURE, not per frame: one drag is one undo, not two hundred.
   */
  const [history, setHistory] = useState<UndoHistory<GeoMap>>(emptyHistory);
  // Mirrored into refs so the undo/redo callbacks stay referentially stable
  // and never close over a stale snapshot. Synced in an effect, not during
  // render — by the time a keypress or pointerdown reads them, they are current.
  const geoRef = useRef(geo);
  const historyRef = useRef(history);
  useEffect(() => { geoRef.current = geo; }, [geo]);
  useEffect(() => { historyRef.current = history; }, [history]);

  /** Snapshot the current geometry before a gesture changes it. */
  const commit = useCallback(() => {
    setHistory((h) => pushHistory(h, geoRef.current));
  }, []);

  const undo = useCallback(() => {
    const step = applyUndo(historyRef.current, geoRef.current);
    if (!step) return;
    setGeo(step.value);
    setHistory(step.history);
  }, []);

  const redo = useCallback(() => {
    const step = applyRedo(historyRef.current, geoRef.current);
    if (!step) return;
    setGeo(step.value);
    setHistory(step.history);
  }, []);

  /** Geometry and its history are one story — a save or a discard ends both. */
  const resetGeo = useCallback((next: GeoMap = {}) => {
    setGeo(next);
    setHistory(emptyHistory());
  }, []);

  /**
   * The window onto an UNBOUNDED plane: the world coordinate at the canvas's
   * top-left, plus a zoom factor. A room is not a fixed rectangle — a floor can
   * sprawl, and a manager needs to pull back to see all of it or push in to
   * place a two-top precisely. Tables may sit anywhere, including at negative
   * coordinates, so nothing is ever unreachable.
   */
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  /** Canvas size in CSS pixels — the divisor that turns zoom into a viewBox. */
  const [size, setSize] = useState({ w: 1000, h: 640 });
  const fittedFor = useRef<string | null>(null);

  // Measure the canvas so the viewBox can be expressed in world units per
  // pixel. Without this, zoom would stretch rather than scale.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasUnassigned = tables.some((tb) => !tb.section_id);
  const sectionId =
    activeKey === UNASSIGNED ? null : (activeKey ?? sections[0]?.id ?? null);

  const visibleTables = useMemo(
    () => tables.filter((tb) => (tb.section_id ?? null) === sectionId),
    [tables, sectionId],
  );
  const selected = visibleTables.find((tb) => tb.id === selectedId) ?? null;
  /** The world rectangle currently on screen. */
  const vr = viewRect(view, size);

  const geom = (tb: FloorTable): Geometry =>
    geo[tb.id] ?? { x: tb.pos_x, y: tb.pos_y, w: tb.width, h: tb.height, rot: tb.rotation };

  const setTableGeom = (id: string, g: Geometry) => setGeo((prev) => ({ ...prev, [id]: g }));

  // ── Section switching (guarding unsaved geometry) ─────────────────────────

  const switchSection = async (key: string) => {
    const currentKey = activeKey ?? sections[0]?.id ?? UNASSIGNED;
    if (key === currentKey) return;
    if (dirty) {
      const ok = await confirm({
        title: t("floor.discardTitle", "Discard unsaved layout changes?"),
        description: t(
          "floor.discardDescription",
          "You have moved or resized tables here without saving. Switching sections will discard those changes.",
        ),
        confirmLabel: t("floor.discard", "Discard"),
        destructive: true,
      });
      if (!ok) return;
      resetGeo();
    }
    setSelectedId(null);
    setActiveKey(key);
  };

  // ── Canvas pointer interactions ───────────────────────────────────────────

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = clientX;
    p.y = clientY;
    const r = p.matrixTransform(ctm.inverse());
    return { x: r.x, y: r.y };
  };

  /** World-space bounds of everything drawn, chairs included. */
  const contentBounds = useCallback(
    () =>
      boundsOf(
        visibleTables.map((tb) => {
          const g = geo[tb.id];
          return g
            ? { x: g.x, y: g.y, w: g.w, h: g.h }
            : { x: tb.pos_x, y: tb.pos_y, w: tb.width, h: tb.height };
        }),
        EMPTY_VIEW,
      ),
    [visibleTables, geo],
  );

  /** Frame everything in this section, centred. */
  const fitToContent = useCallback(() => {
    setView(fitView(contentBounds(), size));
  }, [contentBounds, size]);

  // Frame the room on arrival and whenever the section changes — an unbounded
  // plane that opens on empty space reads as "my tables are gone".
  useEffect(() => {
    const key = sectionId ?? UNASSIGNED;
    if (fittedFor.current === key || size.w < 2 || visibleTables.length === 0) return;
    fittedFor.current = key;
    fitToContent();
  }, [sectionId, size.w, visibleTables.length, fitToContent]);

  /** Zoom about a fixed world point, so what is under the cursor stays put. */
  const zoomAbout = useCallback((factor: number, world?: { x: number; y: number }) => {
    setView((v) =>
      zoomAt(v, factor, world ?? {
        // No anchor (a button press) → hold the middle of the view still.
        x: v.x + size.w / (2 * v.zoom),
        y: v.y + size.h / (2 * v.zoom),
      }),
    );
  }, [size.w, size.h]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const p = toSvg(e.clientX, e.clientY);
    zoomAbout(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, p);
  };

  /** Grab empty floor to pan. Tracked in CLIENT pixels — world coordinates
   *  move underfoot while panning, which would feed the delta back on itself. */
  const startPan = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    interactionRef.current = {
      kind: "pan", clientX: e.clientX, clientY: e.clientY,
      origX: view.x, origY: view.y, moved: false,
    };
  };

  const startDrag = (e: React.PointerEvent, tb: FloorTable) => {
    e.preventDefault();
    commit();
    (e.target as Element).setPointerCapture(e.pointerId);
    const g = geom(tb);
    const c = toSvg(e.clientX, e.clientY);
    interactionRef.current = {
      kind: "drag", id: tb.id, startX: c.x, startY: c.y, origX: g.x, origY: g.y, moved: false,
    };
  };

  const startResize = (e: React.PointerEvent, tb: FloorTable, corner: Corner) => {
    e.preventDefault();
    e.stopPropagation();
    commit();
    (e.target as Element).setPointerCapture(e.pointerId);
    const g = geom(tb);
    const theta = (g.rot * Math.PI) / 180;
    const cx = g.x + g.w / 2;
    const cy = g.y + g.h / 2;
    const sign = CORNER_SIGN[corner];
    // The opposite corner stays fixed while dragging; precompute it in world space.
    const fixedLocal = { x: -sign.x * (g.w / 2), y: -sign.y * (g.h / 2) };
    const fw = rotate(fixedLocal, theta);
    interactionRef.current = {
      kind: "resize", id: tb.id, sign, theta, fixed: { x: cx + fw.x, y: cy + fw.y }, rot: g.rot,
    };
  };

  const startRotate = (e: React.PointerEvent, tb: FloorTable) => {
    e.preventDefault();
    e.stopPropagation();
    commit();
    (e.target as Element).setPointerCapture(e.pointerId);
    const g = geom(tb);
    interactionRef.current = { kind: "rotate", id: tb.id, cx: g.x + g.w / 2, cy: g.y + g.h / 2 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const it = interactionRef.current;
    if (!it) return;

    if (it.kind === "pan") {
      const dx = (e.clientX - it.clientX) / view.zoom;
      const dy = (e.clientY - it.clientY) / view.zoom;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) it.moved = true;
      setView((v) => ({ ...v, x: it.origX - dx, y: it.origY - dy }));
      return;
    }

    const tb = tables.find((x) => x.id === it.id);
    if (!tb) return;
    const g = geom(tb);
    const p = toSvg(e.clientX, e.clientY);

    if (it.kind === "drag") {
      if (Math.abs(p.x - it.startX) > 2 || Math.abs(p.y - it.startY) > 2) it.moved = true;
      if (!it.moved) return;
      // No clamping: the plane is unbounded, so a table may be dragged past
      // the section's nominal extent (and into negative space) without being
      // silently pinned to an edge that no longer means anything.
      const nx = snapTo(it.origX + (p.x - it.startX), snapOn);
      const ny = snapTo(it.origY + (p.y - it.startY), snapOn);
      setTableGeom(tb.id, { ...g, x: nx, y: ny });
    } else if (it.kind === "resize") {
      const v = rotate({ x: p.x - it.fixed.x, y: p.y - it.fixed.y }, -it.theta);
      const w = Math.max(MIN_TABLE_SIZE, snapTo(it.sign.x * v.x, snapOn));
      const h = Math.max(MIN_TABLE_SIZE, snapTo(it.sign.y * v.y, snapOn));
      const centerFromFixed = rotate({ x: it.sign.x * (w / 2), y: it.sign.y * (h / 2) }, it.theta);
      const cx = it.fixed.x + centerFromFixed.x;
      const cy = it.fixed.y + centerFromFixed.y;
      setTableGeom(tb.id, { x: cx - w / 2, y: cy - h / 2, w, h, rot: it.rot });
    } else {
      const deg = (Math.atan2(p.y - it.cy, p.x - it.cx) * 180) / Math.PI + 90;
      const rot = normalizeAngle(snapOn ? Math.round(deg / ROTATION_STEP) * ROTATION_STEP : Math.round(deg));
      setTableGeom(tb.id, { ...g, rot });
    }
  };

  const onPointerUp = () => {
    const it = interactionRef.current;
    interactionRef.current = null;
    // A press without movement is a select, not a drag.
    if (it?.kind === "drag" && !it.moved) setSelectedId(it.id);
    // …and a grab of empty floor that never moved is a deselect, not a pan.
    if (it?.kind === "pan" && !it.moved) setSelectedId(null);
  };

  // ── Keyboard: nudge, delete, deselect ─────────────────────────────────────

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Undo/redo first, and with nothing selected — the thing you want to take
    // back may well be the move that lost your selection.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
      return;
    }

    // Viewport keys work with nothing selected — panning and zooming are about
    // the room, not about a table.
    if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomAbout(ZOOM_STEP); return; }
    if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomAbout(1 / ZOOM_STEP); return; }
    if (e.key === "0") { e.preventDefault(); fitToContent(); return; }

    if (!selected) return;
    const g = geom(selected);
    const step = e.shiftKey ? 1 : snapOn ? GRID : 1;
    const move = (dx: number, dy: number) => {
      e.preventDefault();
      commit();
      setTableGeom(selected.id, {
        ...g,
        x: g.x + dx * step,
        y: g.y + dy * step,
      });
    };
    switch (e.key) {
      case "ArrowLeft": move(-1, 0); break;
      case "ArrowRight": move(1, 0); break;
      case "ArrowUp": move(0, -1); break;
      case "ArrowDown": move(0, 1); break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        void removeTable(selected);
        break;
      case "Escape":
        setSelectedId(null);
        break;
    }
  };

  // ── Mutations ─────────────────────────────────────────────────────────────

  const onSaveLayout = async () => {
    setSaving(true);
    try {
      await saveLayout({
        branch_id: branchId,
        tables: Object.entries(geo).map(([id, g]) => {
          const tb = tables.find((x) => x.id === id);
          return {
            id,
            // save_layout always writes section_id — keep the current one.
            section_id: tb?.section_id ?? null,
            pos_x: g.x,
            pos_y: g.y,
            width: g.w,
            height: g.h,
            rotation: g.rot,
          };
        }),
      });
      toast.success(t("floor.layoutSaved", "Layout saved"));
      resetGeo();
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  /** Blueprint-only edits; live status + section moves belong to the POS. */
  const patchTable = async (
    tb: FloorTable,
    patch: Partial<{ label: string; seats: number; shape: string }>,
  ) => {
    try {
      await updateFloorTable(tb.id, patch);
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const duplicateTable = async (tb: FloorTable) => {
    const g = geom(tb);
    try {
      const created = await createFloorTable({
        branch_id: branchId,
        label: t("floor.copyOf", "{{label}} copy", { label: tb.label }),
        seats: tb.seats,
        shape: tb.shape,
        section_id: tb.section_id,
        pos_x: g.x + GRID * 2,
        pos_y: g.y + GRID * 2,
        width: g.w,
        height: g.h,
        rotation: g.rot,
      });
      toast.success(t("floor.tableCreated", "Table created"));
      void invalidateFloor();
      setSelectedId(created.id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const removeTable = async (tb: FloorTable) => {
    const ok = await confirm({
      title: t("common.confirmDelete", { name: tb.label, defaultValue: `Delete "${tb.label}"?` }),
      destructive: true,
      confirmLabel: t("common.delete", "Delete"),
    });
    if (!ok) return;
    try {
      await deleteFloorTable(tb.id);
      toast.success(t("floor.tableDeleted", "Table deleted"));
      setSelectedId(null);
      // Drop the table from the pending geometry AND from history: undoing
      // onto a row the server no longer has would resurrect a ghost.
      const { [tb.id]: _gone, ...rest } = geoRef.current;
      setGeo(rest);
      setHistory((h) => ({
        past: h.past.map(({ [tb.id]: _drop, ...keep }) => keep),
        future: h.future.map(({ [tb.id]: _drop, ...keep }) => keep),
      }));
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const rotateBy = (tb: FloorTable, deg: number) => {
    commit();
    const g = geom(tb);
    setTableGeom(tb.id, { ...g, rot: normalizeAngle(Math.round((g.rot + deg) / ROTATION_STEP) * ROTATION_STEP) });
  };

  const moveSection = async (sec: FloorSection, dir: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === sec.id);
    const swapWith = sections[idx + dir];
    if (!swapWith) return;
    try {
      const next = [...sections];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      // Re-index the whole list so stale/duplicate orderings self-heal.
      await Promise.all(
        next.map((s, i) => (s.ordering === i ? Promise.resolve() : updateSection(s.id, { ordering: i }).then(() => undefined))),
      );
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const removeSection = async (sec: FloorSection) => {
    const count = tables.filter((tb) => tb.section_id === sec.id).length;
    const ok = await confirm({
      title: t("common.confirmDelete", { name: sec.name, defaultValue: `Delete "${sec.name}"?` }),
      description:
        count > 0
          ? t("floor.deleteSectionTables", "{{count}} tables here will move to Unassigned.", { count })
          : undefined,
      destructive: true,
      confirmLabel: t("common.delete", "Delete"),
    });
    if (!ok) return;
    try {
      await deleteSection(sec.id);
      toast.success(t("floor.sectionDeleted", "Section deleted"));
      if (activeKey === sec.id) setActiveKey(null);
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!sectionsQ.isLoading && !tablesQ.isLoading && sections.length === 0 && tables.length === 0) {
    return (
      <>
        <EmptyState
          icon={LayoutGrid}
          title={t("floor.noFloorYet", "No floor plan yet")}
          description={t("floor.noFloorYetHint", "Create a section for each area — main hall, terrace, upstairs — then add tables and arrange them.")}
          action={
            <Button onClick={() => setSectionDialog({ open: true, section: null })}>
              <Plus className="size-4" /> {t("floor.newSection", "New section")}
            </Button>
          }
        />
        <SectionDialog
          branchId={branchId}
          section={sectionDialog.section}
          nextOrdering={sections.length}
          open={sectionDialog.open}
          onOpenChange={(o) => setSectionDialog((d) => ({ ...d, open: o }))}
          onCreated={(id) => setActiveKey(id)}
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar: section tabs + actions */}
      <div className="flex flex-wrap items-center gap-2">
        {sections.map((s) => {
          const active = s.id === sectionId;
          return (
            <span key={s.id} className="flex items-center">
              <Button
                size="sm"
                variant={active ? "default" : "outline"}
                className={active ? "rounded-e-none" : undefined}
                aria-current={active ? "true" : undefined}
                onClick={() => void switchSection(s.id)}
              >
                {s.name}
              </Button>
              {active ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      className="rounded-s-none border-s border-s-primary-foreground/20 px-1.5"
                      aria-label={t("floor.sectionMenu", "Section options")}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setSectionDialog({ open: true, section: s })}>
                      <Settings2 className="size-4" /> {t("floor.sectionSettings", "Section settings")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={sections[0]?.id === s.id}
                      onClick={() => void moveSection(s, -1)}
                    >
                      {t("floor.moveEarlier", "Move earlier")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={sections[sections.length - 1]?.id === s.id}
                      onClick={() => void moveSection(s, 1)}
                    >
                      {t("floor.moveLater", "Move later")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => void removeSection(s)}>
                      <Trash2 className="size-4" /> {t("floor.deleteSection", "Delete section")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </span>
          );
        })}
        {hasUnassigned ? (
          <Button
            size="sm"
            variant={sectionId === null ? "default" : "outline"}
            aria-current={sectionId === null ? "true" : undefined}
            onClick={() => void switchSection(UNASSIGNED)}
          >
            {t("floor.unassigned", "Unassigned")}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => setSectionDialog({ open: true, section: null })}>
          <Plus className="size-4" /> {t("floor.newSection", "New section")}
        </Button>

        <div className="ms-auto flex items-center gap-2">
          {dirty ? (
            <span className="text-xs text-warning">{t("floor.unsavedChanges", "Unsaved changes")}</span>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant={snapOn ? "secondary" : "ghost"}
                aria-pressed={snapOn}
                aria-label={t("floor.snapToGrid", "Snap to grid")}
                onClick={() => setSnapOn((v) => !v)}
              >
                <Magnet className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("floor.snapToGrid", "Snap to grid")}</TooltipContent>
          </Tooltip>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> {t("floor.addTable", "Add table")}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm" variant="outline"
                disabled={history.past.length === 0}
                onClick={undo}
                aria-label={t("floor.undo", "Undo")}
              >
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("floor.undo", "Undo")} · ⌘Z</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm" variant="outline"
                disabled={history.future.length === 0}
                onClick={redo}
                aria-label={t("floor.redo", "Redo")}
              >
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("floor.redo", "Redo")} · ⇧⌘Z</TooltipContent>
          </Tooltip>
          <Button size="sm" disabled={!dirty} loading={saving} onClick={() => void onSaveLayout()}>
            {!saving ? <Save className="size-4" /> : null} {t("floor.saveLayout", "Save layout")}
          </Button>
        </div>
      </div>

      <StatusLegend />

      {/* Canvas */}
      <div
        className="relative overflow-hidden rounded-xl border bg-muted/20 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        role="application"
        aria-label={t("floor.canvasAria", "Floor canvas. Select a table, use arrow keys to nudge, Delete to remove.")}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <svg
          ref={svgRef}
          viewBox={`${vr.x} ${vr.y} ${vr.w} ${vr.h}`}
          // A fixed viewport onto the plane, rather than a box shaped by the
          // section's stored size — the room is no longer what bounds the view.
          className="h-[clamp(320px,58vh,720px)] w-full touch-none select-none"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget || (e.target as Element).id === "floor-editor-bg") {
              startPan(e);
            }
          }}
        >
          <defs>
            <pattern id="floorgrid-minor" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.35" />
            </pattern>
            <pattern id="floorgrid-major" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`} fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.6" />
            </pattern>
            <FloorDefs />
          </defs>
          {/* The grid follows the viewport and the patterns tile forever, so the
              floor never runs out from under you however far you pan. */}
          <rect
            id="floor-editor-bg"
            x={vr.x} y={vr.y} width={vr.w} height={vr.h}
            fill="url(#floorgrid-minor)"
            className="cursor-grab active:cursor-grabbing"
          />
          <rect
            x={vr.x} y={vr.y} width={vr.w} height={vr.h}
            fill="url(#floorgrid-major)" style={{ pointerEvents: "none" }}
          />
          {visibleTables.map((tb) => {
            const g = geom(tb);
            const isSel = tb.id === selectedId;
            return (
              <g
                key={tb.id}
                tabIndex={0}
                role="button"
                aria-label={`${tb.label} · ${tb.seats} ${t("floor.seatsShort", "seats")} · ${t(`floor.tone_${toneFor(tb)}`)}`}
                aria-pressed={isSel}
                className="cursor-grab outline-none active:cursor-grabbing"
                onFocus={() => setSelectedId(tb.id)}
                onPointerDown={(e) => startDrag(e, tb)}
              >
                <TableGlyph
                  x={g.x} y={g.y} w={g.w} h={g.h} rotation={g.rot}
                  shape={tb.shape} label={tb.label} seats={tb.seats}
                  seatsWord={t("floor.seatsShort", "seats")}
                  status={tb.status} selected={isSel} inactive={!tb.is_active}
                >
                  {isSel ? (
                    <>
                      {/* Rotation handle */}
                      <line
                        x1={g.x + g.w / 2} y1={g.y} x2={g.x + g.w / 2} y2={g.y - 22}
                        stroke="var(--color-ring)" strokeWidth={1.5}
                      />
                      <circle
                        cx={g.x + g.w / 2} cy={g.y - 26} r={7}
                        fill="var(--color-card)" stroke="var(--color-ring)" strokeWidth={2}
                        style={{ cursor: "grab" }}
                        onPointerDown={(e) => startRotate(e, tb)}
                      />
                      {/* Corner resize handles */}
                      {(Object.keys(CORNER_SIGN) as Corner[]).map((corner) => {
                        const s = CORNER_SIGN[corner];
                        const hx = g.x + g.w / 2 + s.x * (g.w / 2);
                        const hy = g.y + g.h / 2 + s.y * (g.h / 2);
                        return (
                          <rect
                            key={corner}
                            x={hx - 5} y={hy - 5} width={10} height={10} rx={2}
                            fill="var(--color-card)" stroke="var(--color-ring)" strokeWidth={2}
                            style={{ cursor: CORNER_CURSOR[corner] }}
                            onPointerDown={(e) => startResize(e, tb, corner)}
                          />
                        );
                      })}
                    </>
                  ) : null}
                </TableGlyph>
              </g>
            );
          })}
        </svg>

        {/* Zoom controls. The wheel is the fast path, but it is a pointer-only
            one — these are the keyboard-reachable equivalent, and they also
            say what the current zoom IS, which the wheel never does. */}
        <div className="absolute bottom-3 end-3 flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
          <Button
            size="icon-xs" variant="ghost"
            onClick={() => zoomAbout(1 / ZOOM_STEP)}
            disabled={view.zoom <= ZOOM_MIN + 1e-6}
            aria-label={t("floor.zoomOut", "Zoom out")}
          >
            <Minus className="size-4" />
          </Button>
          <button
            type="button"
            onClick={fitToContent}
            className="min-w-14 rounded px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground hover:bg-accent hover:text-foreground"
            title={t("floor.fit", "Fit to room")}
          >
            {Math.round(view.zoom * 100)}%
          </button>
          <Button
            size="icon-xs" variant="ghost"
            onClick={() => zoomAbout(ZOOM_STEP)}
            disabled={view.zoom >= ZOOM_MAX - 1e-6}
            aria-label={t("floor.zoomIn", "Zoom in")}
          >
            <PlusIcon className="size-4" />
          </Button>
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
          <Button
            size="icon-xs" variant="ghost"
            onClick={fitToContent}
            aria-label={t("floor.fit", "Fit to room")}
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>

        {visibleTables.length === 0 && !tablesQ.isLoading ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-xl border bg-card/95 p-6 text-center shadow-sm">
              <p className="text-sm font-medium">{t("floor.noTables", "No tables here yet")}</p>
              <p className="max-w-64 text-xs text-muted-foreground">
                {t("floor.noTablesHint", "Add a table, then drag it into place. Corners resize, the top handle rotates.")}
              </p>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" /> {t("floor.addTable", "Add table")}
              </Button>
            </div>
          </div>
        ) : null}

        {selected ? (
          <PropertiesPanel
            table={selected}
            geometry={geom(selected)}
            onPatch={(patch) => void patchTable(selected, patch)}
            onRotateBy={(deg) => rotateBy(selected, deg)}
            onDuplicate={() => void duplicateTable(selected)}
            onDelete={() => void removeTable(selected)}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          "floor.editorHint",
          "Drag the floor to pan · scroll to zoom · drag a table to move · corners resize · top handle rotates · arrow keys nudge · ⌘Z undoes. Geometry is applied when you save the layout.",
        )}
      </p>

      <AddTableDialog
        branchId={branchId}
        sectionId={sectionId}
        sections={sections}
        tables={tables}
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(tb) => setSelectedId(tb.id)}
      />
      <SectionDialog
        branchId={branchId}
        section={sectionDialog.section}
        nextOrdering={sections.length}
        open={sectionDialog.open}
        onOpenChange={(o) => setSectionDialog((d) => ({ ...d, open: o }))}
        onCreated={(id) => setActiveKey(id)}
      />
    </div>
  );
}
