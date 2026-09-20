/**
 * The shell of a list of people — customers, loyalty members: a server-side
 * search box, optional actions (export), the table, and an optional line under
 * it. Both pages draw this; when they become one page it is this one.
 *
 * It owns no data and no state: search comes from `useListSearch`, paging from
 * `useLoadMore` (or the footer), rows from the caller's query.
 */
import type { ComponentProps, ReactNode } from "react";

import { DataTable } from "@/components/app/data-table";
import { SearchInput } from "@/components/app/search-input";

type TableProps<T> = Omit<ComponentProps<typeof DataTable<T, unknown>>, "toolbar" | "searchPlaceholder">;

interface Props<T> extends TableProps<T> {
  search: { value: string; onChange: (v: string) => void; placeholder: string; className?: string };
  /**
   * Where the search sits. `table`: inside the table's own toolbar. `above`: a
   * row of its own over the table, with `actions` at its far end.
   */
  layout?: "table" | "above";
  /** Trailing controls on the search row (`above` only) — Export, say. */
  actions?: ReactNode;
  /** A line under the table — "Showing 100 of 412". */
  footer?: ReactNode;
}

export function PeopleList<T>({ search, layout = "table", actions, footer, ...table }: Props<T>) {
  const box = (
    <SearchInput
      value={search.value}
      onChange={search.onChange}
      placeholder={search.placeholder}
      className={search.className}
    />
  );
  if (layout === "table" && !footer) return <DataTable<T, unknown> {...table} toolbar={box} />;
  return (
    <div data-slot="people-list" className="space-y-4">
      {layout === "above" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {box}
          {actions}
        </div>
      ) : null}
      <DataTable<T, unknown> {...table} toolbar={layout === "table" ? box : undefined} />
      {footer}
    </div>
  );
}

/** The quiet line under a list that is showing fewer rows than exist. */
export function ListCount({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
