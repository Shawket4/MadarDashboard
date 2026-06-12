import * as React from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardPaste, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { fmtMoney } from "@/shared/lib/format";
import { DataTable } from "./data-table";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Switch } from "./switch";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "./dialog";
import { Textarea } from "./textarea";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EditableColumn<T> {
  /** Field name used in the onCommitRow patch (and paste mapping). */
  key: string;
  header: string;
  /**
   * money: stored piastres, edited as EGP (÷100 in, ×100 truncated out).
   * select: needs `options`. boolean: renders a switch, commits immediately.
   */
  type?: "text" | "number" | "money" | "select" | "boolean";
  options?: { value: string; label: string }[];
  getValue: (row: T) => string | number | boolean | null | undefined;
  /** Render override for display mode (defaults derive from type). */
  renderDisplay?: (row: T) => React.ReactNode;
  editable?: boolean;
}

export interface PasteColumnSpec {
  key: string;
  header: string;
}

export interface EditableGridProps<T> {
  rows: T[];
  getRowId: (row: T) => string;
  columns: EditableColumn<T>[];
  /** Extra non-editable columns (status, actions …) appended after the editable ones. */
  extraColumns?: ColumnDef<T>[];
  /** Commit a single-cell edit. Reject/throw to surface the error. */
  onCommitRow: (row: T, patch: Record<string, unknown>) => Promise<unknown> | void;
  /** Add-row affordance. */
  onAddRow?: () => void;
  addRowLabel?: string;
  /** Bulk-select toolbar content; receives the selected rows + a clear() fn. */
  bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
  /**
   * Paste-to-create: enables the paste dialog. Receives one record per pasted
   * row, keyed by the mapped field names. The caller fans the creates out
   * (see runBulk) and resolves when done.
   */
  onPasteRows?: (rows: Record<string, string>[]) => Promise<void> | void;
  /** Per-row validation for the paste preview — return an error string or null. */
  pasteValidate?: (row: Record<string, string>) => string | null;
  /** Mappable fields for pasted columns (defaults to the editable columns). */
  pasteColumns?: PasteColumnSpec[];
  searchKey?: keyof T & string;
  isLoading?: boolean;
  toolbar?: React.ReactNode;
  onExport?: () => void | Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline-editable cell — commit on blur/Enter, Escape cancels
// ─────────────────────────────────────────────────────────────────────────────

function EditableCell<T>({
  row,
  col,
  onCommit,
}: {
  row: T;
  col: EditableColumn<T>;
  onCommit: (patch: Record<string, unknown>) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const value = col.getValue(row);

  const startEdit = () => {
    if (col.editable === false) return;
    const initial =
      col.type === "money" && typeof value === "number"
        ? String(value / 100)
        : value == null
          ? ""
          : String(value);
    setDraft(initial);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    const initial = col.type === "money" && typeof value === "number" ? String(value / 100) : String(value ?? "");
    if (trimmed === initial.trim()) return; // unchanged
    if (col.type === "money") {
      const egp = parseFloat(trimmed);
      if (!Number.isFinite(egp) || egp < 0) return;
      onCommit({ [col.key]: Math.trunc(egp * 100) });
    } else if (col.type === "number") {
      const n = parseFloat(trimmed);
      if (!Number.isFinite(n)) return;
      onCommit({ [col.key]: n });
    } else {
      onCommit({ [col.key]: trimmed });
    }
  };

  // boolean → immediate switch
  if (col.type === "boolean") {
    return (
      <Switch
        checked={!!value}
        disabled={col.editable === false}
        onCheckedChange={(on) => onCommit({ [col.key]: on })}
      />
    );
  }

  // select → immediate dropdown
  if (col.type === "select") {
    return (
      <Select
        value={value == null ? "" : String(value)}
        onValueChange={(v) => v !== String(value ?? "") && onCommit({ [col.key]: v })}
        disabled={col.editable === false}
      >
        <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(col.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (editing) {
    return (
      <Input
        autoFocus
        type={col.type === "money" || col.type === "number" ? "number" : "text"}
        step="any"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 text-sm max-w-44"
      />
    );
  }

  const display = col.renderDisplay
    ? col.renderDisplay(row)
    : col.type === "money"
      ? <span className="tabular">{fmtMoney(typeof value === "number" ? value : null)}</span>
      : <span>{value == null || value === "" ? "—" : String(value)}</span>;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); startEdit(); }}
      className={cn(
        "text-start text-sm rounded px-1 -mx-1 py-0.5 min-w-8",
        col.editable !== false && "hover:bg-muted cursor-text",
      )}
    >
      {display}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Paste-to-create dialog: paste → map columns → preview/validate → create N
// ─────────────────────────────────────────────────────────────────────────────

const parseClipboardTable = (text: string): string[][] => {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  const delimiter = lines.some((l) => l.includes("\t")) ? "\t" : ",";
  return lines.map((l) => l.split(delimiter).map((c) => c.trim()));
};

const IGNORE = "__ignore__";

function PasteDialog<T>({
  open,
  onClose,
  grid,
}: {
  open: boolean;
  onClose: () => void;
  grid: EditableGridProps<T>;
}) {
  const { t } = useTranslation();
  const [raw, setRaw] = React.useState("");
  const [mapping, setMapping] = React.useState<string[]>([]);
  const [stage, setStage] = React.useState<"paste" | "map">("paste");
  const [creating, setCreating] = React.useState(false);

  const fields: PasteColumnSpec[] =
    grid.pasteColumns ?? grid.columns.map((c) => ({ key: c.key, header: c.header }));

  const table = React.useMemo(() => parseClipboardTable(raw), [raw]);
  const colCount = table[0]?.length ?? 0;

  const toMappedRows = (): Record<string, string>[] =>
    table.map((cells) => {
      const rec: Record<string, string> = {};
      mapping.forEach((field, i) => {
        if (field !== IGNORE && cells[i] !== undefined) rec[field] = cells[i];
      });
      return rec;
    });

  const mappedRows = stage === "map" ? toMappedRows() : [];
  const errors = mappedRows.map((r) => grid.pasteValidate?.(r) ?? null);
  const validCount = errors.filter((e) => e === null).length;

  const advance = () => {
    // best-effort auto-map: match pasted header text to field names
    const first = table[0] ?? [];
    setMapping(
      first.map((_, i) => fields[i]?.key ?? IGNORE),
    );
    setStage("map");
  };

  const create = async () => {
    setCreating(true);
    try {
      await grid.onPasteRows?.(mappedRows.filter((_, i) => errors[i] === null));
      onClose();
      setRaw("");
      setStage("paste");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{t("grid.pasteTitle")}</DialogTitle></DialogHeader>
        <DialogBody>
          {stage === "paste" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("grid.pasteHint")}</p>
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={8}
                placeholder={"Latte\t45\nCappuccino\t40"}
                className="font-mono text-xs"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* column mapping */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: colCount }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("grid.column", { n: i + 1 })}</p>
                    <Select value={mapping[i] ?? IGNORE} onValueChange={(v) => setMapping((m) => m.map((x, j) => (j === i ? v : x)))}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IGNORE}>{t("grid.ignore")}</SelectItem>
                        {fields.map((f) => <SelectItem key={f.key} value={f.key}>{f.header}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {/* preview with per-row validation */}
              <div className="border rounded-lg max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {table.map((cells, ri) => (
                      <tr key={ri} className={cn("border-b last:border-0", errors[ri] && "bg-destructive/5")}>
                        <td className="px-2 py-1 text-muted-foreground tabular w-8">{ri + 1}</td>
                        {cells.map((c, ci) => (
                          <td key={ci} className={cn("px-2 py-1", mapping[ci] === IGNORE && "text-muted-foreground/50 line-through")}>{c}</td>
                        ))}
                        {errors[ri] && <td className="px-2 py-1 text-destructive">{errors[ri]}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("grid.pasteSummary", { valid: validCount, total: table.length })}
              </p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          {stage === "paste" ? (
            <Button type="button" disabled={table.length === 0} onClick={advance}>{t("common.next", { defaultValue: "Next" })}</Button>
          ) : (
            <Button type="button" disabled={validCount === 0} loading={creating} onClick={create}>
              {t("grid.createN", { count: validCount })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditableGrid — DataTable + inline edit + selection + paste-to-create
// ─────────────────────────────────────────────────────────────────────────────

export function EditableGrid<T>(props: EditableGridProps<T>) {
  const { t } = useTranslation();
  const {
    rows, getRowId, columns, extraColumns = [], onCommitRow,
    onAddRow, addRowLabel, bulkActions, onPasteRows,
    searchKey, isLoading, toolbar, onExport,
  } = props;

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pasteOpen, setPasteOpen] = React.useState(false);

  // prune selection when rows disappear
  React.useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(rows.map(getRowId));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows, getRowId]);

  const clearSelection = () => setSelected(new Set());
  const selectedRows = rows.filter((r) => selected.has(getRowId(r)));
  const allSelected = rows.length > 0 && selected.size === rows.length;

  const selectionColumn: ColumnDef<T> = {
    id: "_select",
    header: () => (
      <Checkbox
        checked={allSelected}
        onCheckedChange={(on) => setSelected(on ? new Set(rows.map(getRowId)) : new Set())}
        aria-label={t("grid.selectAll")}
      />
    ),
    cell: ({ row }) => {
      const id = getRowId(row.original);
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected.has(id)}
            onCheckedChange={(on) =>
              setSelected((prev) => {
                const next = new Set(prev);
                if (on) next.add(id); else next.delete(id);
                return next;
              })
            }
            aria-label={t("grid.selectRow")}
          />
        </div>
      );
    },
  };

  // accessorFn lets the table read raw values (search/sort); cell renders the editor
  const editableCols: ColumnDef<T>[] = React.useMemo(
    () =>
      columns.map((col) => ({
        id: col.key,
        header: col.header,
        accessorFn: (row: T) => {
          const v = col.getValue(row);
          return typeof v === "boolean" ? undefined : v;
        },
        cell: ({ row }) => (
          <EditableCell row={row.original} col={col} onCommit={(patch) => onCommitRow(row.original, patch)} />
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns],
  );

  const allColumns: ColumnDef<T>[] = React.useMemo(
    () => [...(bulkActions ? [selectionColumn] : []), ...editableCols, ...extraColumns],
    // selectionColumn closes over `selected`/`rows`, so they are real deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editableCols, extraColumns, !!bulkActions, selected, rows],
  );

  return (
    <div className="space-y-2">
      {/* bulk-select toolbar */}
      {bulkActions && selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
          <Badge variant="secondary">{t("grid.selectedCount", { count: selected.size })}</Badge>
          <div className="flex items-center gap-2 flex-wrap flex-1">{bulkActions(selectedRows, clearSelection)}</div>
          <Button variant="ghost" size="iconSm" onClick={clearSelection} aria-label={t("common.clearAll")}>
            <X size={13} />
          </Button>
        </div>
      )}

      <DataTable
        columns={allColumns}
        data={rows}
        isLoading={isLoading}
        searchKey={searchKey}
        onExport={onExport}
        toolbar={
          <div className="flex items-center gap-2">
            {toolbar}
            {onPasteRows && (
              <Button variant="outline" size="sm" onClick={() => setPasteOpen(true)} className="gap-1">
                <ClipboardPaste size={13} /> {t("grid.pasteRows")}
              </Button>
            )}
            {onAddRow && (
              <Button size="sm" onClick={onAddRow} className="gap-1">
                <Plus size={13} /> {addRowLabel ?? t("common.add")}
              </Button>
            )}
          </div>
        }
      />

      {pasteOpen && <PasteDialog open={pasteOpen} onClose={() => setPasteOpen(false)} grid={props} />}
    </div>
  );
}
