import * as React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ClipboardPaste, MoreHorizontal, Plus, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { egpToPiastres, fmtMoney } from "@/lib/format";
import { normalize } from "@/lib/normalize";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface EditableField<T> {
  key: string;
  label: string;
  type?: "text" | "number" | "money" | "select" | "boolean";
  options?: { value: string; label: string }[];
  getValue: (row: T) => string | number | boolean | null | undefined;
  renderDisplay?: (row: T) => React.ReactNode;
  editable?: boolean;
}

export interface PasteColumnSpec {
  key: string;
  header: string;
}

/** Inline cell: click to edit; commit on blur/Enter; Escape cancels. */
function InlineCell<T>({ row, col, onCommit }: { row: T; col: EditableField<T>; onCommit: (patch: Record<string, unknown>) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const value = col.getValue(row);

  const startEdit = () => {
    if (col.editable === false) return;
    setDraft(col.type === "money" && typeof value === "number" ? String(value / 100) : value == null ? "" : String(value));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    const initial = col.type === "money" && typeof value === "number" ? String(value / 100) : String(value ?? "");
    if (trimmed === initial.trim()) return;
    if (col.type === "money") {
      const egp = parseFloat(trimmed);
      if (!Number.isFinite(egp) || egp < 0) return;
      onCommit({ [col.key]: egpToPiastres(egp) });
    } else if (col.type === "number") {
      const n = parseFloat(trimmed);
      if (!Number.isFinite(n)) return;
      onCommit({ [col.key]: n });
    } else {
      onCommit({ [col.key]: trimmed });
    }
  };

  if (col.type === "boolean") {
    return <Switch checked={!!value} disabled={col.editable === false} onCheckedChange={(on) => onCommit({ [col.key]: on })} />;
  }

  if (col.type === "select") {
    return (
      <Select value={value == null ? "" : String(value)} onValueChange={(v) => v !== String(value ?? "") && onCommit({ [col.key]: v })} disabled={col.editable === false}>
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(col.options ?? []).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
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
        className="h-7 text-sm"
      />
    );
  }

  const display = col.renderDisplay ? (
    col.renderDisplay(row)
  ) : col.type === "money" ? (
    <span className="tabular">{fmtMoney(typeof value === "number" ? value : null)}</span>
  ) : (
    <span>{value == null || value === "" ? "—" : String(value)}</span>
  );

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        startEdit();
      }}
      className={cn("-mx-1 w-full rounded px-1 py-0.5 text-start text-sm", col.editable !== false && "cursor-text hover:bg-muted")}
    >
      {display}
    </button>
  );
}

const parseClipboardTable = (text: string): string[][] => {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  const delimiter = lines.some((l) => l.includes("\t")) ? "\t" : ",";
  return lines.map((l) => l.split(delimiter).map((c) => c.trim()));
};

const IGNORE = "__ignore__";

function PasteDialog({
  open,
  onClose,
  fields,
  onPasteRows,
  pasteValidate,
}: {
  open: boolean;
  onClose: () => void;
  fields: PasteColumnSpec[];
  onPasteRows?: (rows: Record<string, string>[]) => Promise<void> | void;
  pasteValidate?: (row: Record<string, string>) => string | null;
}) {
  const { t } = useTranslation();
  const [raw, setRaw] = React.useState("");
  const [mapping, setMapping] = React.useState<string[]>([]);
  const [stage, setStage] = React.useState<"paste" | "map">("paste");
  const [creating, setCreating] = React.useState(false);

  const table = React.useMemo(() => parseClipboardTable(raw), [raw]);
  const colCount = table[0]?.length ?? 0;
  const mappedRows: Record<string, string>[] =
    stage === "map"
      ? table.map((cells) => {
          const rec: Record<string, string> = {};
          mapping.forEach((field, i) => {
            if (field !== IGNORE && cells[i] !== undefined) rec[field] = cells[i];
          });
          return rec;
        })
      : [];
  const errors = mappedRows.map((r) => pasteValidate?.(r) ?? null);
  const validCount = errors.filter((e) => e === null).length;

  const create = async () => {
    setCreating(true);
    try {
      await onPasteRows?.(mappedRows.filter((_, i) => errors[i] === null));
      onClose();
      setRaw("");
      setStage("paste");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("grid.pasteTitle", "Paste rows")}</DialogTitle>
          <DialogDescription>{t("grid.pasteHint", "Paste tab- or comma-separated rows, then map the columns.")}</DialogDescription>
        </DialogHeader>
        {stage === "paste" ? (
          <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8} placeholder={"Latte\t45\nCappuccino\t40"} className="font-mono text-xs" />
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: colCount }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("grid.column", { n: i + 1, defaultValue: `Column ${i + 1}` })}</p>
                  <Select value={mapping[i] ?? IGNORE} onValueChange={(v) => setMapping((m) => m.map((x, j) => (j === i ? v : x)))}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IGNORE}>{t("grid.ignore", "Ignore")}</SelectItem>
                      {fields.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border">
              <table className="w-full text-xs">
                <tbody>
                  {table.map((cells, ri) => (
                    <tr key={ri} className={cn("border-b last:border-0", errors[ri] && "bg-destructive/5")}>
                      <td className="w-8 px-2 py-1 text-muted-foreground tabular">{ri + 1}</td>
                      {cells.map((c, ci) => (
                        <td key={ci} className={cn("px-2 py-1", mapping[ci] === IGNORE && "text-muted-foreground/50 line-through")}>
                          {c}
                        </td>
                      ))}
                      {errors[ri] ? <td className="px-2 py-1 text-destructive">{errors[ri]}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">{t("grid.pasteSummary", { valid: validCount, total: table.length, defaultValue: `${validCount}/${table.length} valid` })}</p>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          {stage === "paste" ? (
            <Button type="button" disabled={table.length === 0} onClick={() => { setMapping((table[0] ?? []).map((_, i) => fields[i]?.key ?? IGNORE)); setStage("map"); }}>
              {t("common.next", "Next")}
            </Button>
          ) : (
            <Button type="button" disabled={validCount === 0} loading={creating} onClick={create}>
              {t("grid.createN", { count: validCount, defaultValue: `Create ${validCount}` })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface EditableCardGridProps<T> {
  rows: T[];
  getRowId: (row: T) => string;
  titleField: EditableField<T>;
  fields: EditableField<T>[];
  renderImage?: (row: T) => React.ReactNode;
  footer?: (row: T) => React.ReactNode;
  actions?: (row: T) => React.ReactNode;
  onCommitRow: (row: T, patch: Record<string, unknown>) => Promise<unknown> | void;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Extra filter controls rendered in the toolbar. */
  toolbar?: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: () => void;
  bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
  onPasteRows?: (rows: Record<string, string>[]) => Promise<void> | void;
  pasteValidate?: (row: Record<string, string>) => string | null;
  pasteColumns?: PasteColumnSpec[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  /** Cards per page (client-side pagination). */
  pageSize?: number;
  /** Controlled (server-side) pagination — when set, the grid does not slice rows. */
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  /** Controlled (server-side) search — when set, the grid does not filter rows. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Hover/focus a card to warm its detail query (predictive prefetch). */
  onRowPrefetch?: (row: T) => void;
  /** Hover/focus the "next page" control to prefetch the following page. */
  onPrefetchNext?: () => void;
}

function EditableCardItem<T>({
  row,
  grid,
  selected,
  onToggle,
}: {
  row: T;
  grid: EditableCardGridProps<T>;
  selected: boolean;
  onToggle: () => void;
}) {
  const { titleField, fields, renderImage, footer, actions, onCommitRow, bulkActions, onRowPrefetch } = grid;
  const commit = (patch: Record<string, unknown>) => onCommitRow(row, patch);
  const prefetch = onRowPrefetch ? () => onRowPrefetch(row) : undefined;
  return (
    <Card
      className={cn("gap-0 overflow-hidden py-0 transition-shadow", selected && "ring-2 ring-primary")}
      onMouseEnter={prefetch}
      onFocusCapture={prefetch}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start gap-3">
          {bulkActions ? (
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selected} onCheckedChange={onToggle} />
            </div>
          ) : null}
          {renderImage ? <div className="shrink-0">{renderImage(row)}</div> : null}
          <div className="min-w-0 flex-1">
            <InlineCell row={row} col={titleField} onCommit={commit} />
          </div>
          {actions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="-me-1 shrink-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{actions(row)}</DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {fields.map((f) => (
            <div key={f.key} className={cn("space-y-0.5", f.type === "boolean" && "flex items-center justify-between gap-2 space-y-0")}>
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <InlineCell row={row} col={f} onCommit={commit} />
            </div>
          ))}
        </div>

        {footer ? <div className="border-t pt-2">{footer(row)}</div> : null}
      </CardContent>
    </Card>
  );
}

export function EditableCardGrid<T>(props: EditableCardGridProps<T>) {
  const { t } = useTranslation();
  const { rows, getRowId, searchText, searchPlaceholder, toolbar, onAdd, addLabel, onExport, bulkActions, onPasteRows, pasteValidate, pasteColumns, titleField, fields, isLoading, emptyState, pageSize = 24, page: pageProp, pageCount: pageCountProp, onPageChange, searchValue, onSearchChange } = props;
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [internalSearch, setInternalSearch] = React.useState("");
  const [internalPage, setInternalPage] = React.useState(0);
  const [pasteOpen, setPasteOpen] = React.useState(false);

  const searchControlled = onSearchChange != null;
  const search = searchControlled ? (searchValue ?? "") : internalSearch;
  const setSearch = searchControlled ? onSearchChange : setInternalSearch;
  const serverMode = onPageChange != null;

  React.useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(rows.map(getRowId));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows, getRowId]);

  const filtered = React.useMemo(() => {
    const q = normalize(search);
    if (serverMode || !q || !searchText) return rows;
    return rows.filter((r) => normalize(searchText(r)).includes(q));
  }, [rows, search, searchText, serverMode]);

  const pageCount = serverMode ? Math.max(1, pageCountProp ?? 1) : Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = serverMode ? Math.max(0, pageProp ?? 0) : Math.min(internalPage, pageCount - 1);
  const paged = serverMode ? rows : filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const goToPage = (p: number) => (serverMode ? onPageChange(p) : setInternalPage(p));
  React.useEffect(() => {
    if (!serverMode) setInternalPage(0);
  }, [internalSearch, serverMode]);

  const clear = () => setSelected(new Set());
  const selectedRows = rows.filter((r) => selected.has(getRowId(r)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pasteFields = pasteColumns ?? [titleField, ...fields].map((c) => ({ key: c.key, header: c.label }));

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Show the search box for client-side filtering (searchText) OR
            controlled server-side search (onSearchChange). */}
        {searchText || onSearchChange ? (
          <div className="relative w-full sm:w-56">
            <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder ?? t("common.search", "Search…")} className="h-9 ps-8" />
          </div>
        ) : null}
        {toolbar}
        <div className="ms-auto flex flex-wrap gap-2">
          {onExport ? <ExportButton onExport={onExport} /> : null}
          {onPasteRows ? (
            <Button variant="outline" onClick={() => setPasteOpen(true)}>
              <ClipboardPaste className="size-4" />
              {t("grid.pasteRows", "Paste")}
            </Button>
          ) : null}
          {onAdd ? (
            <Button onClick={onAdd}>
              <Plus className="size-4" />
              {addLabel ?? t("common.add", "Add")}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Bulk toolbar */}
      {bulkActions && selected.size > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
          <Badge variant="secondary">{t("grid.selectedCount", { count: selected.size, defaultValue: `${selected.size} selected` })}</Badge>
          <div className="flex flex-1 flex-wrap items-center gap-2">{bulkActions(selectedRows, clear)}</div>
          <Button variant="ghost" size="icon-sm" onClick={clear} aria-label={t("common.clearAll", "Clear all")}>
            <X className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        emptyState ?? <EmptyState title={t("common.noResults", "No results found")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((row) => (
            <EditableCardItem key={getRowId(row)} row={row} grid={props} selected={selected.has(getRowId(row))} onToggle={() => toggle(getRowId(row))} />
          ))}
        </div>
      )}

      {!isLoading && pageCount > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground tabular">
            {t("common.page", { current: safePage + 1, total: pageCount, defaultValue: `Page ${safePage + 1} of ${pageCount}` })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" disabled={safePage === 0} onClick={() => goToPage(safePage - 1)} aria-label={t("common.previous", "Previous")}>
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => goToPage(safePage + 1)}
              onMouseEnter={() => props.onPrefetchNext?.()}
              onFocus={() => props.onPrefetchNext?.()}
              aria-label={t("common.next", "Next")}
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      ) : null}

      {pasteOpen ? <PasteDialog open={pasteOpen} onClose={() => setPasteOpen(false)} fields={pasteFields} onPasteRows={onPasteRows} pasteValidate={pasteValidate} /> : null}
    </div>
  );
}
