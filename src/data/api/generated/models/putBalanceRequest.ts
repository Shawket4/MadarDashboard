/* eslint-disable */
// @ts-nocheck

export interface PutBalanceRequest {
  /** @nullable */
  carried_over_days?: number | null;
  employee_id: string;
  entitled_days: number;
  leave_type_id: string;
  year: number;
}
