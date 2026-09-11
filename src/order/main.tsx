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

// Self-hosted fonts (work offline in Tauri).
//
// ONE SUPERFAMILY. The Arabic cut leads and carries Latin too, so a bilingual
// row sits on one skeleton instead of two faces meeting in the middle of it;
// the Latin cut backs it up, and the mono carries every figure so columns of
// money and ids line up. Four static weights — 400/500/600/700 — which is the
// whole of what the interface uses.
//
// LATIN AND ARABIC SUBSETS ONLY. The bare `400.css` entries pull Cyrillic,
// Greek and Vietnamese as well, which is most of a megabyte this product has no
// text for — and it is downloaded on a phone, on a counter, over whatever
// connection the shop has.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "@fontsource/ibm-plex-sans-arabic/latin-500.css";
import "@fontsource/ibm-plex-sans-arabic/latin-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-700.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";

import "@/styles/globals.css";

// Side effects: i18n + RTL and the theme class. NOTE: the admin auth/app stores are
// intentionally NOT imported — this origin never holds a session.
import "@/i18n";
import { initPublicTheme } from "@/features/public-shell/use-public-theme";

import { queryClient } from "@/data/api/query";
import { PublicOrderingPage } from "@/features/public-ordering/public-ordering-page";
import { useHostOrg } from "@/features/public-shell/use-brand";
import { ScanToOrder } from "@/features/public-ordering/scan-to-order";
import { OrderTrackingPage } from "@/features/order-tracking/tracking-page";

// LIGHT unless this visitor chose otherwise on this shop — not the device's
// preference. A storefront should look the same to every customer.
initPublicTheme();

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
  validateSearch: orderSearchSchema,
  // On a shop's own hostname this is that shop's menu. The URL carries no org
  // id there — the hostname is the id — so it is looked up once and the same
  // page renders as if it had been in the path all along.
  component: function Index() {
    const { orgId, resolving } = useHostOrg();
    const s = indexRoute.useSearch();
    if (resolving) return null;
    if (!orgId) return <ScanToOrder />;
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
  // Where this bundle is mounted, which is not always the root.
  //
  // On a shop's own hostname the ordering pages are served under a sub-path, so
  // the browser's pathname carries a prefix the routes know nothing about —
  // without this, `/order` would match `/$orgId` and the shop would be told its
  // id is the word "order". Vite writes the build's base here, so the router
  // and the assets can never disagree about where they are.
  basepath: import.meta.env.BASE_URL,
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
