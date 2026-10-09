/**
 * The TanStack Query and Router devtools, in development only, and never on
 * a phone-width screen: their floating launchers sat over card headers at
 * 390 px (box verify: Discipline and Legal), which is what an E2E run on a
 * phone viewport screenshots. Production builds never include them.
 */
import { lazy, Suspense } from "react";

import { useIsMobile } from "@/hooks/use-mobile";

// Behind the DEV flag, so a production build drops them entirely.
const QueryDevtools = import.meta.env.DEV
  ? lazy(() => import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })))
  : null;
const RouterDevtools = import.meta.env.DEV
  ? lazy(() => import("@tanstack/react-router-devtools").then((m) => ({ default: m.TanStackRouterDevtools })))
  : null;

/** `dev`: whether this is a development build (import.meta.env.DEV), a prop so it can be tested. */
export function DevTools({ which, dev = import.meta.env.DEV }: { which: "query" | "router"; dev?: boolean }) {
  const phone = useIsMobile();
  if (!dev || phone || !QueryDevtools || !RouterDevtools) return null;
  return (
    <Suspense fallback={null}>
      {which === "query" ? <QueryDevtools initialIsOpen={false} /> : <RouterDevtools position="bottom-right" />}
    </Suspense>
  );
}
