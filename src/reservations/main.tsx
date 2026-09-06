// Standalone public reservations app — served on its OWN origin
// (reservations.madar-pos.cloud), completely separate from the management
// dashboard for the same reasons the ordering app is: a different bundle (no
// admin code ships here), a different origin (no shared cookies / localStorage
// / auth token), and a tighter CSP at the edge.
//
// URL scheme (path-based org + branch), mirroring the ordering app so a QR code
// generated for one reads the same as the other:
//   /                      — landing (scan a QR / pick a venue)
//   /<orgId>               — org-level: guest picks a branch
//   /<orgId>/<branchId>    — branch pre-selected (QR deep link)
//   /manage/<token>        — the guest's booking (from the WhatsApp link)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
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
import "@/lib/theme";

import { queryClient } from "@/data/api/query";
import { ScanToOrder } from "@/features/public-ordering/scan-to-order";
import { ManagePage } from "@/features/reservations/manage-page";
import { ReservePage } from "@/features/reservations/reserve-page";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ScanToOrder,
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
