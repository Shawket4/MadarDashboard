import { useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { prefetchRoute } from "@/lib/route-prefetch";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";

type PreloadOpts = Parameters<ReturnType<typeof useRouter>["preloadRoute"]>[0];

/**
 * One intent-prefetch for any nav target. Warms both halves on hover/focus:
 *  - the route's code chunk (what `<Link defaultPreload="intent">` does, but for
 *    programmatic surfaces like the command palette that navigate imperatively);
 *  - the page's mount-time queries (see `prefetchRoute`).
 *
 * The router dedupes code preloads, so it's safe to also call this from `<Link>`
 * surfaces where intent preload already runs.
 */
export function useRoutePrefetch() {
  const router = useRouter();
  const qc = useQueryClient();
  const orgId = useOrgId();
  const { branchId, from, to, preset } = useScope();

  return useCallback(
    (route: string) => {
      void router.preloadRoute({ to: route } as PreloadOpts).catch(() => {});
      prefetchRoute(route, { queryClient: qc, orgId, branchId, from, to, preset });
    },
    [router, qc, orgId, branchId, from, to, preset],
  );
}
