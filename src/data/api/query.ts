import { QueryCache, QueryClient, type Query } from "@tanstack/react-query";
import { AxiosError } from "axios";


/** The limiter's "not now" (the same test as errors.ts's, kept here: this module loads without i18n or a DOM). */
const isRateLimited = (err: unknown): boolean => err instanceof AxiosError && err.response?.status === 429;

/** Retry policy: never auth / client errors; a 429 up to three times, later each time; anything else once. */
export const queryRetry = (failureCount: number, error: unknown): boolean => {
  if (error instanceof AxiosError) {
    const s = error.response?.status ?? 0;
    if (s === 401 || s === 403 || s === 404 || s === 422) return false;
    if (s === 429) return failureCount < 3;
  }
  return failureCount < 1;
};

/** 2 s, 4 s, 8 s for a 429 (the limiter clears "in a moment"); TanStack's default otherwise. */
const queryRetryDelay = (attempt: number, error: unknown): number =>
  isRateLimited(error) ? 2_000 * 2 ** attempt : Math.min(1000 * 2 ** attempt, 30_000);

/**
 * A Dawam read (`/staff/...`) whose refresh fails while its last data is still
 * on screen: the page keeps showing that data (it only shows its error state
 * with nothing to show), so the failure is said here, once per kind.
 */
export const onQueryError = (error: unknown, query: { queryKey: Query["queryKey"]; state: { data: unknown } }): void => {
  const head = query.queryKey[0];
  if (query.state.data === undefined) return;
  if (typeof head !== "string" || !(head === "/staff" || head.startsWith("/staff/"))) return;
  const id = isRateLimited(error) ? "dawam-refresh-429" : "dawam-refresh-failed";
  // Loaded on use: this module is also imported where there is no DOM (node tests, tooling).
  void Promise.all([import("./errors"), import("sonner")]).then(([{ getErrorMessage }, { toast }]) =>
    toast.error(getErrorMessage(error), { id }),
  );
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (error, query) => onQueryError(error, query) }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: queryRetry,
      retryDelay: queryRetryDelay,
    },
    mutations: { retry: 0 },
  },
});
