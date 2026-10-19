import { getGetReadinessQueryOptions, useGetReadiness } from "@/data/api/generated/api";

/**
 * The shop's readiness, read fresh each time a page that shows it mounts: the
 * owner fixes things on other pages and comes back, and the answer must be the
 * shop as it is now (the server derives it on every read; nothing is stored).
 */
export const readinessQueryOptions = (orgId: string) => getGetReadinessQueryOptions(orgId);

export function useReadiness(orgId: string | null) {
  return useGetReadiness(orgId ?? "", {
    query: { enabled: !!orgId, refetchOnMount: "always", refetchOnWindowFocus: true },
  });
}
