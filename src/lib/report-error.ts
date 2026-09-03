/**
 * One reporter for failures that never reach a global handler.
 *
 * `Sentry.ErrorBoundary` and the React 19 root hooks in `main.tsx` catch render
 * errors. That is a small fraction of what actually goes wrong here: every API
 * failure in this app is caught by axios, turned into a message by
 * `getErrorMessage`, and shown to the user in a toast. The request rejects, React
 * Query flips `isError`, the user sees "something went wrong" — and nothing is
 * reported anywhere. Those failures were entirely invisible.
 *
 * Everything routes through {@link reportHandledError} rather than a
 * `Sentry.captureException` at each call site, because a list of call sites
 * drifts the moment someone adds another. Two properties come from having one
 * funnel:
 *
 *  - **Deduplication.** A failure reaching two paths — the interceptor and a
 *    component's own `onError` — raises one issue, not two.
 *  - **A stable fingerprint.** Grouping is by component and operation, not by
 *    the message, so a hundred variations of "Network Error" stay one issue.
 *
 * Safe to call when Sentry is not configured: `captureException` on an
 * uninitialised SDK is a no-op, so nothing here assumes a client exists.
 */
import * as Sentry from "@sentry/react";
import { AxiosError } from "axios";
import { sanitizeText, stripUrlQuery } from "@/lib/sentry-scrub";

/** How long an identical failure stays deduplicated. */
const DEDUP_TTL_MS = 300_000;
/** Bound on distinct fingerprints held; overflow just means less deduplication. */
const DEDUP_MAX = 256;

const seen = new Map<string, number>();

/**
 * Clear the deduplication window.
 *
 * Called on sign-out so a failure from one session is not suppressed in the
 * next, and by tests, which otherwise share the module-level map and see one
 * test's report swallow another's.
 */
export function resetHandledErrorDedup(): void {
  seen.clear();
}

function shouldReport(key: string): boolean {
  const now = Date.now();
  for (const [k, at] of seen) if (now - at >= DEDUP_TTL_MS) seen.delete(k);
  if (seen.size >= DEDUP_MAX) seen.clear();
  if (seen.has(key)) return false;
  seen.set(key, now);
  return true;
}

export interface Failure {
  /** The subsystem: "api", "orders", "export". Never a value. */
  component: string;
  /** The specific step: "request", "csv_download". Never a value. */
  operation: string;
  /** Ids and counts only. Scrubbed on the way out regardless. */
  context?: Record<string, unknown>;
}

/**
 * Report a handled failure — one that was caught, logged, and shown to the user.
 */
export function reportHandledError(failure: Failure, error: unknown): void {
  const message = sanitizeText(
    error instanceof Error ? error.message : String(error ?? "unknown error"),
  );
  if (!shouldReport(`${failure.component}|${failure.operation}|${message}`)) return;

  Sentry.withScope((scope) => {
    scope.setTag("component", failure.component);
    scope.setTag("operation", failure.operation);
    // Grouping by component+operation, never by the message: a hundred
    // spellings of "Network Error" are one problem.
    scope.setFingerprint(["handled", failure.component, failure.operation]);
    for (const [k, v] of Object.entries(failure.context ?? {})) scope.setExtra(k, v);
    scope.setLevel("error");
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(`${failure.component}: ${failure.operation} failed — ${message}`);
    }
  });
}

/**
 * Should this API failure become an issue?
 *
 * - **5xx** — yes. The backend is broken.
 * - **A network failure with no response** — yes. The API is unreachable, DNS
 *   failed, CORS blocked the request, or the request timed out. Every one of
 *   those is a real fault and none produces a status code.
 * - **4xx** — no. Validation, 401, 403, 404, 409 are ordinary API traffic and
 *   reporting them drowns the issue stream. The backend reports the subset of
 *   4xx that its *own* data caused, which is the part a browser cannot judge.
 * - **A cancelled request** — no. Navigating away mid-request is not a failure.
 */
export function shouldReportApiError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  if (error.code === "ERR_CANCELED") return false;
  const status = error.response?.status;
  if (status === undefined) return true;
  return status >= 500;
}

/**
 * Report an API failure from the axios interceptor.
 *
 * The route and method are attached, and never the response body: a 5xx body
 * from this backend is an `ErrorBody`, but a 5xx from a proxy in front of it
 * could be anything, and a third party's payload is their users' data.
 */
export function reportApiError(error: unknown): void {
  if (!shouldReportApiError(error)) return;
  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;
  reportHandledError(
    {
      component: "api",
      // The status is part of the operation so a 500 and an unreachable
      // backend are separate issues — they have different causes and
      // different fixes.
      operation: status ? `http_${status}` : "unreachable",
      context: {
        method: axiosError.config?.method?.toUpperCase() ?? "GET",
        // Query stripped: this app puts customer identifiers in query params.
        url: stripUrlQuery(axiosError.config?.url ?? ""),
        status: status ?? null,
        code: axiosError.code ?? null,
      },
    },
    error,
  );
}
