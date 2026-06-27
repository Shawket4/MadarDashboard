import { type ReactNode, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  /** Extra toolbar controls (filters) rendered between search and view options. */
  toolbar?: ReactNode;
  /** Show a global search input with this placeholder. */
  searchPlaceholder?: string;
  /** Render a card per row on mobile instead of a horizontally-scrolling table. */
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  emptyState,
  onRowClick,
  getRowId,
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
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalPagination, setInternalPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: manualPagination ? pagination : internalPagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: manualPagination ? onPaginationChange : setInternalPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination,
    pageCount,
  });

  const rows = table.getRowModel().rows;
  const colCount = table.getAllLeafColumns().length;
  const hideableColumns = table.getAllColumns().filter((c) => c.getCanHide());

  const pageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {(searchPlaceholder || toolbar || hideableColumns.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchPlaceholder ? (
            <div className="relative w-full sm:w-64">
              <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 ps-8"
              />
            </div>
          ) : null}
          {toolbar}
          {hideableColumns.length > 0 && !isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ms-auto h-9">
                  <SlidersHorizontal className="size-4" />
                  {t("common.filter", "View")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    className="capitalize"
                  >
                    {(column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        emptyState ?? <EmptyState title={t("common.noResults", "No results found")} />
      ) : isMobile && renderMobileCard ? (
        <div className="space-y-3">
          {rows.map((row) =>
            onRowClick ? (
              <button
                key={row.id}
                type="button"
                onClick={() => onRowClick(row.original)}
                onMouseEnter={() => onRowPrefetch?.(row.original)}
                onFocus={() => onRowPrefetch?.(row.original)}
                className="block w-full text-start focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:rounded-xl"
              >
                {renderMobileCard(row.original)}
              </button>
            ) : (
              <div key={row.id} onMouseEnter={() => onRowPrefetch?.(row.original)}>
                {renderMobileCard(row.original)}
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  onMouseEnter={() => onRowPrefetch?.(row.original)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground tabular">
            {t("common.page", { current: pageIndex + 1, total: totalPages, defaultValue: `Page ${pageIndex + 1} of ${totalPages}` })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label={t("common.previous", "Previous")}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
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
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      ) : colCount === 0 ? null : null}
    </div>
  );
}

/** Sortable column header button for use in column defs. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: import("@tanstack/react-table").Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ms-2 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" />
      )}
    </Button>
  );
}
