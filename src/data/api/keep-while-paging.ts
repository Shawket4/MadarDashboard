import { hashKey, type QueryKey } from "@tanstack/react-query";

/** The key with its paging param dropped: two keys that differ only by it are the same list. */
const listKey = (key: QueryKey, by: string): string =>
  hashKey(key.map((part) => (part && typeof part === "object" && !Array.isArray(part) ? { ...part, [by]: undefined } : part)));

/**
 * `placeholderData` for a paged list: while ONLY the page changes, the previous
 * result stays as placeholder, so whatever is computed over the whole filtered
 * set (KPIs, totals, page count) stays on screen. A filter or scope change gets
 * no placeholder, so the page shows its skeletons. Either way the rows are not
 * the requested ones yet: draw the table with `loading={isLoading || isPlaceholderData}`.
 *
 *   const params = { ...filters, page, per_page };
 *   useListOrders(params, { query: { placeholderData: keepWhilePaging(getListOrdersQueryKey(params)) } });
 *
 * A "load more" list pages by its window instead: `keepWhilePaging(key, "limit")`
 * keeps the rows on screen while only the window widens.
 */
export function keepWhilePaging(current: QueryKey, by = "page") {
  const want = listKey(current, by);
  return <T>(previous: T | undefined, previousQuery?: { queryKey: QueryKey }): T | undefined =>
    previousQuery && listKey(previousQuery.queryKey, by) === want ? previous : undefined;
}
