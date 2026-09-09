/**
 * The floor: one surface.
 *
 * Previously two tabs — "Live board" and "Editor" — over the same room, drawn
 * by two components from the same data. A floor plan is not two things, and the
 * split meant that checking whether table 12 was free and moving table 12 were
 * different places.
 *
 * Now: one canvas, always showing live status, with editing behind a lock so
 * nobody drags a table while glancing at the room mid-service. Sections filter
 * the same plane rather than switching between separate rooms, so a table can
 * be dragged from one into another.
 *
 * The dashboard AUTHORS the blueprint — geometry, labels, seats, shapes — and
 * OBSERVES live status. It never writes status: whether a table is free, seated
 * or needs clearing is decided by the people standing in the room, through the
 * POS.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Armchair, Check,
  ChevronDown, CloudOff, Copy, Loader2, Lock, LockOpen, Maximize2, Minus, Pencil,
  Plus, Redo2, Trash2, Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import { Page, PageHeader } from "@/components/app/page";
import { useConfirm } from "@/components/app/confirm-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionDialog } from "./section-dialog";
import type { FloorSection } from "@/data/api/generated/models";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useScope } from "@/data/scope/use-scope";
import { getErrorMessage } from "@/data/api/errors";
import { fmtTime } from "@/lib/format";
import {
  createFloorTable, deleteFloorTable, deleteSection, useListFloorTables,
  useListFloorTransfers, useListOpenTickets, useListSections,
} from "@/data/api/generated/api";

import { AddTableDialog } from "./add-table-dialog";
import { FloorCanvas } from "./floor-canvas";
import { InspectorPanel } from "./properties-panel";
import { StatusLegend } from "./status-legend";
import { TransferQueue } from "./transfer-queue";
import { useFloorGeometry, type SaveState } from "./use-floor-geometry";
import { useFloorViewport } from "./use-floor-viewport";
import {
  ZOOM_STEP, alignItems, distributeItems, invalidateFloor, isHeldNow, needsClearing,
  parseClipboard, serializeTables, snapTo, uniqueLabel, type Alignment, type GeoItem,
} from "./util";

const UNASSIGNED = "__unassigned__";
/** How far a pasted copy sits from where it was dropped, so it is visibly new. */
const PASTE_OFFSET = 20;

export function FloorPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const scope = useScope();
  const branchId = scope.branchId ?? null;

  const enabled = { query: { enabled: !!branchId } };
  const sectionsQ = useListSections({ branch_id: branchId ?? "" }, enabled);
  const tablesQ = useListFloorTables({ branch_id: branchId ?? "" }, enabled);
  const transfersQ = useListFloorTransfers({ branch_id: branchId ?? "" }, enabled);
  // Best-effort: without `open_tickets:read` the floor still renders, just
  // without ticket chips.
  const ticketsQ = useListOpenTickets(
    { branch_id: branchId ?? "" },
    { query: { enabled: !!branchId, retry: false } },
  );

  const sections = useMemo(
    () =>
      [...(sectionsQ.data ?? [])].sort(
        (a, b) => a.ordering - b.ordering || a.name.localeCompare(b.name),
      ),
    [sectionsQ.data],
  );
  const allTables = useMemo(() => tablesQ.data ?? [], [tablesQ.data]);

  const [editable, setEditable] = useState(false);
  const [sectionKey, setSectionKey] = useState<string | null>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  const viewport = useFloorViewport();
  const geometry = useFloorGeometry(branchId ?? "", allTables);
  const { geoOf, setGeo, beginGesture, undo, redo, canUndo, canRedo, saveState } = geometry;

  // Live updates arrive through the app shell's single branch stream
  // (`data/realtime/use-branch-realtime.ts`); every floor query is invalidated
  // there, so this page only renders what the cache holds.

  const visible = useMemo(() => {
    if (sectionKey === null) return allTables.filter((tb) => tb.is_active);
    const id = sectionKey === UNASSIGNED ? null : sectionKey;
    return allTables.filter((tb) => tb.is_active && (tb.section_id ?? null) === id);
  }, [allTables, sectionKey]);

  /**
   * Who is sitting where. An occupant is always an open ticket now: a parked
   * order is a POS-local draft with no server presence, so there is exactly one
   * source to read and no precedence rule to get wrong.
   */
  const occupants = useMemo(() => {
    const map = new Map<string, string>();
    for (const tk of ticketsQ.data ?? []) {
      if (tk.table_id && (tk.status === "open" || tk.status === "ready")) {
        map.set(tk.table_id, tk.ticket_ref ?? tk.customer_name ?? "#");
      }
    }
    return map;
  }, [ticketsQ.data]);

  /**
   * Today's booking per table, from the floor endpoint's `next_booking`. The
   * hold flips by the clock (`held_from`), not by an event, so a one-minute
   * tick keeps the tint honest between refetches.
   */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const reservations = useMemo(() => {
    const map = new Map<string, { label: string; held: boolean }>();
    for (const tb of allTables) {
      const nb = tb.next_booking;
      if (!nb || nb.status !== "confirmed") continue;
      map.set(tb.id, {
        label: `${nb.guest_name} · ${fmtTime(nb.starts_at)}`,
        held: isHeldNow(nb, now),
      });
    }
    return map;
  }, [allTables, now]);

  /**
   * Read-only capacity. The board exists so someone can decide where to seat a
   * party; a count answers that faster than scanning forty glyphs.
   */
  const capacity = useMemo(() => {
    let seats = 0;
    let taken = 0;
    let dirty = 0;
    for (const tb of visible) {
      seats += tb.seats;
      const occupant = occupants.get(tb.id) ?? null;
      if (occupant || tb.status === "seated") taken += tb.seats;
      else if (needsClearing(tb, occupant)) dirty += 1;
    }
    return { seats, free: seats - taken, dirty };
  }, [visible, occupants]);

  const selectedTables = useMemo(
    () => visible.filter((tb) => selection.has(tb.id)),
    [visible, selection],
  );

  // Frame the room once it is known, and again when the section filter changes.
  // Keyed so it does not fight the user's own panning on every refetch.
  const framedFor = useRef<string | null>(null);
  const { fitTo, attach: attachCanvas } = viewport;
  useEffect(() => {
    const key = `${sectionKey ?? "all"}:${visible.length}`;
    if (visible.length === 0 || framedFor.current === key) return;
    framedFor.current = key;
    fitTo(visible.map(geoOf));
  }, [visible, sectionKey, fitTo, geoOf]);

  // ── Clipboard ─────────────────────────────────────────────────────────────

  const copySelection = useCallback(async () => {
    if (selectedTables.length === 0) return;
    const payload = serializeTables(
      selectedTables.map((tb) => ({ label: tb.label, seats: tb.seats, shape: tb.shape })),
      selectedTables.map(geoOf),
    );
    try {
      await navigator.clipboard.writeText(payload);
      toast.success(t("floor.copied", "{{count}} copied", { count: selectedTables.length }));
    } catch {
      // Clipboard access can be refused (insecure origin, permission). Say so,
      // rather than failing silently on a keystroke nobody saw happen.
      toast.error(t("floor.clipboardFailed", "Could not use the clipboard"));
    }
  }, [selectedTables, geoOf, t]);

  const pasteTables = useCallback(async () => {
    if (!branchId || !editable) return;
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      toast.error(t("floor.clipboardFailed", "Could not use the clipboard"));
      return;
    }
    const items = parseClipboard(text);
    if (!items) return;

    const taken = new Set(allTables.map((tb) => tb.label));
    // Land the paste in the middle of what you are looking at, not wherever the
    // original happened to be — which may be off-screen entirely.
    const originX = snapTo(viewport.view.x + viewport.rect.w / 2, true);
    const originY = snapTo(viewport.view.y + viewport.rect.h / 2, true);
    const sectionId = sectionKey && sectionKey !== UNASSIGNED ? sectionKey : null;

    try {
      const created: string[] = [];
      for (const item of items) {
        const label = uniqueLabel(item.label, taken);
        taken.add(label);
        const row = await createFloorTable({
          branch_id: branchId,
          label,
          seats: item.seats,
          shape: item.shape,
          section_id: sectionId,
          pos_x: originX + item.dx + PASTE_OFFSET,
          pos_y: originY + item.dy + PASTE_OFFSET,
          width: item.w,
          height: item.h,
          rotation: item.rot,
        });
        created.push(row.id);
      }
      await invalidateFloor();
      setSelection(new Set(created));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [
    allTables, branchId, editable, sectionKey, t,
    viewport.view.x, viewport.view.y, viewport.rect.w, viewport.rect.h,
  ]);

  // ── Sections ──────────────────────────────────────────────────────────────
  //
  // The API has had create/rename/delete all along and the dialog was written;
  // nothing ever rendered it, so a branch could filter by section and never
  // make one. A room's areas are authored here, beside the tables they hold.
  const [sectionEdit, setSectionEdit] = useState<{ section: FloorSection | null } | null>(null);
  const activeSection = useMemo(
    () => (sectionKey && sectionKey !== UNASSIGNED
      ? sections.find((x) => x.id === sectionKey) ?? null
      : null),
    [sectionKey, sections],
  );

  const removeSection = useCallback(async () => {
    if (!activeSection) return;
    // Tables are NOT deleted with the section — the FK sets their `section_id`
    // to NULL, so they land in Unassigned. Saying so is the difference between
    // a confident click and a support ticket.
    const held = allTables.filter((tb) => tb.section_id === activeSection.id).length;
    const ok = await confirm({
      title: t("floor.deleteSectionTitle", "Delete “{{name}}”?", { name: activeSection.name }),
      description: held
        ? t("floor.deleteSectionBodyTables", {
            defaultValue:
              "Its {{count}} table(s) move to Unassigned — nothing is deleted and no order is affected.",
            count: held,
          })
        : t("floor.deleteSectionBody", "The area is removed. It holds no tables."),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteSection(activeSection.id);
      setSectionKey(null);
      await invalidateFloor();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [activeSection, allTables, confirm, t]);

  const deleteSelection = useCallback(async () => {
    if (!editable || selectedTables.length === 0) return;
    const ok = await confirm({
      title: t("floor.deleteTitle", "Delete {{count}} table(s)?", {
        count: selectedTables.length,
      }),
      description: t(
        "floor.deleteBody",
        "They are removed from the plan. Past orders that used them are unaffected.",
      ),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      for (const tb of selectedTables) await deleteFloorTable(tb.id);
      setSelection(new Set());
      await invalidateFloor();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [confirm, editable, selectedTables, t]);

  // ── Geometry commands ─────────────────────────────────────────────────────

  const nudge = useCallback(
    (dx: number, dy: number, fine: boolean) => {
      if (!editable || selectedTables.length === 0) return;
      beginGesture();
      const step = fine ? 1 : 10;
      setGeo(
        selectedTables.map((tb) => {
          const g = geoOf(tb);
          return { ...g, x: g.x + dx * step, y: g.y + dy * step };
        }),
      );
    },
    [beginGesture, editable, geoOf, selectedTables, setGeo],
  );

  const align = useCallback(
    (how: Alignment) => {
      const moved = alignItems(selectedTables.map(geoOf), how);
      if (moved.length === 0) return;
      beginGesture();
      setGeo(moved);
    },
    [beginGesture, geoOf, selectedTables, setGeo],
  );

  const distribute = useCallback(
    (axis: "x" | "y") => {
      const moved = distributeItems(selectedTables.map(geoOf), axis);
      if (moved.length === 0) return;
      beginGesture();
      setGeo(moved);
    },
    [beginGesture, geoOf, selectedTables, setGeo],
  );

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Never steal a keystroke from a text field — a label being renamed is
      // full of the same letters these shortcuts use.
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); setEditable((v) => !v); return; }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); void copySelection(); return; }
      if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); void pasteTables(); return; }
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelection(new Set(visible.map((tb) => tb.id)));
        return;
      }

      if (e.key === "+" || e.key === "=") { e.preventDefault(); viewport.zoomBy(ZOOM_STEP); return; }
      if (e.key === "-" || e.key === "_") { e.preventDefault(); viewport.zoomBy(1 / ZOOM_STEP); return; }
      if (e.key === "0") { e.preventDefault(); fitTo(visible.map(geoOf)); return; }
      if (e.key === "Escape") { setSelection(new Set()); return; }

      // Arrow nudging is the keyboard alternative to dragging (WCAG 2.2), and
      // the only way to place a table without a pointer.
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      };
      const delta = arrows[e.key];
      if (delta) { e.preventDefault(); nudge(delta[0], delta[1], e.shiftKey); return; }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        void deleteSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    copySelection, deleteSelection, fitTo, geoOf, nudge, pasteTables, redo, undo,
    viewport, visible,
  ]);

  if (!branchId) {
    return (
      <Page>
        <PageHeader title={t("floor.title", "Floor")} />
        <EmptyState
          icon={Armchair}
          title={t("floor.pickBranch", "Select a branch in the top bar to see its floor")}
        />
      </Page>
    );
  }

  const loading = tablesQ.isLoading || sectionsQ.isLoading;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2 sm:px-4">
        <h1 className="me-1 text-sm font-semibold tracking-tight">{t("floor.title", "Floor")}</h1>

        {/* Sections filter one plane; they are not separate rooms. */}
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <SectionChip active={sectionKey === null} onClick={() => setSectionKey(null)}>
            {t("floor.allAreas", "All")}
          </SectionChip>
          {sections.map((s) => (
            <SectionChip key={s.id} active={sectionKey === s.id} onClick={() => setSectionKey(s.id)}>
              {s.name}
            </SectionChip>
          ))}
          {allTables.some((tb) => !tb.section_id) ? (
            <SectionChip
              active={sectionKey === UNASSIGNED}
              onClick={() => setSectionKey(UNASSIGNED)}
            >
              {t("floor.unassigned", "Unassigned")}
            </SectionChip>
          ) : null}

          {/* Authoring sits with the filter rather than in a settings page
              elsewhere: the chips ARE the list of areas, so this is where a
              person looks for the one that is missing. Edit and delete hang off
              the SELECTED chip, so the row stays a filter until you mean
              otherwise. */}
          {editable ? (
            <>
              <SectionChip active={false} onClick={() => setSectionEdit({ section: null })}>
                <span className="flex items-center gap-1">
                  <Plus className="size-3" />
                  {t("floor.addSection", "Area")}
                </span>
              </SectionChip>
              {activeSection ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("floor.sectionActions", "Area actions")}
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onSelect={() => setSectionEdit({ section: activeSection })}
                    >
                      <Pencil className="size-4" />
                      {t("floor.renameSection", "Rename")}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => void removeSection()}>
                      <Trash2 className="size-4" />
                      {t("common.delete", "Delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="ms-auto flex items-center gap-1">
          <SaveIndicator state={saveState} editable={editable} />
          <IconButton label={t("floor.zoomOut", "Zoom out")} onClick={() => viewport.zoomBy(1 / ZOOM_STEP)}>
            <Minus className="size-4" />
          </IconButton>
          <IconButton label={t("floor.fit", "Fit to content")} onClick={() => fitTo(visible.map(geoOf))}>
            <Maximize2 className="size-4" />
          </IconButton>
          <IconButton label={t("floor.zoomIn", "Zoom in")} onClick={() => viewport.zoomBy(ZOOM_STEP)}>
            <Plus className="size-4" />
          </IconButton>

          <Button
            variant={editable ? "default" : "outline"}
            size="sm"
            className="ms-1 gap-1.5"
            onClick={() => setEditable((v) => !v)}
            aria-pressed={editable}
          >
            {editable ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
            <span className="hidden sm:inline">
              {editable ? t("floor.editing", "Editing") : t("floor.locked", "Locked")}
            </span>
          </Button>
        </div>
      </div>

      {/* ── Edit toolbar ───────────────────────────────────────────────── */}
      {editable ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-border/70 bg-muted/30 px-3 py-1.5 sm:px-4">
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            {t("floor.addTable", "Add table")}
          </Button>
          <Divider />
          <IconButton label={t("floor.undo", "Undo")} onClick={undo} disabled={!canUndo}>
            <Undo2 className="size-4" />
          </IconButton>
          <IconButton label={t("floor.redo", "Redo")} onClick={redo} disabled={!canRedo}>
            <Redo2 className="size-4" />
          </IconButton>
          <Divider />
          <IconButton
            label={t("floor.alignH", "Align horizontal centres")}
            onClick={() => align("hcenter")}
            disabled={selection.size < 2}
          >
            <AlignHorizontalJustifyCenter className="size-4" />
          </IconButton>
          <IconButton
            label={t("floor.alignV", "Align vertical centres")}
            onClick={() => align("vcenter")}
            disabled={selection.size < 2}
          >
            <AlignVerticalJustifyCenter className="size-4" />
          </IconButton>
          <IconButton
            label={t("floor.spaceH", "Space evenly across")}
            onClick={() => distribute("x")}
            disabled={selection.size < 3}
          >
            <span aria-hidden className="text-xs font-semibold">⇹</span>
          </IconButton>
          <Divider />
          <IconButton
            label={t("floor.copy", "Copy")}
            onClick={() => void copySelection()}
            disabled={selection.size === 0}
          >
            <Copy className="size-4" />
          </IconButton>
          <IconButton
            label={t("common.delete", "Delete")}
            onClick={() => void deleteSelection()}
            disabled={selection.size === 0}
          >
            <Trash2 className="size-4 text-destructive" />
          </IconButton>

          <span className="ms-auto hidden text-[11px] text-muted-foreground lg:inline">
            {t("floor.hint", "Drag to move · ⌥ ignores the grid · ⌘C/⌘V · pinch to zoom")}
          </span>
        </div>
      ) : null}

      {/* ── Canvas + inspector ─────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div
          className="relative min-h-[45svh] flex-1 xl:min-h-0"
          ref={attachCanvas}
        >
          {loading ? (
            <Skeleton className="absolute inset-3" />
          ) : visible.length === 0 ? (
            <div className="grid h-full place-items-center p-6 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                {editable
                  ? t("floor.emptyEditing", "No tables here yet — add one to start the plan.")
                  : t("floor.empty", "No tables in this area yet. Unlock to add some.")}
              </p>
            </div>
          ) : (
            <FloorCanvas
              tables={visible}
              geoOf={geoOf}
              occupants={occupants}
              reservations={reservations}
              selection={selection}
              onSelectionChange={setSelection}
              editable={editable}
              viewport={viewport}
              beginGesture={beginGesture}
              onGeoChange={setGeo}
            />
          )}

          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
            <StatusLegend />
            <div className="rounded-lg border border-border/70 bg-background/90 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
              {t("floor.capacity", "{{free}} of {{seats}} seats free", {
                free: capacity.free,
                seats: capacity.seats,
              })}
              {capacity.dirty > 0
                ? ` · ${t("floor.needsClearingCount", "{{count}} need clearing", { count: capacity.dirty })}`
                : ""}
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 overflow-y-auto border-t border-border/70 xl:w-[320px] xl:border-s xl:border-t-0">
          <InspectorPanel
            tables={selectedTables}
            sections={sections}
            editable={editable}
            geoOf={geoOf}
            onGeoChange={(u: GeoItem[]) => {
              beginGesture();
              setGeo(u);
            }}
          />
          <TransferQueue
            transfers={transfersQ.data?.transfers ?? []}
            tables={allTables}
            sections={sections}
          />
        </aside>
      </div>

      <AddTableDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        branchId={branchId}
        sectionId={sectionKey && sectionKey !== UNASSIGNED ? sectionKey : null}
        sections={sections}
        tables={allTables}
        onCreated={() => void invalidateFloor()}
      />

      {sectionEdit ? (
        <SectionDialog
          open
          onOpenChange={(o) => {
            if (!o) setSectionEdit(null);
          }}
          branchId={branchId ?? ""}
          section={sectionEdit.section}
          // Append: sections are ordered, and a new one belongs after the ones
          // already there rather than fighting an existing slot.
          nextOrdering={sections.length}
          // Select what was just made, so the next thing a person does — adding
          // tables to it — happens in the area they created.
          onCreated={(id) => setSectionKey(id)}
        />
      ) : null}
    </div>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-4 w-px bg-border" />;

function SectionChip({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  label, onClick, disabled, children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClick} disabled={disabled}>
          {children}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Autosave removed the Save button, which also removed the answer to "did that
 * save?". Without a status people drag things twice to be sure, so the state is
 * always visible while editing — including, loudly, when it did NOT save.
 */
function SaveIndicator({ state, editable }: { state: SaveState; editable: boolean }) {
  const { t } = useTranslation();
  if (!editable || state === "idle") return null;

  const spinner = <Loader2 className="size-3 animate-spin" />;
  const map: Record<Exclude<SaveState, "idle">, { icon: React.ReactNode; text: string; tone: string }> = {
    pending: { icon: spinner, text: t("floor.saving", "Saving…"), tone: "text-muted-foreground" },
    saving: { icon: spinner, text: t("floor.saving", "Saving…"), tone: "text-muted-foreground" },
    saved: { icon: <Check className="size-3" />, text: t("floor.saved", "Saved"), tone: "text-muted-foreground" },
    conflict: { icon: <CloudOff className="size-3" />, text: t("floor.notSaved", "Not saved"), tone: "text-destructive" },
    error: { icon: <CloudOff className="size-3" />, text: t("floor.notSaved", "Not saved"), tone: "text-destructive" },
  };
  const v = map[state];

  return (
    <span className={cn("me-1 flex items-center gap-1 text-[11px]", v.tone)} role="status">
      {v.icon}
      <span className="hidden sm:inline">{v.text}</span>
    </span>
  );
}
