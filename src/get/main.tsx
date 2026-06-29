// Standalone marketing landing — served on its OWN origin (get.madar-pos.cloud),
// completely separate from the management dashboard and the ordering app: a
// different bundle (no admin/dashboard code is shipped here), a different origin
// (no shared cookies / localStorage / auth token). It is a single static page —
// no router, no API calls, no session. CTAs link cross-origin to the dashboard
// (VITE_DASHBOARD_URL).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";

// Self-hosted fonts (match the dashboard + ordering app).
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";

import "@/styles/globals.css";

// Side effects: i18n + RTL, and the theme class. NOTE: the admin auth/app stores
// are intentionally NOT imported — this origin never holds a session.
import "@/i18n";
import "@/lib/theme";

import { LandingPage } from "@/features/landing/landing-page";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LandingPage />
    </MotionConfig>
  </StrictMode>,
);
