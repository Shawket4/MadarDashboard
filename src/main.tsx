import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MotionConfig } from "motion/react";
import * as Sentry from "@sentry/react";

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
import { AppErrorBoundary } from "@/components/app/app-error-boundary";
import { initSentry } from "@/lib/sentry";
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

// Error/performance monitoring + masked session replay. No-op without a DSN.
//
// GUARDED, and it must stay guarded. This runs BEFORE `render()`, so anything
// it throws takes the whole app down to a blank page — the browser has no
// reason to continue executing the entry module. Observability failing is an
// inconvenience; a dashboard that will not open is an outage, and the app wins
// that trade every time. (The Flutter app has had this guarantee since it was
// written; the web app did not.)
try {
  initSentry(router);
} catch (err) {
  console.error("Sentry failed to initialise; continuing without it.", err);
}

/**
 * Last-resort visible failure.
 *
 * A blank page is the worst possible failure mode: it is indistinguishable from
 * a network problem, an ad blocker, or a broken build, and it leaves the user
 * with nothing to report. If the app cannot mount — an unsupported browser API,
 * a storage access a stricter browser refuses, a bad chunk — say so on the page
 * and name the error, so what comes back is a cause rather than "it does not
 * load".
 */
function renderFatal(err: unknown) {
  const root = document.getElementById("root");
  if (!root) return;
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  root.innerHTML = `
    <div style="font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                max-width:34rem;margin:16vh auto;padding:0 1.5rem;color:#14181E">
      <h1 style="font-size:1.05rem;margin:0 0 .5rem">Madar could not start in this browser</h1>
      <p style="margin:0 0 1rem;color:#76828B">
        Please try reloading. If it keeps happening, send us the message below.
      </p>
      <pre style="background:#EFF3F4;padding:.75rem;border-radius:8px;white-space:pre-wrap;
                  font-size:12px;color:#14181E;overflow-x:auto">${
                    detail.replace(/[<>&]/g, (c) =>
                      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c,
                    )
                  }</pre>
    </div>`;
}

/** Set once React has actually mounted. See the listeners at the bottom. */
let mounted = false;

function render() {
  mounted = true;
  createRoot(document.getElementById("root")!, {
    // React 19 root-level error hooks — forward what React catches to Sentry.
    onUncaughtError: Sentry.reactErrorHandler(),
    onCaughtError: Sentry.reactErrorHandler(),
  }).render(
    <StrictMode>
      <AppErrorBoundary>
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
      </AppErrorBoundary>
    </StrictMode>,
  );
}

// Bootstrap order:
//  • VITE_DEMO  → public playground: provision a throwaway org via the demo
//    backend, sign in, then render. Tree-shaken out of non-demo builds.
//  • VITE_MOCK (dev) → mock preview harness: seed a session + serve mock data.
//  • otherwise   → render normally.
const demoFlag = (import.meta.env as Record<string, string | undefined>).VITE_DEMO;
const mockFlag = (import.meta.env as Record<string, string | undefined>).VITE_MOCK;
/** Mount, and show WHY rather than nothing if mounting is impossible. */
function safeRender() {
  try {
    render();
  } catch (err) {
    console.error("Madar failed to mount", err);
    renderFatal(err);
  }
}

if (demoFlag === "1" || demoFlag === "true") {
  void import("@/data/api/demo/enable")
    .then(({ enableDemo }) => enableDemo().then(safeRender).catch(safeRender))
    .catch(renderFatal);
} else if (import.meta.env.DEV && (mockFlag === "1" || mockFlag === "true")) {
  void import("@/data/api/mock/enable")
    .then(({ enableMocks }) => enableMocks().then(safeRender))
    .catch(renderFatal);
} else {
  safeRender();
}

// A module-level failure upstream of `render()` — a store, i18n, a browser API
// a stricter engine refuses — throws before anything above runs, leaving a
// blank page with the reason only in the console. Surface it.
//
// Guarded on `mounted`, NOT on whether #root has children. Those are different
// questions, and conflating them was a bug: React sets up a root before it
// paints into it, so an ordinary async rejection arriving in that window looked
// like "the app never started" and replaced a perfectly healthy app with an
// error panel. A rejection observed on the live site — a view transition
// skipped because the tab was in the background — would have done exactly that.
//
// Rejections are excluded entirely. A rejected promise is a normal event in a
// running app; it is not evidence that boot failed, and treating it as fatal
// trades a working page for a scary one.
window.addEventListener("error", (e) => {
  if (!mounted) renderFatal(e.error ?? e.message);
});
