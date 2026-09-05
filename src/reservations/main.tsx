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
//
// ── Status ──────────────────────────────────────────────────────────────────
//
// The booking DOMAIN is not built yet. The previous reservations flow was
// removed — it shipped and was never used, zero bookings ever — and its
// replacement is being built on the floor/ticket layer, where a table's real
// occupancy is already known.
//
// So this ships the origin, the bundle, the routing and the shell, and says
// plainly that booking is not open yet. It deliberately does NOT render a form
// that looks like it takes reservations: a guest who fills one in and gets no
// table is worse off than one who was told to phone.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useTranslation } from "react-i18next";

// Self-hosted fonts (match the dashboard and the ordering app).
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";

import "@/styles/globals.css";

// Side effects: i18n + RTL and the theme class. The admin auth/app stores are
// intentionally NOT imported — this origin never holds a session.
import "@/i18n";
import "@/lib/theme";

import { queryClient } from "@/data/api/query";

/**
 * The one screen this app has today.
 *
 * Honest rather than decorative: it names the venue when the URL identifies
 * one, and tells the guest what to do instead. No fake availability, no form
 * that goes nowhere.
 */
function BookingNotOpen() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-balance text-xl font-semibold tracking-tight">
        {t("reservations.notOpenTitle", "Online booking isn’t available yet")}
      </h1>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        {t(
          "reservations.notOpenBody",
          "We’re building it. In the meantime, please call the venue to reserve a table.",
        )}
      </p>
    </main>
  );
}

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: BookingNotOpen,
});

// Org- and branch-level deep links resolve to the same screen for now, but the
// routes exist so a QR printed today keeps working when booking opens.
const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$orgId",
  component: BookingNotOpen,
});

const branchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$orgId/$branchId",
  component: BookingNotOpen,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, orgRoute, branchRoute]),
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
