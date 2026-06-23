import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MotionConfig } from "motion/react";

// Self-hosted fonts (work offline in Tauri).
import "@fontsource-variable/inter";
// Fraunces (variable serif) — editorial display face for headings / brand moments.
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";

import "@/styles/globals.css";

// Side-effect modules: i18n + RTL, theme class, and the stores that wire
// themselves into the axios ambient context.
import "@/i18n";
import "@/lib/theme";
import "@/data/stores/auth.store";
import "@/data/stores/app.store";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/app/confirm-dialog";
import { queryClient } from "@/data/api/query";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  // Native View Transitions on navigation — a quiet cross-fade between routes.
  // No-ops where unsupported; the reduced-motion guard in globals.css disables
  // the animation (but keeps the snapshot swap) for users who opt out.
  defaultViewTransition: true,
});

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={200}>
            <ConfirmProvider>
              <RouterProvider router={router} />
            </ConfirmProvider>
          </TooltipProvider>
          {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </MotionConfig>
      </QueryClientProvider>
    </StrictMode>,
  );
}

// Dev-only mock preview harness (VITE_MOCK=1): seed a session + serve mock data,
// then render. Gated by import.meta.env.DEV so it's tree-shaken from prod builds.
const mockFlag = (import.meta.env as Record<string, string | undefined>).VITE_MOCK;
if (import.meta.env.DEV && (mockFlag === "1" || mockFlag === "true")) {
  void import("@/data/api/mock/enable").then(({ enableMocks }) => enableMocks().then(render));
} else {
  render();
}
