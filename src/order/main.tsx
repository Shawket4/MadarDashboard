// Standalone customer ordering app — served on its OWN origin (order.madar-pos.cloud),
// completely separate from the management dashboard for security: a different bundle
// (no admin code is shipped here), a different origin (no shared cookies / localStorage
// / auth token), and a tighter CSP at the edge.
//
// URL scheme (path-based org + branch):
//   /                      — landing (scan a QR)
//   /<orgId>               — org-level: customer picks a branch
//   /<orgId>/<branchId>    — branch pre-selected (QR deep link), +search: channel, table,
//                            preview, place_name, floor, unit_number
//   /track/<id>            — public order tracking
//   /order/<orgId>         — back-compat alias (tracking page links here)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { z } from "zod";

// Self-hosted fonts (match the dashboard).
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";

import "@/styles/globals.css";

// Side effects: i18n + RTL and the theme class. NOTE: the admin auth/app stores are
// intentionally NOT imported — this origin never holds a session.
import "@/i18n";
import "@/lib/theme";

import { queryClient } from "@/data/api/query";
import { PublicOrderingPage } from "@/features/public-ordering/public-ordering-page";
import { ScanToOrder } from "@/features/public-ordering/scan-to-order";
import { OrderTrackingPage } from "@/features/order-tracking/tracking-page";

const orderSearchSchema = z.object({
  branch: z.string().optional(),
  channel: z.string().optional(),
  table: z.string().optional(),
  preview: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === true || v === "1" || v === "true" ? true : undefined)),
  place_name: z.string().optional(),
  floor: z.coerce.string().optional(),
  unit_number: z.coerce.string().optional(),
});

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ScanToOrder,
});

const trackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track/$id",
  validateSearch: z.object({ est: z.number().optional() }),
  component: function Track() {
    const { id } = trackRoute.useParams();
    const { est } = trackRoute.useSearch();
    return <OrderTrackingPage id={id} estimate={est ?? null} />;
  },
});

// Back-compat: the tracking page links to "/order/$orgId". Render the org-level page.
const orderCompatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order/$orgId",
  validateSearch: orderSearchSchema,
  component: function OrderCompat() {
    const { orgId } = orderCompatRoute.useParams();
    const s = orderCompatRoute.useSearch();
    return (
      <PublicOrderingPage
        orgId={orgId}
        branch={s.branch}
        channel={s.channel}
        preview={s.preview}
        prefillPlaceName={s.place_name}
        prefillFloor={s.floor}
        prefillUnitNumber={s.unit_number}
      />
    );
  },
});

const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$orgId",
  validateSearch: orderSearchSchema,
  component: function OrgOrder() {
    const { orgId } = orgRoute.useParams();
    const s = orgRoute.useSearch();
    return (
      <PublicOrderingPage
        orgId={orgId}
        branch={s.branch}
        channel={s.channel}
        preview={s.preview}
        prefillPlaceName={s.place_name}
        prefillFloor={s.floor}
        prefillUnitNumber={s.unit_number}
      />
    );
  },
});

const branchRoute = createRoute({
  // /$orgId/$branchId — branch fixed by the scanned QR; the selector is hidden.
  getParentRoute: () => rootRoute,
  path: "/$orgId/$branchId",
  validateSearch: orderSearchSchema,
  component: function BranchOrder() {
    const { orgId, branchId } = branchRoute.useParams();
    const s = branchRoute.useSearch();
    return (
      <PublicOrderingPage
        orgId={orgId}
        branch={branchId}
        branchLocked
        channel={s.channel}
        preview={s.preview}
        prefillPlaceName={s.place_name}
        prefillFloor={s.floor}
        prefillUnitNumber={s.unit_number}
      />
    );
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  trackRoute,
  orderCompatRoute,
  orgRoute,
  branchRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultViewTransition: true,
  // Any unrecognized path falls back to the branded scan-to-order prompt.
  defaultNotFoundComponent: ScanToOrder,
});

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
        </MotionConfig>
      </QueryClientProvider>
    </StrictMode>,
  );
}

// Dev-only mock harness (VITE_MOCK=1): serve curated public data so the ordering
// flow can be previewed/screenshotted without a backend. Tree-shaken from prod.
const mockFlag = (import.meta.env as Record<string, string | undefined>).VITE_MOCK;
if (import.meta.env.DEV && (mockFlag === "1" || mockFlag === "true")) {
  void import("@/data/api/mock/enable-public").then(({ enablePublicMocks }) =>
    enablePublicMocks().then(render),
  );
} else {
  render();
}
