import { queryClient } from "@/data/api/query";

/** Invalidate all delivery-zone queries after a create / update / delete. */
export const invalidateZones = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" &&
      (q.queryKey[0] as string).startsWith("/delivery/zones"),
  });

/** Invalidate branch delivery settings after a save. */
export const invalidateBranchSettings = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" &&
      (q.queryKey[0] as string).startsWith("/delivery/settings"),
  });

