/**
 * The inspector: what is selected, and what can be changed about it.
 *
 * Docked rather than floating. The old panel was absolutely positioned over the
 * canvas, which on a tablet covered the tables you were arranging — and it only
 * ever handled one table, because the old editor could only select one.
 *
 * Blueprint properties only. Live status belongs to the POS: whether a table is
 * seated or needs clearing is decided by the people standing in the room, and a
 * manager toggling it from a desk would be asserting something they cannot see.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { TableHistory } from "./table-history";
import { RotateCcw, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFloorTable } from "@/data/api/generated/api";
import type { FloorSection, FloorTable } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { ROTATION_STEP, invalidateFloor, normalizeAngle, type GeoItem } from "./util";

/** Input that keeps local state and commits on blur / Enter. */
function CommitInput({
  id, value, type = "text", min, max, onCommit,
}: {
  id: string;
  value: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <Input
      id={id}
      type={type}
      min={min}
      max={max}
      value={draft}
      className="h-8"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        // Keep canvas shortcuts (arrows, Delete, Cmd+A) out of a text field.
        e.stopPropagation();
      }}
    />
  );
}

export interface InspectorProps {
  tables: FloorTable[];
  sections: FloorSection[];
  editable: boolean;
  geoOf: (t: FloorTable) => GeoItem;
  onGeoChange: (updates: GeoItem[]) => void;
}

export function InspectorPanel({
  tables, sections, editable, geoOf, onGeoChange,
}: InspectorProps) {
  const { t } = useTranslation();

  if (tables.length === 0) {
    return (
      <div className="p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {editable
            ? t("floor.selectHint", "Select a table to edit it, or drag on the floor to select several.")
            : t("floor.lockedHint", "Unlock to rearrange the floor. Status is always live.")}
        </p>
      </div>
    );
  }

  const single = tables.length === 1 ? tables[0] : null;

  /** Blueprint patch — label / seats / shape. Not geometry, never status. */
  const patch = async (
    table: FloorTable,
    body: Partial<{ label: string; seats: number; shape: string }>,
  ) => {
    try {
      await updateFloorTable(table.id, body);
      await invalidateFloor();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const rotateBy = (deg: number) => {
    onGeoChange(
      tables.map((tb) => {
        const g = geoOf(tb);
        return { ...g, rot: normalizeAngle(g.rot + deg) };
      }),
    );
  };

  const seatsTotal = tables.reduce((sum, tb) => sum + tb.seats, 0);

  return (
    <div className="space-y-3 p-4" onKeyDown={(e) => e.stopPropagation()}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="truncate text-sm font-semibold">
          {single
            ? single.label
            : t("floor.selectedCount", "{{count}} tables", { count: tables.length })}
        </h2>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {t("floor.seatsTotal", "{{count}} seats", { count: seatsTotal })}
        </span>
      </div>

      {single ? (
        <>
          <div className="grid grid-cols-[1fr_72px] gap-2">
            <div className="space-y-1">
              <Label htmlFor="floor-label" className="text-xs text-muted-foreground">
                {t("floor.tableLabel", "Label")}
              </Label>
              <CommitInput
                id="floor-label"
                value={single.label}
                onCommit={(v) => {
                  if (v.trim()) void patch(single, { label: v.trim() });
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="floor-seats" className="text-xs text-muted-foreground">
                {t("floor.seats", "Seats")}
              </Label>
              <CommitInput
                id="floor-seats"
                type="number"
                min={0}
                max={99}
                value={String(single.seats)}
                onCommit={(v) => {
                  const n = Number(v);
                  if (Number.isInteger(n) && n >= 0 && n <= 99) void patch(single, { seats: n });
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t("floor.shape", "Shape")}</span>
            <div
              className="grid grid-cols-2 gap-1.5"
              role="radiogroup"
              aria-label={t("floor.shape", "Shape")}
            >
              {(["rect", "circle"] as const).map((s) => (
                <Button
                  key={s}
                  size="xs"
                  variant={single.shape === s ? "secondary" : "outline"}
                  role="radio"
                  aria-checked={single.shape === s}
                  disabled={!editable}
                  onClick={() => {
                    if (single.shape !== s) void patch(single, { shape: s });
                  }}
                >
                  {s === "rect"
                    ? t("floor.shapeRect", "Rectangle")
                    : t("floor.shapeCircle", "Circle")}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-[11px] tabular-nums text-muted-foreground" dir="ltr">
            {(() => {
              const g = geoOf(single);
              return `${Math.round(g.x)}, ${Math.round(g.y)} · ${Math.round(g.w)}×${Math.round(g.h)}`;
            })()}
          </p>

          {/* Which area a table belongs to is shown, not chosen: moving it
              between areas is a drag on the canvas, not a dropdown here. */}
          <p className="text-[11px] text-muted-foreground">
            {sections.find((s) => s.id === single.section_id)?.name ??
              t("floor.unassigned", "Unassigned")}
          </p>
        </>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(
            "floor.multiHint",
            "Rotate or align the whole selection. Labels and seats are edited one table at a time.",
          )}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-xs text-muted-foreground">{t("floor.rotation", "Rotation")}</span>
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="outline"
            disabled={!editable}
            onClick={() => rotateBy(-ROTATION_STEP)}
            aria-label={t("floor.rotateCcw", "Rotate anticlockwise")}
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <span className="w-10 text-center text-xs tabular-nums">
            {single ? `${Math.round(normalizeAngle(geoOf(single).rot))}°` : "—"}
          </span>
          <Button
            size="icon-xs"
            variant="outline"
            disabled={!editable}
            onClick={() => rotateBy(ROTATION_STEP)}
            aria-label={t("floor.rotateCw", "Rotate clockwise")}
          >
            <RotateCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* What this table has actually done. The panel authors geometry; this
          is the one thing here that is a READING, and it belongs beside the
          table it is about rather than on a report somebody has to go find. */}
      {single ? (
        <div className="-mx-4 border-t">
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("floor.history.title", "Last 30 days")}
          </p>
          <TableHistory tableId={single.id} />
        </div>
      ) : null}
    </div>
  );
}
