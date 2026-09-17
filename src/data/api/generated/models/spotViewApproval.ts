/* eslint-disable */
// @ts-nocheck

/**
 * A one-time unlock minted on the till: someone holding
 * `till.cash_spot_check` typed their PIN.
 */
export interface SpotViewApproval {
  approver_id: string;
  /** Always `till.cash_spot_check`. */
  capability: string;
  id: string;
}
