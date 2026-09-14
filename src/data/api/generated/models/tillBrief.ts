/* eslint-disable */
// @ts-nocheck
import type { TillStatus } from './tillStatus';
import type { TillVerification } from './tillVerification';

export interface TillBrief {
  branch_id: string;
  /** @nullable */
  device_code?: string | null;
  /** @nullable */
  device_id?: string | null;
  /** @nullable */
  device_label?: string | null;
  id: string;
  opened_at: string;
  opened_while_another_open: boolean;
  status: TillStatus;
  teller_id: string;
  teller_name: string;
  verification: TillVerification;
}
