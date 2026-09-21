import { useMemo, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import type { OrgIngredient } from "@/data/api/generated/models";
import { addRow, buildGridRows, removeRow, setCell, type GridBlock, type GridRow } from "./grid-model";

interface Props {
  /** One block per column; `label` is the column header. */
  blocks: GridBlock[];
  onChange: (blocks: GridBlock[]) => void;
  catalogById: Map<string, OrgIngredient>;
  ingredientOptions: ComboboxOption[];
  /** Offer "+ size label" (bases, option amounts). Omit for a single fixed column. */
  onAddColumn?: (label: string) => void;
  /** Keys of columns that may be removed (e.g. not the "every size" column). */
  removableKeys?: Set<string>;
  onRemoveColumn?: (key: string) => void;
  /** Unique id so keyboard navigation stays inside this grid. */
  gridId: string;
}

const cleanQty = (v: string) => v.replace(/,/g, ".").replace(/[^\d.]/g, "");

/**
 * Small ingredients × labels grid for recipe bases, packaging rules and per-size
 * option amounts. Blank cell = no line for that column.
 */
export function LabelGridEditor({
  blocks,
  onChange,
  catalogById,
  ingredientOptions,
  onAddColumn,
  removableKeys,
  onRemoveColumn,
  gridId,
}: Props) {
  const { t } = useTranslation();
  const [newLabel, setNewLabel] = useState("");
  const rows = useMemo(() => buildGridRows(blocks), [blocks]);
  const used = useMemo(() => new Set(rows.map((r) => r.ingredient_id)), [rows]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const dr = e.key === "ArrowDown" || (e.key === "Enter" && !e.shiftKey) ? 1 : e.key === "ArrowUp" || (e.key === "Enter" && e.shiftKey) ? -1 : 0;
    if (!dr) return;
    const el = e.currentTarget;
    const next = document.querySelector<HTMLInputElement>(
      `input[data-grid="${gridId}"][data-row="${Number(el.dataset.row) + dr}"][data-col="${CSS.escape(el.dataset.col ?? "")}"]`,
    );
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  const columns = useMemo<ColumnDef<GridRow>[]>(
    () => [
      {
        id: "ingredient",
        header: () => t("recipes.ingredient", "Ingredient"),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {catalogById.get(row.original.ingredient_id)?.name ?? t("modeling.grid.unknownIngredient", "Unknown ingredient")}
          </span>
        ),
      },
      ...blocks.map<ColumnDef<GridRow>>((b) => ({
        id: `col:${b.key}`,
        header: () => b.label,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
              <Input
                inputMode="decimal"
                data-grid={gridId}
                data-row={row.index}
                data-col={b.key}
                value={r.cells[b.key] ?? ""}
                placeholder="—"
                aria-label={t("modeling.grid.cellAria", "{{ingredient}} in {{size}}", {
                  ingredient: catalogById.get(r.ingredient_id)?.name ?? "",
                  size: b.label,
                })}
                onKeyDown={onKey}
                onChange={(e) => onChange(setCell(blocks, b.key, r.ingredient_id, cleanQty(e.target.value), r.unit))}
                className="h-8 w-20 border-0 bg-transparent text-end tabular-nums shadow-none focus-visible:ring-0"
              />
              <span className="min-w-8 pe-2 text-xs text-muted-foreground">{t(`units.${r.unit}`, r.unit)}</span>
            </div>
          );
        },
      })),
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label={t("recipes.builder.removeIngredient", "Remove ingredient")}
            onClick={() => onChange(removeRow(blocks, row.original.ingredient_id))}
          >
            <Trash2 className="size-4" />
          </Button>
        ),
      },
    ],
    // onKey is stable in behaviour (reads the DOM); onChange identity is the caller's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, catalogById, gridId, onChange, t],
  );
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel(), getRowId: (r) => r.key });

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/40">
                {hg.headers.map((h) => {
                  const key = h.column.id.startsWith("col:") ? h.column.id.slice(4) : null;
                  return (
                    <th key={h.id} className="px-2 py-2 text-start text-xs font-medium text-muted-foreground first:px-3">
                      <span className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {key && removableKeys?.has(key) && onRemoveColumn ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("modeling.grid.removeColumn", "Remove column")}
                            onClick={() => onRemoveColumn(key)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-1.5 first:px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={blocks.length + 2} className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {t("modeling.grid.noLines", "No ingredients yet.")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Combobox
          className="w-64 max-w-full"
          options={ingredientOptions.filter((o) => !used.has(o.value))}
          value={null}
          onChange={(v) => onChange(addRow(blocks, v, catalogById.get(v)?.unit ?? "g"))}
          placeholder={t("modeling.grid.addIngredient", "+ ingredient")}
        />
        {onAddColumn ? (
          <span className="flex items-center gap-1">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t("modeling.grid.sizeLabelPh", "Size label, e.g. Cup")}
              className="h-9 w-44"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLabel.trim()) {
                  e.preventDefault();
                  onAddColumn(newLabel.trim());
                  setNewLabel("");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!newLabel.trim() || blocks.some((b) => b.label === newLabel.trim())}
              onClick={() => {
                onAddColumn(newLabel.trim());
                setNewLabel("");
              }}
            >
              <Plus className="size-4" /> {t("modeling.grid.addLabel", "Size column")}
            </Button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
