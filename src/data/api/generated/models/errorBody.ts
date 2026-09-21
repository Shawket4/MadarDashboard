/* eslint-disable */
// @ts-nocheck
import type { ErrorBodyTill } from './errorBodyTill';

/**
 * Wire shape of every error JSON. Keep in lockstep with
 * `AppError::error_response` below.
 */
export interface ErrorBody {
  /**
     * Stable, machine-readable code for the error classes a client must branch
     * on programmatically (e.g. `ORG_SUSPENDED`). Omitted for the generic
     * cases where the status code alone is enough.
     * @nullable
     */
  code?: string | null;
  /** Human-readable error message. */
  error: string;
  /**
     * How long to wait before trying again, in seconds. Present on a
     * `PIN_THROTTLED` refusal, absent everywhere else, so the PIN pad can run
     * a countdown rather than inventing one.
     * @nullable
     */
  retry_after_seconds?: number | null;
  /**
     * The till a `TILL_OPEN_AT_OTHER_BRANCH` / `TILL_OPEN_ELSEWHERE` refusal
     * is about (`TillBrief`). Omitted everywhere else.
     * @nullable
     */
  till?: ErrorBodyTill;
}
