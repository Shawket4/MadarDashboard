import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Plus, Save, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import {
  useListSections, useListFloorTables, createSection, deleteFloorTable, setTableStatus, saveLayout,
} from "@/data/api/generated/api";
import type { FloorTable } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { TableDialog } from "./table-dialog";
import { invalidateFloor, TABLE_STATUS_STYLE } from "./util";

const DEFAULT_W = 1000;
const DEFAULT_H = 700;
const STATUSES = ["free", "held", "seated", "dirty"] as const;

interface DragState {
  id: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
}

export function FloorEditor({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const sectionsQ = useListSections({ branch_id: branchId }, { query: { enabled: !!branchId } });
  const tablesQ = useListFloorTables({ branch_id: branchId }, { query: { enabled: !!branchId } });
  const sections = useMemo(() => sectionsQ.data ?? [], [sectionsQ.data]);
  const tables = useMemo(() => tablesQ.data ?? [], [tablesQ.data]);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<FloorTable | null>(null);
  // Local position overrides while dragging, keyed by table id.
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resolve the section being edited: explicit choice, else first section, else
  // the "unassigned" pseudo-section (tables with no section_id).
  const sectionId = activeSection ?? sections[0]?.id ?? null;
  const section = sections.find((s) => s.id === sectionId) ?? null;
  const canvasW = section?.canvas_w ?? DEFAULT_W;
  const canvasH = section?.canvas_h ?? DEFAULT_H;

  const visibleTables = useMemo(
    () => tables.filter((tb) => (tb.section_id ?? null) === (sectionId ?? null)),
    [tables, sectionId],
  );
  const selected = visibleTables.find((tb) => tb.id === selectedId) ?? null;

  const pos = (tb: FloorTable) => positions[tb.id] ?? { x: tb.pos_x, y: tb.pos_y };

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

  const onPointerDown = (e: React.PointerEvent, tb: FloorTable) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = pos(tb);
    const c = toSvg(e.clientX, e.clientY);
    dragRef.current = { id: tb.id, startX: c.x, startY: c.y, origX: p.x, origY: p.y, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent, tb: FloorTable) => {
    const d = dragRef.current;
    if (!d || d.id !== tb.id) return;
    const c = toSvg(e.clientX, e.clientY);
    const nx = Math.max(0, Math.min(canvasW - tb.width, d.origX + (c.x - d.startX)));
    const ny = Math.max(0, Math.min(canvasH - tb.height, d.origY + (c.y - d.startY)));
    if (Math.abs(c.x - d.startX) > 2 || Math.abs(c.y - d.startY) > 2) d.moved = true;
    setPositions((prev) => ({ ...prev, [tb.id]: { x: nx, y: ny } }));
    if (d.moved) setDirty(true);
  };

  const onPointerUp = (tb: FloorTable) => {
    const d = dragRef.current;
    dragRef.current = null;
    // A press without movement is a select, not a drag.
    if (d && !d.moved) setSelectedId(tb.id);
  };

  const onSaveLayout = async () => {
    setSaving(true);
    try {
      await saveLayout({
        branch_id: branchId,
        tables: visibleTables.map((tb) => {
          const p = pos(tb);
          return {
            id: tb.id,
            section_id: tb.section_id,
            pos_x: p.x,
            pos_y: p.y,
            width: tb.width,
            height: tb.height,
            rotation: tb.rotation,
          };
        }),
      });
      toast.success(t("reservations.layoutSaved", "Layout saved"));
      setDirty(false);
      setPositions({});
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addSection = async () => {
    try {
      const created = await createSection({
        branch_id: branchId,
        name: t("reservations.areaN", "Area {{n}}", { n: sections.length + 1 }),
      });
      toast.success(t("reservations.sectionCreated", "Section created"));
      void invalidateFloor();
      setActiveSection(created.id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const setStatus = async (tb: FloorTable, status: string) => {
    try {
      await setTableStatus(tb.id, { status });
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const removeTable = async (tb: FloorTable) => {
    if (
      await confirm({
        title: t("common.confirmDelete", { name: tb.label, defaultValue: `Delete "${tb.label}"?` }),
        destructive: true,
        confirmLabel: t("common.delete", "Delete"),
      })
    ) {
      try {
        await deleteFloorTable(tb.id);
        toast.success(t("reservations.tableDeleted", "Table deleted"));
        setSelectedId(null);
        void invalidateFloor();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    }
  };

  const openNewTable = () => { setEditingTable(null); setDialogOpen(true); };
  const openEditTable = (tb: FloorTable) => { setEditingTable(tb); setDialogOpen(true); };

  return (
    <div className="space-y-3">
      {/* Section tabs + actions */}
      <div className="flex flex-wrap items-center gap-2">
        {sections.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={s.id === sectionId ? "default" : "outline"}
            onClick={() => { setActiveSection(s.id); setSelectedId(null); }}
          >
            {s.name}
          </Button>
        ))}
        {tables.some((tb) => !tb.section_id) ? (
          <Button
            size="sm"
            variant={sectionId === null ? "default" : "outline"}
            onClick={() => { setActiveSection(null); setSelectedId(null); }}
          >
            {t("reservations.unassigned", "Unassigned")}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => void addSection()}>
          <Plus className="size-4" /> {t("reservations.addSection", "Add section")}
        </Button>
        <div className="ms-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={openNewTable}>
            <Plus className="size-4" /> {t("reservations.newTable", "New table")}
          </Button>
          <Button size="sm" disabled={!dirty || saving} onClick={() => void onSaveLayout()}>
            <Save className="size-4" /> {saving ? t("common.saving", "Saving…") : t("reservations.saveLayout", "Save layout")}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: TABLE_STATUS_STYLE[s].fill }} />
            {t(`reservations.status_${s}`, TABLE_STATUS_STYLE[s].label)}
          </span>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        {/* Canvas */}
        <div className="overflow-hidden rounded-xl border bg-muted/20">
          {visibleTables.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title={t("reservations.noTables", "No tables here yet")}
              description={t("reservations.noTablesHint", "Add a table, then drag it to position it on the floor.")}
              action={<Button onClick={openNewTable}><Plus className="size-4" /> {t("reservations.newTable", "New table")}</Button>}
            />
          ) : (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${canvasW} ${canvasH}`}
              className="h-auto w-full touch-none select-none"
              style={{ aspectRatio: `${canvasW} / ${canvasH}` }}
            >
              {/* grid */}
              <defs>
                <pattern id="floorgrid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.5" />
                </pattern>
              </defs>
              <rect width={canvasW} height={canvasH} fill="url(#floorgrid)" />
              {visibleTables.map((tb) => {
                const p = pos(tb);
                const cx = p.x + tb.width / 2;
                const cy = p.y + tb.height / 2;
                const style = TABLE_STATUS_STYLE[tb.status] ?? TABLE_STATUS_STYLE.free;
                const isSel = tb.id === selectedId;
                return (
                  <g
                    key={tb.id}
                    transform={`rotate(${tb.rotation} ${cx} ${cy})`}
                    onPointerDown={(e) => onPointerDown(e, tb)}
                    onPointerMove={(e) => onPointerMove(e, tb)}
                    onPointerUp={() => onPointerUp(tb)}
                    style={{ cursor: "grab" }}
                  >
                    {tb.shape === "circle" ? (
                      <ellipse
                        cx={cx} cy={cy} rx={tb.width / 2} ry={tb.height / 2}
                        fill={style.fill} fillOpacity={0.22}
                        stroke={style.ring} strokeWidth={isSel ? 4 : 2}
                      />
                    ) : (
                      <rect
                        x={p.x} y={p.y} width={tb.width} height={tb.height} rx={10}
                        fill={style.fill} fillOpacity={0.22}
                        stroke={style.ring} strokeWidth={isSel ? 4 : 2}
                      />
                    )}
                    <text x={cx} y={cy - 2} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--color-foreground)">
                      {tb.label}
                    </text>
                    <text x={cx} y={cy + 18} textAnchor="middle" fontSize={13} fill="var(--color-muted-foreground)">
                      {tb.seats} {t("reservations.seatsShort", "seats")}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Inspector */}
        <div className="rounded-xl border p-3">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">{selected.label}</div>
                <Badge variant="outline">{selected.seats} {t("reservations.seatsShort", "seats")}</Badge>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">{t("reservations.setStatus", "Set status")}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? "default" : "outline"}
                      onClick={() => void setStatus(selected, s)}
                    >
                      {t(`reservations.status_${s}`, TABLE_STATUS_STYLE[s].label)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditTable(selected)}>
                  <Pencil className="size-4" /> {t("common.edit", "Edit")}
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => void removeTable(selected)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("reservations.selectTableHint", "Select a table to set its status, edit, or delete it. Drag tables to arrange the floor, then Save layout.")}
            </p>
          )}
        </div>
      </div>

      <TableDialog
        branchId={branchId}
        sectionId={sectionId}
        sections={sections}
        table={editingTable}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
