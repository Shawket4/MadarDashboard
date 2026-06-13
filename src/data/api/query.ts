import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry auth / client errors
        if (error instanceof AxiosError) {
          const s = error.response?.status ?? 0;
          if (s === 401 || s === 403 || s === 404 || s === 422) return false;
        }
        return failureCount < 1;
      },
    },
    mutations: { retry: 0 },
  },
});
