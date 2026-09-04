import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, RotateCcw, RotateCw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FloorTable } from "@/data/api/generated/models";
import { normalizeAngle } from "./util";
import type { Geometry } from "./floor-editor";

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
        e.stopPropagation(); // keep canvas shortcuts (arrows/Delete) out of inputs
      }}
    />
  );
}

interface Props {
  table: FloorTable;
  geometry: Geometry;
  onPatch: (patch: Partial<{ label: string; seats: number; shape: string }>) => void;
  onRotateBy: (deg: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Floating inspector for the selected table — blueprint properties only.
 * Live status and section moves belong to the POS (`PATCH /floor/tables/{id}/state`);
 * a table's section is chosen once, at creation.
 */
export function PropertiesPanel({
  table, geometry, onPatch, onRotateBy, onDuplicate, onDelete, onClose,
}: Props) {
  const { t } = useTranslation();
  const g = geometry;

  return (
    <div
      className="absolute end-3 top-3 z-10 w-60 rounded-lg border bg-card p-3 shadow-md"
      role="group"
      aria-label={t("floor.tableProperties", "Table properties")}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{table.label}</span>
        <Button size="icon-xs" variant="ghost" onClick={onClose} aria-label={t("common.close", "Close")}>
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-[1fr_72px] gap-2">
          <div className="space-y-1">
            <Label htmlFor="floor-prop-label" className="text-xs text-muted-foreground">
              {t("floor.tableLabel", "Label")}
            </Label>
            <CommitInput
              id="floor-prop-label"
              value={table.label}
              onCommit={(v) => { if (v.trim()) onPatch({ label: v.trim() }); }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="floor-prop-seats" className="text-xs text-muted-foreground">
              {t("floor.seats", "Seats")}
            </Label>
            <CommitInput
              id="floor-prop-seats"
              type="number"
              min={0}
              max={99}
              value={String(table.seats)}
              onCommit={(v) => {
                const n = Number(v);
                if (Number.isInteger(n) && n >= 0 && n <= 99) onPatch({ seats: n });
              }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{t("floor.shape", "Shape")}</span>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t("floor.shape", "Shape")}>
            {(["rect", "circle"] as const).map((s) => (
              <Button
                key={s}
                size="xs"
                variant={table.shape === s ? "secondary" : "outline"}
                role="radio"
                aria-checked={table.shape === s}
                onClick={() => { if (table.shape !== s) onPatch({ shape: s }); }}
              >
                {s === "rect" ? t("floor.shapeRect", "Rectangle") : t("floor.shapeCircle", "Circle")}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{t("floor.rotation", "Rotation")}</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon-xs" variant="outline"
              onClick={() => onRotateBy(-15)}
              aria-label={t("floor.rotateCcw", "Rotate -15°")}
            >
              <RotateCcw className="size-3.5" />
            </Button>
            <span className="w-10 text-center text-xs tabular-nums">{Math.round(normalizeAngle(g.rot))}°</span>
            <Button
              size="icon-xs" variant="outline"
              onClick={() => onRotateBy(15)}
              aria-label={t("floor.rotateCw", "Rotate +15°")}
            >
              <RotateCw className="size-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">
          {Math.round(g.x)}, {Math.round(g.y)} · {Math.round(g.w)}×{Math.round(g.h)}
        </p>

        <div className="flex gap-1.5 border-t pt-2.5">
          <Button size="xs" variant="outline" className="flex-1" onClick={onDuplicate}>
            <Copy className="size-3.5" /> {t("floor.duplicate", "Duplicate")}
          </Button>
          <Button
            size="icon-xs" variant="outline" className="text-destructive"
            onClick={onDelete}
            aria-label={t("common.delete", "Delete")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
