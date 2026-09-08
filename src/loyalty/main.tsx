// Standalone public loyalty app — served on its OWN origin
// (loyalty.madar-pos.cloud), separate from the management dashboard for the
// same reasons the ordering and reservations apps are: a different bundle (no
// admin code ships here), a different origin (no shared cookies / localStorage
// / auth token), and a tighter CSP at the edge.
//
// URL scheme:
//   /join/<branchId>   — the counter QR's target: sign up at this branch
//   /card/<token>      — the member's own card (what their pass links back to)
//   /                  — landing: "scan the code on the counter"
//
// There is deliberately no org-level route. Unlike booking, joining always
// happens at a counter with a printed code, so the branch is always known.
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

// Self-hosted fonts (match the dashboard and the other public apps).
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
import { JoinPage } from "@/features/loyalty/join-page";
import { CardPage } from "@/features/loyalty/card-page";
import { ScanToJoin } from "@/features/loyalty/scan-to-join";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ScanToJoin,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join/$branchId",
  component: function Join() {
    const { branchId } = joinRoute.useParams();
    return <JoinPage key={branchId} branchId={branchId} />;
  },
});

/**
 * One code for the whole shop, as opposed to one branch's counter card.
 *
 * A distinct PATH rather than the same one carrying either kind of id: a public
 * link that means different things depending on what a uuid turns out to be is
 * a link nobody can reason about, and every branch card already printed keeps
 * working untouched.
 */
const joinOrgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join/org/$orgId",
  component: function JoinOrg() {
    const { orgId } = joinOrgRoute.useParams();
    return <JoinPage key={orgId} orgId={orgId} />;
  },
});

const cardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/card/$token",
  component: function Card() {
    const { token } = cardRoute.useParams();
    return <CardPage token={token} />;
  },
});

const router = createRouter({
  // `join/org/$orgId` before `join/$branchId`: the literal segment has to be
  // matched first, or "org" is read as a branch id.
  routeTree: rootRoute.addChildren([indexRoute, joinOrgRoute, joinRoute, cardRoute]),
  defaultPreload: "intent",
});

// NOTE: deliberately no `declare module "@tanstack/react-router"` Register
// block. That augmentation is GLOBAL — declaring it here would replace the
// dashboard's own router type for the whole project, and every typed `<Link to>`
// in the admin app would stop compiling. The ordering, reservations and landing
// apps omit it for the same reason.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
