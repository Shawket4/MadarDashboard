import { useCallback } from "react";
import { useRouter, type AnyRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { warmOnce } from "@/lib/prefetch/intent";
import type { NavTarget, WarmRoute } from "@/lib/prefetch/nav-context";
import { resolveTarget, warmResolved } from "@/lib/prefetch/warm";
import { useAppStore } from "@/data/stores/app.store";
import { APP_TZ } from "@/data/config/constants";
import { useOrgId } from "@/hooks/use-org-id";

type PreloadOpts = Parameters<AnyRouter["preloadRoute"]>[0];

/**
 * The dashboard's one route warm-up, provided to every link, tab and row
 * through `NavPrefetchProvider` (the app shell). Given a destination as a
 * `<Link>` or `navigate()` names it, it:
 *  1. resolves it through the router (`resolveTarget`), so the warmed scope,
 *     tab and filters are the destination's, exactly as its page will read them;
 *  2. dedupes on the resolved href (`warmOnce`);
 *  3. preloads the route's code chunk, unless the caller is a `<Link>` (the
 *     router's `defaultPreload: "intent"` already does);
 *  4. runs the route's registry entry (`ROUTE_PREFETCH`), whose queries use the
 *     page's own keys, so the page renders from cache.
 */
export function useRoutePrefetch(): WarmRoute {
  const router = useRouter() as unknown as AnyRouter;
  const qc = useQueryClient();
  const orgId = useOrgId();
  const tz = useAppStore((s) => s.activeTimezone) || APP_TZ;

  return useCallback(
    (target: NavTarget | string, opts?: { code?: boolean }) => {
      const t: NavTarget = typeof target === "string" ? { to: target } : target;
      const r = resolveTarget(router, t, tz);
      if (!r) return;
      warmOnce(`route:${r.href}`, () => {
        if (opts?.code !== false) void router.preloadRoute(t as PreloadOpts).catch(() => {});
        warmResolved(qc, orgId, r);
      });
    },
    [router, qc, orgId, tz],
  );
}
