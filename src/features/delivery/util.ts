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

/**
 * Invalidate ALL channel menu-override and channel addon-override queries
 * (all channels and branches) after an upsert / delete.
 * Using a broad prefix invalidation ensures switching the channel dropdown
 * does not show stale data from a previous write.
 */
export const invalidateChannelOverrides = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return (
        typeof k === "string" &&
        (k.startsWith("/delivery/channel-overrides") ||
          k.startsWith("/delivery/channel-addon-overrides"))
      );
    },
  });
