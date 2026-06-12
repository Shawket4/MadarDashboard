/* eslint-disable */
// @ts-nocheck

/**
 * Wire shape of every error JSON. Keep in lockstep with
 * `AppError::error_response` below.
 */
export interface ErrorBody {
  /** Human-readable error message. */
  error: string;
}
