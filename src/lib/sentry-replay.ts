/**
 * Session Replay, in its own chunk: imported after the first paint by
 * `loadReplay()` (sentry.ts), never with the entry.
 */
import { replayIntegration } from "@sentry/react";

export function maskedReplay() {
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
  return replayIntegration({
    maskAllText: true,
    maskAllInputs: true,
    blockAllMedia: true,
    // Request/response bodies are never recorded. There is no allowlist of
    // URLs worth the risk on an app whose every endpoint returns customer
    // data, and a recorded body is not reachable by a key-based scrubber.
    networkDetailAllowUrls: [],
  });
}
