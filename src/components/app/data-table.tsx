import { Fragment, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { getErrorMessage } from "@/data/api/errors";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * The one record table (POS SPEC §8).
 *
 * - Header: 11/600 tracked muted labels, hairline under it, sticky under the
 *   app bar while the page scrolls.
 * - Rows: 56 tall, hairlines, no zebra. Selected row = accent wash + ink rail.
 * - Figures: column `meta.numeric` → mono, tabular, end-aligned, bidi-isolated.
 * - State is REQUIRED: `loading` draws skeleton rows in the table's own grid,
 *   `error` draws ErrorState with Retry (a failed load is never "empty"),
 *   an empty list draws `emptyState`.
 * - Optional: expandable rows, trailing row actions, pagination or Load more.
 * - Phone: each row collapses to a stacked card (or `renderMobileCard`).
 */

export interface DataTableColumnMeta {
  /** Label for the column-visibility menu and the phone card. */
  label?: string;
  align?: "start" | "end" | "center";
  /** Money, counts, refs, times: mono tabular figures, end-aligned by default. */
  numeric?: boolean;
  /** Phone card role. `title` leads the card; `hidden` drops the cell. */
  phone?: "title" | "hidden" | "auto";
  /** Extra classes on this column's header and cells (e.g. a fixed width). */
  className?: string;
}

const metaOf = <T,>(column: Column<T, unknown>) =>
  (column.columnDef.meta as DataTableColumnMeta | undefined) ?? {};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  /** A failed load. Pass the query error; the table shows ErrorState + Retry. */
  error?: unknown;
  onRetry?: () => void;
  emptyState?: ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  /** Highlights one row (split views, the row whose sheet is open). */
  selectedRowId?: string | null;
  /** Expandable rows: return content to show under a row, or null for none. */
  renderExpanded?: (row: TData) => ReactNode;
  /** Trailing per-row actions (icon buttons, a "…" menu). Clicks don't open the row. */
  rowActions?: (row: TData) => ReactNode;
  /** Extra toolbar controls (filters) rendered between search and view options. */
  toolbar?: ReactNode;
  /** Show a global search input with this placeholder. */
  searchPlaceholder?: string;
  /** Render a card per row on mobile (overrides the automatic stacked card). */
  renderMobileCard?: (row: TData) => ReactNode;
  /** Prefetch this row's detail query on hover/focus (predictive loading). */
  onRowPrefetch?: (row: TData) => void;
  /** Prefetch the next page on Next-button hover/focus. */
  onPrefetchNext?: () => void;
  pageSize?: number;
  // Server-side pagination
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** Cursor-style "Load more" footer instead of pages. */
  loadMore?: { hasMore: boolean; loading?: boolean; onLoadMore: () => void };
  /** Hide the column-visibility menu. */
  hideViewOptions?: boolean;
  /** Inside another card: no frame of its own. */
  framed?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyState,
  onRowClick,
  getRowId,
  selectedRowId,
  renderExpanded,
  rowActions,
  toolbar,
  searchPlaceholder,
  renderMobileCard,
  onRowPrefetch,
  onPrefetchNext,
  pageSize = 10,
  manualPagination,
  pageCount,
  pagination,
  onPaginationChange,
  loadMore,
  hideViewOptions,
  framed = true,
  className,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const uid = useId();
  const titleId = (rowId: string) => `${uid}-title-${rowId}`;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [internalPagination, setInternalPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const usePages = !loadMore;
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(usePages ? { pagination: manualPagination ? pagination : internalPagination } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: manualPagination ? onPaginationChange : setInternalPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: manualPagination || !usePages ? undefined : getPaginationRowModel(),
    manualPagination: manualPagination || !usePages,
    pageCount,
  });

  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns();
  const hideableColumns = table.getAllColumns().filter((c) => c.getCanHide() && metaOf(c).label);
  const pageIndex = table.getState().pagination?.pageIndex ?? 0;
  const totalPages = usePages ? table.getPageCount() : 0;

  const hasExpand = !!renderExpanded;
  const hasActions = !!rowActions;
  const colSpan = visibleColumns.length + (hasExpand ? 1 : 0) + (hasActions ? 1 : 0);

  // Sticky header needs a non-scrolling ancestor; only fall back to horizontal
  // scrolling when the table is genuinely wider than its frame.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const tableEl = el.firstElementChild as HTMLElement | null;
      setOverflows(!!tableEl && tableEl.scrollWidth > el.clientWidth + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [isMobile, loading, rows.length, colSpan]);

  const toggleExpanded = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const cellAlign = (meta: DataTableColumnMeta) =>
    meta.align === "end" || (meta.numeric && meta.align !== "start" && meta.align !== "center")
      ? "text-end"
      : meta.align === "center"
        ? "text-center"
        : "text-start";

  const frame = framed ? "rounded-2xl border bg-card" : "";

  // ── Body states ──────────────────────────────────────────────────────────
  const errorNode =
    error && !loading ? (
      <ErrorState
        message={typeof error === "string" ? error : getErrorMessage(error)}
        onRetry={onRetry}
        className={framed ? undefined : "border-0 bg-transparent"}
      />
    ) : null;

  const emptyNode =
    !loading && !error && rows.length === 0
      ? (emptyState ?? <EmptyState icon={Search} title={t("common.noResults", "No results found")} />)
      : null;

  const renderPhoneCard = (row: Row<TData>, stretched = false) => {
    if (renderMobileCard) return renderMobileCard(row.original);
    const cells = row.getVisibleCells().filter((c) => metaOf(c.column).phone !== "hidden");
    const titleCell = cells.find((c) => metaOf(c.column).phone === "title") ?? cells[0];
    const rest = cells.filter((c) => c !== titleCell);
    return (
      <div
        className={cn(
          "rounded-2xl border bg-card p-4",
          selectedRowId && row.id === selectedRowId && "border-foreground/30 bg-accent",
          // Under a stretched row button: taps on text reach it, while the
          // card's own controls (a cell's button, a link) stay on top.
          stretched &&
            "pointer-events-none relative z-[2] [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_[role=checkbox]]:pointer-events-auto",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div id={titleId(row.id)} className="min-w-0 text-base font-semibold">
            {titleCell ? flexRender(titleCell.column.columnDef.cell, titleCell.getContext()) : null}
          </div>
          {rowActions ? (
            // Above the row's stretched button (below), so the actions stay clickable.
            <div className="relative z-10 -me-2 -mt-1 flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
              {rowActions(row.original)}
            </div>
          ) : null}
        </div>
        {rest.length ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {rest.map((cell) => {
              const meta = metaOf(cell.column);
              const header = cell.column.columnDef.header;
              return (
                <div key={cell.id} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">
                    {meta.label ?? (typeof header === "string" ? header : cell.column.id)}
                  </dt>
                  <dd className={cn("mt-0.5 min-w-0 truncate", meta.numeric && "font-mono tabular-nums")}>
                    <bdi>{flexRender(cell.column.columnDef.cell, cell.getContext())}</bdi>
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}
        {hasExpand && expanded[row.id] ? <div className="mt-3 border-t pt-3">{renderExpanded!(row.original)}</div> : null}
      </div>
    );
  };

  const header = (
    <thead>
      {table.getHeaderGroups().map((hg) => (
        <tr key={hg.id}>
          {hg.headers.map((h) => {
            const meta = metaOf(h.column);
            return (
              <th
                key={h.id}
                scope="col"
                className={cn(
                  "sticky top-14 z-10 h-11 border-b bg-card px-3 align-middle text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase first:ps-5 last:pe-5",
                  !framed && "bg-transparent",
                  overflows && "static",
                  cellAlign(meta),
                  meta.className,
                )}
              >
                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            );
          })}
          {hasActions ? (
            <th
              scope="col"
              className={cn("sticky top-14 z-10 h-11 w-px border-b bg-card pe-5", overflows && "static", !framed && "bg-transparent")}
            >
              <span className="sr-only">{t("common.actions", "Actions")}</span>
            </th>
          ) : null}
          {hasExpand ? (
            <th
              scope="col"
              className={cn("sticky top-14 z-10 h-11 w-12 border-b bg-card pe-3", overflows && "static", !framed && "bg-transparent")}
            >
              <span className="sr-only">{t("common.details", "Details")}</span>
            </th>
          ) : null}
        </tr>
      ))}
    </thead>
  );

  const skeletonRows = Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
    <tr key={`sk-${i}`} className="border-b last:border-0" aria-hidden>
      {Array.from({ length: colSpan }).map((__, j) => (
        <td key={j} className="h-14 px-3 first:ps-5 last:pe-5">
          <Skeleton className={cn("h-4", j === 0 ? "w-3/4" : "w-1/2", "max-w-40")} />
        </td>
      ))}
    </tr>
  ));

  return (
    <div data-slot="data-table" className={cn("space-y-3", className)}>
      {/* Toolbar */}
      {(searchPlaceholder || toolbar || (hideableColumns.length > 0 && !hideViewOptions)) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchPlaceholder ? (
            <div className="relative w-full sm:w-72">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 ps-9"
              />
            </div>
          ) : null}
          {toolbar}
          {hideableColumns.length > 0 && !isMobile && !hideViewOptions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ms-auto h-9">
                  <SlidersHorizontal aria-hidden />
                  {t("common.columns", "Columns")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {metaOf(column).label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      )}

      {/* Body */}
      {errorNode ? (
        errorNode
      ) : emptyNode ? (
        emptyNode
      ) : isMobile ? (
        <div className="space-y-2" aria-busy={loading || undefined}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
            : rows.map((row) =>
                onRowClick && !renderMobileCard ? (
                  // A card can hold buttons (row actions, a cell's own button),
                  // so it can't be one <button> (a button inside a button is
                  // invalid HTML). The row's button is stretched over the card
                  // instead, named by the card's title, controls above it.
                  <div
                    key={row.id}
                    className="relative rounded-2xl transition-transform duration-200 has-[>button:active]:scale-[0.99] motion-reduce:transition-none"
                    onMouseEnter={() => onRowPrefetch?.(row.original)}
                  >
                    <button
                      type="button"
                      aria-labelledby={titleId(row.id)}
                      onClick={() => onRowClick(row.original)}
                      onFocus={() => onRowPrefetch?.(row.original)}
                      className="absolute inset-0 z-[1] rounded-2xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    />
                    {renderPhoneCard(row, true)}
                  </div>
                ) : onRowClick ? (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => onRowClick(row.original)}
                    onMouseEnter={() => onRowPrefetch?.(row.original)}
                    onFocus={() => onRowPrefetch?.(row.original)}
                    className="block w-full rounded-2xl text-start transition-transform duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
                  >
                    {renderPhoneCard(row)}
                  </button>
                ) : (
                  <div key={row.id} onMouseEnter={() => onRowPrefetch?.(row.original)}>
                    {renderPhoneCard(row)}
                  </div>
                ),
              )}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={cn(frame, overflows ? "overflow-x-auto" : "overflow-x-clip")}
          aria-busy={loading || undefined}
        >
          <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
            {header}
            <tbody>
              {loading
                ? skeletonRows
                : rows.map((row) => {
                    const selected = !!selectedRowId && row.id === selectedRowId;
                    const isOpen = hasExpand && !!expanded[row.id];
                    const expandedContent = isOpen ? renderExpanded!(row.original) : null;
                    return (
                      <Fragment key={row.id}>
                        <tr
                          data-state={selected ? "selected" : undefined}
                          aria-selected={selectedRowId !== undefined ? selected : undefined}
                          onClick={() => onRowClick?.(row.original)}
                          onMouseEnter={() => onRowPrefetch?.(row.original)}
                          onKeyDown={
                            onRowClick
                              ? (e) => {
                                  if (e.target !== e.currentTarget) return;
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onRowClick(row.original);
                                  }
                                }
                              : undefined
                          }
                          tabIndex={onRowClick ? 0 : undefined}
                          className={cn(
                            "group/row transition-colors duration-150 motion-reduce:transition-none",
                            "[&>td]:border-b [&:last-child>td]:border-b-0",
                            isOpen && "[&>td]:border-b-0",
                            onRowClick &&
                              "cursor-pointer hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:outline-none",
                            selected && "bg-accent hover:bg-accent",
                          )}
                        >
                          {row.getVisibleCells().map((cell, i) => {
                            const meta = metaOf(cell.column);
                            return (
                              <td
                                key={cell.id}
                                className={cn(
                                  "relative h-14 px-3 align-middle whitespace-nowrap first:ps-5 last:pe-5",
                                  cellAlign(meta),
                                  meta.numeric && "font-mono text-[13px] tabular-nums",
                                  meta.className,
                                )}
                              >
                                {i === 0 && selected ? (
                                  <span aria-hidden className="absolute inset-y-0 start-0 w-1 bg-primary" />
                                ) : null}
                                {meta.numeric ? (
                                  <bdi>{flexRender(cell.column.columnDef.cell, cell.getContext())}</bdi>
                                ) : (
                                  flexRender(cell.column.columnDef.cell, cell.getContext())
                                )}
                              </td>
                            );
                          })}
                          {hasActions ? (
                            <td className="h-14 w-px pe-5 text-end align-middle whitespace-nowrap">
                              <div
                                className="flex items-center justify-end gap-1"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                {rowActions!(row.original)}
                              </div>
                            </td>
                          ) : null}
                          {hasExpand ? (
                            <td className="h-14 w-12 pe-3 align-middle">
                              {renderExpanded!(row.original) !== null ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-expanded={isOpen}
                                  aria-label={t("common.details", "Details")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(row.id);
                                  }}
                                >
                                  <ChevronDown
                                    aria-hidden
                                    className={cn(
                                      "transition-transform duration-200 motion-reduce:transition-none",
                                      isOpen && "rotate-180",
                                    )}
                                  />
                                </Button>
                              ) : null}
                            </td>
                          ) : null}
                        </tr>
                        {isOpen && expandedContent !== null ? (
                          <tr className="[&:not(:last-child)>td]:border-b">
                            <td colSpan={colSpan} className="bg-background/60 px-5 py-4">
                              {expandedContent}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: Load more, or pages */}
      {loadMore && !error && rows.length > 0 && loadMore.hasMore ? (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={loadMore.onLoadMore} loading={loadMore.loading}>
            {t("common.loadMore", "Load more")}
          </Button>
        </div>
      ) : null}
      {usePages && totalPages > 1 && !error ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground tabular-nums">
            {t("common.page", {
              current: pageIndex + 1,
              total: totalPages,
              defaultValue: `Page ${pageIndex + 1} of ${totalPages}`,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label={t("common.previous", "Previous")}
            >
              <ChevronLeft className="rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              onMouseEnter={() => onPrefetchNext?.()}
              onFocus={() => onPrefetchNext?.()}
              disabled={!table.getCanNextPage()}
              aria-label={t("common.next", "Next")}
            >
              <ChevronRight className="rtl:rotate-180" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Sortable column header button for use in column defs. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      className={cn(
        "-mx-1 inline-flex h-7 items-center gap-1 rounded-md px-1 tracking-[inherit] uppercase transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        sorted && "text-foreground",
        className,
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp aria-hidden className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown aria-hidden className="size-3.5" />
      ) : (
        <ChevronsUpDown aria-hidden className="size-3.5 opacity-50" />
      )}
    </button>
  );
}
