/* eslint-disable */
// @ts-nocheck

export interface PutBalanceRequest {
  /** @nullable */
  carried_over_days?: number | null;
  entitled_days: number;
  leave_type_id: string;
  user_id: string;
  year: number;
}
