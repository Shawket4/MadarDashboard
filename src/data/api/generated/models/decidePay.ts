/* eslint-disable */
// @ts-nocheck

export interface DecidePay {
  approve: boolean;
  /**
     * Why. Required to reject (400 `REASON_REQUIRED`, D8); optional to
     * approve.
     * @nullable
     */
  reason?: string | null;
}
