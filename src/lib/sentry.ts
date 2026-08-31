import * as Sentry from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";

// Injected by vite.config.ts (`define`). It is intentionally read through a
// `typeof` guard so test runners / tooling that skip the define still work.
declare const __SENTRY_RELEASE__: string | undefined;

const env = import.meta.env;

/** Parse a `0..1` sample rate from an env string, falling back when unset/bogus. */
function sampleRate(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(raw ?? "");
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

function release(): string | undefined {
  const injected = typeof __SENTRY_RELEASE__ === "undefined" ? undefined : __SENTRY_RELEASE__;
  return env.VITE_SENTRY_RELEASE?.trim() || injected || undefined;
}

/**
 * Wire up the self-hosted Sentry (sentry.madar-pos.cloud).
 *
 * No DSN (`VITE_SENTRY_DSN` unset or blank) → this is a no-op and the app runs
 * exactly as before: nothing is loaded, nothing is sent, no errors are thrown.
 * That is the default for local dev and for anyone building without the env var.
 *
 * Call once, before the first render, and after the router exists (the router
 * instance is what the tracing integration instruments).
 */
export function initSentry(router: AnyRouter): void {
  const dsn = env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    release: release(),
    environment: env.VITE_SENTRY_ENVIRONMENT?.trim() || env.MODE,

    // Never let the SDK attach IP addresses / cookies / request bodies on its
    // own — this dashboard is full of customer and payroll data.
    sendDefaultPii: false,

    integrations: [
      // Route-aware performance spans (pageload + navigation) driven by the
      // TanStack Router instance, so transactions carry the route pattern
      // (`/orders/$orderId`) instead of a URL with real ids baked in.
      Sentry.tanstackRouterBrowserTracingIntegration(router),

      // ── Session Replay (DOM recording) ────────────────────────────────────
      // PRIVACY: masking is ON and must stay on. The dashboard DOM routinely
      // renders customer names, phone numbers and delivery addresses (orders,
      // delivery, reservations) as well as staff salaries, payslips and
      // deductions (the staff/payroll module). `maskAllText` replaces every
      // text node with asterisks before it ever leaves the browser,
      // `maskAllInputs` does the same for form values, and `blockAllMedia`
      // keeps images/video (receipts, uploaded ID documents, menu photos) out
      // of the recording. Replays are for reproducing layout/interaction bugs,
      // not for reading the data on screen. Do NOT ship an unmasked config,
      // and do not add `unmask`/`unblock` selectors without a privacy review.
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],

    // Performance: sample lightly — this is a low-traffic internal dashboard on
    // a self-hosted Sentry with finite disk.
    tracesSampleRate: sampleRate(env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.1),

    // Replay: a small slice of ordinary sessions, but always keep the session
    // that produced an error (that is the one worth watching back).
    replaysSessionSampleRate: sampleRate(env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0.1),
    replaysOnErrorSampleRate: sampleRate(env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1.0),
  });
}
