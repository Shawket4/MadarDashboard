// Standalone public reservations app — served on its OWN origin
// (reservations.madar-pos.cloud), completely separate from the management
// dashboard for the same reasons the ordering app is: a different bundle (no
// admin code ships here), a different origin (no shared cookies / localStorage
// / auth token), and a tighter CSP at the edge.
//
// URL scheme, mirroring the ordering app so a QR code generated for one reads
// the same as the other.
//
// On a SHOP'S OWN hostname the org is the hostname, so it is not in the path:
//   /                      — this shop's booking page
//   /?branch=<branchId>    — branch pre-selected (QR deep link)
//
// On the shared host the org has to be named, so it is:
//   /                      — landing (scan a QR / pick a venue)
//   /<orgId>               — org-level: guest picks a branch
//   /<orgId>/<branchId>    — branch pre-selected (QR deep link)
//
// And either way:
//   /manage/<token>        — the guest's booking (from the WhatsApp link)
//
// The org-in-path forms are not legacy and are not going away: the shared host
// still needs them, and every code already printed uses them.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { z } from "zod";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// Self-hosted fonts (match the dashboard and the ordering app).
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource-variable/inter";

// Side effects: i18n + RTL and the theme class. The admin auth/app stores are
// intentionally NOT imported — this origin never holds a session.
import "@/i18n";
import "@/styles/globals.css";
import { initPublicTheme } from "@/features/public-shell/use-public-theme";

import { queryClient } from "@/data/api/query";
import { useHostOrg } from "@/features/public-shell/use-brand";
import { ScanToBook } from "@/features/reservations/scan-to-book";
import { ManagePage } from "@/features/reservations/manage-page";
import { ReservePage } from "@/features/reservations/reserve-page";

// LIGHT unless this visitor chose otherwise on this shop — not the device's
// preference. A storefront should look the same to every customer.
initPublicTheme();

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  // `?branch=` rather than a path segment, because on a shop's own hostname
  // there is no org in the path to tell a single segment apart from — `/<uuid>`
  // would be read as an org id. The ordering bundle names its branch the same
  // way, so the two QR codes for one table read alike.
  validateSearch: z.object({ branch: z.string().optional() }),
  // The shop's own booking page when the hostname names a shop; the scan
  // prompt everywhere else. See `useHostOrg`.
  component: function Index() {
    const { orgId, resolving } = useHostOrg();
    const { branch } = indexRoute.useSearch();
    if (resolving) return null;
    return orgId ? <ReservePage key={branch} orgId={orgId} branchId={branch} /> : <ScanToBook />;
  },
});

const manageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/manage/$token",
  component: function Manage() {
    const { token } = manageRoute.useParams();
    return <ManagePage token={token} />;
  },
});

const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$orgId",
  component: function Org() {
    const { orgId } = orgRoute.useParams();
    return <ReservePage orgId={orgId} />;
  },
});

const branchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$orgId/$branchId",
  component: function Branch() {
    const { orgId, branchId } = branchRoute.useParams();
    return <ReservePage key={branchId} orgId={orgId} branchId={branchId} />;
  },
});

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, manageRoute, orgRoute, branchRoute]),
  // Where this bundle is mounted, which is not always the root.
  //
  // On a shop's own hostname the ordering pages are served under a sub-path, so
  // the browser's pathname carries a prefix the routes know nothing about —
  // without this, `/order` would match `/$orgId` and the shop would be told its
  // id is the word "order". Vite writes the build's base here, so the router
  // and the assets can never disagree about where they are.
  basepath: import.meta.env.BASE_URL,
  defaultPreload: "intent",
});

// NOTE: deliberately no `declare module "@tanstack/react-router"` Register
// block. That augmentation is GLOBAL — declaring it here would replace the
// dashboard's own router type for the whole project, and every typed `<Link
// to>` in the admin app would stop compiling. The ordering and landing apps
// omit it for the same reason.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
