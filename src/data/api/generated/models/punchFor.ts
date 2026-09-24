/* eslint-disable */
// @ts-nocheck
import type { OfflineStamp } from './offlineStamp';

export interface PunchFor {
  employee_id: string;
  offline?: null | OfflineStamp;
  /**
     * Required (CL-13): a dead phone, a forgotten one. Missing reads as
     * blank, so the answer is "A reason is required." (Mac E2E BC-4).
     */
  reason?: string;
}
