/* eslint-disable */
// @ts-nocheck

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
}
