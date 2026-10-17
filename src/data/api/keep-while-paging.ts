import { hashKey, type QueryKey } from "@tanstack/react-query";

/** The key with its `page` param dropped: two keys that differ only by page are the same list. */
const listKey = (key: QueryKey): string =>
  hashKey(key.map((part) => (part && typeof part === "object" && !Array.isArray(part) ? { ...part, page: undefined } : part)));

/**
 * `placeholderData` for a paged list: while ONLY the page changes, the previous
 * result stays as placeholder, so whatever is computed over the whole filtered
 * set (KPIs, totals, page count) stays on screen. A filter or scope change gets
 * no placeholder, so the page shows its skeletons. Either way the rows are not
 * the requested ones yet: draw the table with `loading={isLoading || isPlaceholderData}`.
 *
 *   const params = { ...filters, page, per_page };
 *   useListOrders(params, { query: { placeholderData: keepWhilePaging(getListOrdersQueryKey(params)) } });
 */
export function keepWhilePaging(current: QueryKey) {
  const want = listKey(current);
  return <T>(previous: T | undefined, previousQuery?: { queryKey: QueryKey }): T | undefined =>
    previousQuery && listKey(previousQuery.queryKey) === want ? previous : undefined;
}
