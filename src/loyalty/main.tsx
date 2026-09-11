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

// Side effects: i18n + RTL and the theme class. The admin auth/app stores are
// intentionally NOT imported — this origin never holds a session.
import "@/i18n";
import "@/styles/globals.css";
import { initPublicTheme } from "@/features/public-shell/use-public-theme";

import { queryClient } from "@/data/api/query";
import { JoinPage } from "@/features/loyalty/public/join-page";
import { CardPage } from "@/features/loyalty/public/card-page";
import { useHostOrg } from "@/features/public-shell/use-brand";
import { ScanToJoin } from "@/features/loyalty/public/scan-to-join";

// LIGHT unless this visitor chose otherwise on this shop — not the device's
// preference. A storefront should look the same to every customer.
initPublicTheme();

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  // On a shop's own hostname this IS the shop's sign-up page — the URL has no
  // org id to carry one, and telling someone standing on `drops.madar-pos.cloud`
  // to go and scan a code would be absurd. Everywhere else it is what it has
  // always been.
  component: function Index() {
    const { orgId, resolving } = useHostOrg();
    if (resolving) return null;
    return orgId ? <JoinPage orgId={orgId} /> : <ScanToJoin />;
  },
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
