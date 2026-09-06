/* eslint-disable */
// @ts-nocheck

export interface CancelBookingRequest {
  /**
     * Message the guest (default true).
     * @nullable
     */
  notify_guest?: boolean | null;
  /** @nullable */
  reason?: string | null;
}
