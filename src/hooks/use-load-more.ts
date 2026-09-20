import { useState } from "react";

/**
 * "Load more" over an endpoint that takes `limit`/`offset`: the window widens
 * from the top a page at a time, up to the server's ceiling, and starts over
 * whenever `resetKey` (the search, the filters) changes.
 *
 * `props(shown, fetching)` is `DataTable`'s `loadMore`: there is more when the
 * window came back full and the ceiling has not been reached.
 */
export function useLoadMore({ resetKey, pageSize, max }: { resetKey: unknown; pageSize: number; max: number }) {
  const [pages, setPages] = useState(1);
  const [lastKey, setLastKey] = useState(resetKey);
  if (!Object.is(lastKey, resetKey)) {
    setLastKey(resetKey);
    setPages(1);
  }
  const limit = Math.min(pageSize * pages, max);
  return {
    limit,
    props: (shown: number, fetching: boolean) => ({
      hasMore: shown >= limit && limit < max,
      loading: fetching,
      onLoadMore: () => setPages((p) => p + 1),
    }),
  };
}
