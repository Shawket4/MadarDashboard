import { queryClient } from "@/data/api/query";

/** Invalidate bundle list/detail queries after a mutation. */
export const invalidateBundles = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/bundles"),
  });
