// RankedTable: the Operations report's "who or what moved the volume" table.
// One row per thing (an item, an add-on; later a teller, a waiter, a branch),
// ranked by one metric, with sortable figures, a share bar, search and an
// optional category filter in the card's toolbar, and the top N with
// "Show all".
//
//   <RankedTable
//     title="Items" rows={rows} getRowId={…} rankMetric={(r) => r.total_qty}
//     item={{ header: "Item", name: (r) => …, sub: (r) => … }}
//     columns={[{ id: "qty", header: "Sold", sortValue: …, cell: … },
//               { id: "share", header: "Share", share: (r) => ratio }]}
//     searchPlaceholder="Search items" loading={…} error={…} onRetry={…}
//   />
//
// It is a real <table> at every width: on a phone the rank and item columns
// stay put while the figures scroll sideways inside the card, never the page.
// Motion (src/lib/motion): rows rise in one after another when a new set of
// them lands (first load, a tab switch, a new period), the share bars grow
// from nothing to their length, and a re-sort slides each row to its new
// place (Flip). Searching changes the rows at once: nothing moves under
// someone typing. Reduced motion: everything at rest.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

import { ChartCard } from "@/components/app/chart-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { fmtNumber } from "@/lib/format";
import { DISTANCE, recipes, useFlip, useStagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ChartEmpty, ChartError } from "./report-kit";
import {
  ALL,
  RANK,
  ariaSortOf,
  barLength,
  categoriesOf,
  filterRows,
  fmtShareCell,
  nextSort,
  rankBy,
  sortRows,
  type SortState,
  type SortValue,
} from "./ranked-table-util";

export interface RankedColumn<T> {
  id: string;
  /** The translated header. */
  header: string;
  /** The figure the column sorts by. Without it the column does not sort. */
  sortValue?: (r: T) => SortValue;
  /** Formatted cell content (lib/format). A `share` column draws its own. */
  cell?: (r: T) => ReactNode;
  /**
   * A share column: the ratio (0 to 1) as a bar plus a percent; null draws
   * "—". The bar is drawn against the table's largest share (barLength).
   */
  share?: (r: T) => number | null;
  /** Where the column sits on a phone (lower first); the key figures go first. */
  phoneOrder?: number;
  /** The headline figure: set a little heavier. */
  strong?: boolean;
}

export interface RankedTableProps<T> {
  title: ReactNode;
  /**
   * A line under the title (a count, a total). A placeholder holds its place
   * while loading, so the table does not jump when the figures land.
   */
  description?: ReactNode;
  footnote?: ReactNode;
  rows: T[];
  getRowId: (r: T) => string;
  /** What the rank counts (highest first); null ranks after every figure. */
  rankMetric: (r: T) => number | null;
  /** The item column: name (sorted and searched), an optional second line. */
  item: {
    header: string;
    name: (r: T) => string;
    /** More strings the search box matches (the other language's name). */
    alsoMatches?: (r: T) => (string | null | undefined)[];
    sub?: (r: T) => ReactNode;
    /** A picture beside the name; without one, the name's initial on a tile. */
    thumb?: (r: T) => string | null | undefined;
  };
  columns: RankedColumn<T>[];
  /** A category filter in the toolbar; shown when the rows hold two or more. */
  category?: {
    label: string;
    allLabel: string;
    of: (r: T) => string | null | undefined;
    labelOf?: (value: string) => string;
  };
  searchPlaceholder: string;
  /** Rows shown before "Show all". */
  topN?: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emptyTitle?: ReactNode;
  className?: string;
}

/** Opaque cell grounds, so the sticky columns hide what scrolls beneath and still highlight with the row. */
const CELL_BG =
  "bg-card transition-colors group-hover/row:bg-[color-mix(in_oklab,var(--accent)_55%,var(--card))]";
const HEAD =
  "h-10 border-b bg-card px-2 align-middle text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase sm:h-11 sm:px-3 rtl:tracking-normal";

const SKELETON_ROWS = 6;

export function RankedTable<T>({
  title,
  description,
  footnote,
  rows,
  getRowId,
  rankMetric,
  item,
  columns,
  category,
  searchPlaceholder,
  topN = 10,
  loading,
  error,
  onRetry,
  emptyTitle,
  className,
}: RankedTableProps<T>) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [sort, setSort] = useState<SortState>({ id: RANK, dir: "asc" });
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(ALL);
  const [showAll, setShowAll] = useState(false);

  const ranks = useMemo(() => rankBy(rows, getRowId, rankMetric), [rows, getRowId, rankMetric]);
  const rankOf = (r: T) => ranks.get(getRowId(r)) ?? Number.MAX_SAFE_INTEGER;
  const categories = useMemo(
    () => (category ? categoriesOf(rows, category.of, i18n.language) : []),
    [rows, category, i18n.language],
  );
  const shareColumn = columns.find((c) => c.share);
  const largestShare = useMemo(
    () => (shareColumn?.share ? Math.max(0, ...rows.map((r) => shareColumn.share!(r) ?? 0)) : 0),
    [rows, shareColumn],
  );
  // A category that vanished with a new period falls back to all of them.
  const activeCat = cat !== ALL && !categories.includes(cat) ? ALL : cat;

  const ordered = useMemo(
    () => (isMobile ? [...columns].sort((a, b) => (a.phoneOrder ?? 99) - (b.phoneOrder ?? 99)) : columns),
    [columns, isMobile],
  );
  const valueOf = (r: T, id: string): SortValue => {
    if (id === "item") return item.name(r);
    const c = columns.find((col) => col.id === id);
    return c?.sortValue?.(r) ?? c?.share?.(r);
  };

  const filtered = filterRows(
    rows,
    query,
    (r) => [item.name(r), ...(item.alsoMatches?.(r) ?? [])],
    activeCat,
    category?.of,
  );
  const sorted = sortRows(filtered, sort, valueOf, rankOf, i18n.language);
  const shown = showAll ? sorted : sorted.slice(0, topN);

  // ── Motion ───────────────────────────────────────────────────────────────
  // New figures (another period, another branch) replay the arrival; a
  // refetch with the same figures, or a picture arriving, stays still.
  const signature = rows.map((r) => `${getRowId(r)}:${rankMetric(r)}`).join("|");
  const [arrival, setArrival] = useState({ signature, n: 0 });
  if (!loading && arrival.signature !== signature) setArrival({ signature, n: arrival.n + 1 });
  const body = useRef<HTMLTableSectionElement>(null);
  useStagger(body, {
    selector: ":scope > tr[data-row]",
    when: !loading,
    replayKey: arrival.n,
    recipe: recipes.rise("product", DISTANCE.xs),
  });
  useStagger(body, {
    selector: "[data-share-fill]",
    when: !loading,
    replayKey: arrival.n,
    recipe: recipes.grow(),
    delay: 0.06,
  });
  // A re-sort, a category or "Show all" moves rows to their new places. The
  // search box is left out: rows never slide under someone typing.
  useFlip(body, `${sort.id}:${sort.dir}|${activeCat}|${showAll}`, ":scope > tr[data-row]");

  // A phone (or a narrow card) scrolls the figures sideways inside the card;
  // then the header sticks to the scroller's top, otherwise under the app bar.
  const scroller = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const check = () => {
      const table = el.firstElementChild as HTMLElement | null;
      setOverflows(!!table && table.scrollWidth > el.clientWidth + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [loading, error, ordered.length, isMobile]);

  const onSort = (id: string, kind: "number" | "text") => setSort((s) => nextSort(s, id, kind));
  const sortLabel = (header: string) => t("reports.operations.ranked.sortBy", "Sort by {{column}}", { column: header });

  // ── Header ───────────────────────────────────────────────────────────────
  const sortHeader = (id: string, header: ReactNode, label: string, kind: "number" | "text", sortable = true) => {
    const active = sort.id === id;
    const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
    if (!sortable) return header;
    return (
      <button
        type="button"
        onClick={() => onSort(id, kind)}
        title={sortLabel(label)}
        className={cn(
          "group/sort -mx-1 inline-flex items-center gap-1 rounded-md px-1 py-1 uppercase transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none rtl:tracking-normal",
          kind === "number" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        <span>{header}</span>
        <Icon
          aria-hidden
          className={cn("size-3.5 shrink-0", !active && "opacity-40 group-hover/sort:opacity-80")}
        />
      </button>
    );
  };

  const stickyStart = overflows ? "sticky start-0 z-[2]" : "";
  const stickyItem = overflows ? "sticky start-11 z-[2] sm:start-14 border-e" : "";
  const headTop = overflows ? "sticky top-0 z-[3]" : "sticky top-14 z-[3]";

  const thead = (
    <thead>
      <tr>
        <th
          scope="col"
          aria-sort={ariaSortOf(sort, RANK)}
          className={cn(HEAD, headTop, stickyStart, overflows && "z-[4]", "w-11 ps-4 pe-1 text-start sm:w-14 sm:ps-5")}
        >
          {sortHeader(
            RANK,
            <>
              <span aria-hidden>#</span>
              <span className="sr-only">{t("reports.operations.ranked.rank", "Rank")}</span>
            </>,
            t("reports.operations.ranked.rank", "Rank"),
            "text",
          )}
        </th>
        <th
          scope="col"
          aria-sort={ariaSortOf(sort, "item")}
          className={cn(HEAD, headTop, stickyItem, overflows && "z-[4]", "text-start")}
        >
          {sortHeader("item", item.header, item.header, "text")}
        </th>
        {ordered.map((c, i) => (
          <th
            key={c.id}
            scope="col"
            aria-sort={ariaSortOf(sort, c.id)}
            className={cn(
              HEAD,
              headTop,
              "text-end",
              c.share && "w-[34%] min-w-36 sm:min-w-48",
              i === ordered.length - 1 && "pe-4 sm:pe-5",
            )}
          >
            {sortHeader(c.id, c.header, c.header, "number", !!(c.sortValue || c.share))}
          </th>
        ))}
      </tr>
    </thead>
  );

  // ── Body ─────────────────────────────────────────────────────────────────
  const cellBase = "h-11 border-b px-2 align-middle whitespace-nowrap sm:h-14 sm:px-3";
  const lastCol = (i: number) => i === ordered.length - 1 && "pe-4 sm:pe-5";

  const skeleton = Array.from({ length: SKELETON_ROWS }).map((_, i) => (
    <tr key={`sk-${i}`} aria-hidden>
      <td className={cn(cellBase, "ps-4 pe-1 sm:ps-5")}><Skeleton className="h-4 w-5" /></td>
      <td className={cellBase}>
        <span className="flex items-center gap-2.5 sm:gap-3">
          {item.thumb ? <Skeleton className="size-8 shrink-0 rounded-lg" /> : null}
          <Skeleton className="h-4 w-24 sm:w-40" />
        </span>
      </td>
      {ordered.map((c, j) => (
        <td key={c.id} className={cn(cellBase, lastCol(j))}>
          <Skeleton className={cn("ms-auto h-4", c.share ? "w-full max-w-48" : "w-14")} />
        </td>
      ))}
    </tr>
  ));

  const bodyRows = shown.map((r) => {
    const rank = rankOf(r);
    const name = item.name(r);
    const sub = item.sub?.(r);
    return (
      <tr key={getRowId(r)} data-row className="group/row">
        <td className={cn(cellBase, CELL_BG, stickyStart, "ps-4 pe-1 text-start font-mono text-xs text-muted-foreground tabular-nums sm:ps-5", rank <= 3 && "font-semibold text-foreground")}>
          <bdi>{fmtNumber(rank)}</bdi>
        </td>
        <th scope="row" className={cn(cellBase, CELL_BG, stickyItem, "text-start font-normal")}>
          <span className="flex items-center gap-2.5 sm:gap-3">
            {item.thumb ? <Thumb src={item.thumb(r)} name={name} /> : null}
            <span className="min-w-0">
              <span className="block max-w-32 truncate text-[13px] font-medium sm:max-w-64 sm:text-sm" title={name}>{name}</span>
              {sub ? <span className="block max-w-32 truncate text-xs text-muted-foreground sm:max-w-64">{sub}</span> : null}
            </span>
          </span>
        </th>
        {ordered.map((c, i) => (
          <td
            key={c.id}
            className={cn(
              cellBase,
              CELL_BG,
              "text-end font-mono text-xs tabular-nums sm:text-[13px]",
              c.strong && "font-semibold",
              lastCol(i),
            )}
          >
            {c.share ? <ShareBar ratio={c.share(r)} largest={largestShare} /> : <bdi>{c.cell?.(r)}</bdi>}
          </td>
        ))}
      </tr>
    );
  });

  const hasRows = rows.length > 0;
  const toolbar = hasRows || loading ? (
    <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5">
      <div className="relative w-full sm:w-64">
        <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-9 ps-9"
          disabled={loading}
        />
      </div>
      {category && categories.length > 1 ? (
        <Select value={activeCat} onValueChange={setCat}>
          <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-40" aria-label={category.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{category.allLabel}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{category.labelOf?.(c) ?? c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  ) : null;

  let content: ReactNode;
  if (error && !loading) content = <ChartError onRetry={onRetry} />;
  else if (!loading && !hasRows) content = <ChartEmpty title={emptyTitle} />;
  else
    content = (
      <>
        <div
          ref={scroller}
          data-slot="ranked-table"
          className={cn(
            // Sideways scrolling stays inside the card; with it, the header sticks to the card.
            overflows ? "max-h-[min(70vh,40rem)] overflow-auto overscroll-x-contain" : "overflow-x-clip",
          )}
          aria-busy={loading || undefined}
        >
          <table className="w-full border-separate border-spacing-0 text-sm">
            {thead}
            <tbody ref={body} className="[&>tr:last-child>*]:border-b-0">
              {loading ? skeleton : bodyRows}
            </tbody>
          </table>
          {!loading && filtered.length === 0 ? (
            <ChartEmpty className="py-8" title={t("reports.operations.ranked.noMatch", "Nothing matches your search")} />
          ) : null}
        </div>
        {!loading && sorted.length > topN ? (
          <div className="flex items-center justify-between gap-2 border-t px-4 pt-3 sm:px-5">
            <p className="text-sm text-muted-foreground tabular-nums">
              {t("reports.operations.ranked.showing", "{{shown}} of {{total}}", {
                shown: fmtNumber(shown.length),
                total: fmtNumber(sorted.length),
              })}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
              {showAll
                ? t("reports.operations.ranked.showTop", "Show top {{count}}", { count: topN })
                : t("reports.operations.ranked.showAll", "Show all {{count}}", { count: sorted.length })}
            </Button>
          </div>
        ) : null}
      </>
    );

  return (
    <ChartCard
      title={title}
      description={loading ? <Skeleton className="my-0.5 h-4 w-36" /> : description}
      className={className} contentClassName="space-y-3 px-0 sm:px-0">
      {toolbar}
      {content}
      {footnote ? <p className="px-4 text-xs text-muted-foreground sm:px-5">{footnote}</p> : null}
    </ChartCard>
  );
}

/**
 * A share: a bar on a hairline track, then the percent. The bar's length is
 * the share against the table's largest (the leader's is full); the percent
 * is the true share. The fill grows from the inline start. No share: "—".
 */
function ShareBar({ ratio, largest }: { ratio: number | null; largest: number }) {
  if (ratio === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex items-center justify-end gap-2.5">
      <span aria-hidden className="relative h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-muted">
        <span
          data-share-fill=""
          className="absolute inset-y-0 start-0 rounded-full bg-chart-1 origin-left rtl:origin-right"
          style={{ width: `${(barLength(ratio, largest) * 100).toFixed(2)}%` }}
        />
      </span>
      <bdi className="w-12 shrink-0 text-end">{fmtShareCell(ratio)}</bdi>
    </span>
  );
}

/**
 * An item's picture, 32 px, decorative (the name sits beside it). With no
 * picture, or one that fails to load, the name's first letter on a tile.
 */
function Thumb({ src, name }: { src: string | null | undefined; name: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const box = "size-8 shrink-0 rounded-lg";
  if (!src || failed === src) {
    return (
      <span aria-hidden className={cn(box, "grid place-items-center bg-muted text-xs font-semibold text-muted-foreground")}>
        {Array.from(name.trim())[0]?.toUpperCase() ?? ""}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
      className={cn(box, "bg-muted object-cover")}
    />
  );
}
