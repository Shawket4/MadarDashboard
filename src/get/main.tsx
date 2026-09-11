// Standalone marketing landing — served on its OWN origin (get.madar-pos.cloud),
// completely separate from the management dashboard and the ordering app: a
// different bundle (no admin/dashboard code is shipped here), a different origin
// (no shared cookies / localStorage / auth token). It is a single static page —
// no router, no API calls, no session. CTAs link cross-origin to the dashboard
// (VITE_DASHBOARD_URL).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";

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

// Side effects: i18n + RTL, and the theme class. NOTE: the admin auth/app stores
// are intentionally NOT imported — this origin never holds a session.
import "@/i18n";
import { initDeviceTheme } from "@/lib/theme";

import { LandingPage } from "@/features/landing/landing-page";

initDeviceTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LandingPage />
    </MotionConfig>
  </StrictMode>,
);
