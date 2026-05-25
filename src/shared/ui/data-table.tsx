import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Row,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { normalize } from "@/shared/lib/normalize";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  searchKey?: keyof T & string;
  searchPlaceholder?: string;
  pageSize?: number;
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** When provided, renders an Export button in the toolbar */
  onExport?: () => void | Promise<void>;
  exportLabel?: string;
  /** Row className override */
  rowClassName?: (row: Row<T>) => string | undefined;
  /** Control density */
  density?: "comfortable" | "compact";
  /** Disable client-side pagination entirely */
  disablePagination?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  searchKey,
  searchPlaceholder,
  pageSize = 20,
  toolbar,
  emptyState,
  onRowClick,
  onExport,
  exportLabel,
  rowClassName,
  density = "comfortable",
  disablePagination = false,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    initialState: disablePagination ? undefined : { pagination: { pageSize } },
    // Normalized global filter — handles Arabic variants, diacritics, case
    globalFilterFn: (row, _columnId, value) => {
      const q = normalize(String(value ?? ""));
      if (!q) return true;
      for (const cell of row.getAllCells()) {
        const v = cell.getValue();
        if (v == null) continue;
        if (typeof v !== "string" && typeof v !== "number") continue;
        if (normalize(String(v)).includes(q)) return true;
      }
      return false;
    },
  });

  const rowCount = table.getFilteredRowModel().rows.length;
  const padY = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="space-y-3">
      {(searchKey || toolbar || onExport) && (
        <div className="flex items-center gap-3 flex-wrap">
          {searchKey && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder ?? t("common.searchPlaceholder")}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="ps-9 h-9"
              />
            </div>
          )}
          {toolbar}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onExport()}
              disabled={data.length === 0}
              className="ms-auto"
            >
              <Download /> {exportLabel ?? t("common.export")}
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b bg-muted/40">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortState = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                          canSort && "cursor-pointer select-none hover:text-foreground",
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1.5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              <span className="text-muted-foreground/70">
                                {sortState === "asc" ? (
                                  <ChevronUp size={12} />
                                ) : sortState === "desc" ? (
                                  <ChevronDown size={12} />
                                ) : (
                                  <ChevronsUpDown size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {columns.map((_, j) => (
                      <td key={j} className={cn("px-4", padY)}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center text-muted-foreground text-sm">
                    {emptyState ?? t("common.noResults")}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b last:border-0 transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/30",
                      rowClassName?.(row),
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cn("px-4 align-middle whitespace-nowrap", padY)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!disablePagination && table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {t("common.rows", { count: rowCount })} ·{" "}
              {t("common.page", {
                current: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount(),
              })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="rtl:rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="rtl:rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="rtl:rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
