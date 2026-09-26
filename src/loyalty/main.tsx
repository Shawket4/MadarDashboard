// Standalone public loyalty app — served on its OWN origin
// (loyalty.madar-pos.cloud), separate from the management dashboard for the
// same reasons the ordering and reservations apps are: a different bundle (no
// admin code ships here), a different origin (no shared cookies / localStorage
// / auth token), and a tighter CSP at the edge.
//
// URL scheme:
//   /join/<branchId>    — the counter QR's target: sign up at this branch
//   /join/org/<orgId>   — the shop's own code: a poster, a receipt, a bio link
//   /card/<token>       — the member's own card (what their pass links back to)
//   /                   — on a shop's hostname, that shop's LINKS PAGE (order,
//                         menu, rewards, a table, its socials); on ours,
//                         "scan the code on the counter"
//   /rewards            — on a shop's hostname, its sign-up page (what `/`
//                         was before the links page)
//
// Membership belongs to the SHOP either way; a branch code only records where
// someone joined.
import { StrictMode, useEffect } from "react";
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

// Customer surface: the brand register, where the primary is Madar teal.
document.documentElement.classList.add("brand-surface");
import { initPublicTheme } from "@/features/public-shell/use-public-theme";

import { queryClient } from "@/data/api/query";
import { JoinPage } from "@/features/loyalty/public/join-page";
import { CardPage } from "@/features/loyalty/public/card-page";
import { useHostOrg } from "@/features/public-shell/use-brand";
import { ScanToJoin } from "@/features/loyalty/public/scan-to-join";
import { LinksPage } from "@/features/links/public/links-page";
import {
  detectInAppBrowser,
  escapeToBrowserOnce,
} from "@/features/loyalty/public/detect-inapp";
import {
  OpenInSafariPage,
  type EscapePlatform,
} from "@/features/loyalty/public/open-in-safari-page";

// LIGHT unless this visitor chose otherwise on this shop — not the device's
// preference. A storefront should look the same to every customer.
initPublicTheme();

/**
 * Every page on this origin, unless the visitor cannot finish here.
 *
 * On iOS inside Instagram/Facebook/TikTok the card cannot be installed at all —
 * a `.pkpass` needs the OS to claim it and a webview cannot pass it on — and
 * nothing escapes an in-app browser programmatically. Signing someone up there
 * would succeed until the final tap and then fail in silence.
 *
 * So the gate is here rather than on the wallet button: the whole flow is
 * replaced by the one instruction that leads somewhere.
 *
 * Android inside the same apps has a real way out — `intent://` to the
 * customer's default browser — so it is tried first, once, and the same page
 * (in Android's wording) stands behind it: it is what the webview shows while
 * the browser opens, and the instruction if the hand-off is refused.
 */
const rootRoute = createRootRoute({
  component: function Root() {
    const inApp = detectInAppBrowser();
    // Dev-only: this page is unreachable in a normal browser, because it is
    // gated on an in-app user agent. `?inapp=Instagram` renders the iOS page
    // and `?inapp=Instagram&platform=android` the Android one, so both can be
    // looked at and their motion checked without spoofing a UA. The preview
    // never redirects. Stripped from production builds by `import.meta.env.DEV`.
    let preview: { app: string; platform: EscapePlatform } | null = null;
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const app = params.get("inapp");
      if (app) {
        preview = { app, platform: params.get("platform") === "android" ? "android" : "ios" };
      }
    }

    const escape =
      !preview && !!inApp?.android && !inApp.ios && !isLinksPath(window.location.pathname);
    useEffect(() => {
      if (escape) escapeToBrowserOnce();
    }, [escape]);

    // The links page is exempt: it is what an Instagram bio opens, IN
    // Instagram's browser, and every button on it works there — only a wallet
    // pass cannot be installed from one, and that is the rewards page's gate.
    const gated = !isLinksPath(window.location.pathname);
    if (gated && preview) return <OpenInSafariPage app={preview.app} platform={preview.platform} />;
    if (gated && inApp?.ios) return <OpenInSafariPage app={inApp.app} platform="ios" />;
    if (gated && escape) return <OpenInSafariPage app={inApp!.app} platform="android" />;
    return <Outlet />;
  },
});

/**
 * `/` on a shop's own hostname: its links page. The one path that is not
 * behind the in-app-browser gate above.
 */
function isLinksPath(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  // On a shop's own hostname this is the shop's links page — every door it
  // runs on Madar, rewards among them. Everywhere else it is what it has
  // always been.
  component: function Index() {
    const { orgId, resolving } = useHostOrg();
    if (resolving) return null;
    return orgId ? <LinksPage /> : <ScanToJoin />;
  },
});

/**
 * The shop's sign-up page, where `/` used to put it. Printed counter codes
 * point at `/join/...` and wallet passes at `loyalty.madar-pos.cloud`, so
 * nothing already in a customer's hands moves.
 */
const rewardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rewards",
  component: function Rewards() {
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
  routeTree: rootRoute.addChildren([indexRoute, rewardsRoute, joinOrgRoute, joinRoute, cardRoute]),
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
