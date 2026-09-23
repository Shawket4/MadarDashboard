/* eslint-disable */
// @ts-nocheck
import type { OfflineStamp } from './offlineStamp';

export interface PunchFor {
  employee_id: string;
  offline?: null | OfflineStamp;
  /** Required (CL-13): a dead phone, a forgotten one. */
  reason: string;
}
