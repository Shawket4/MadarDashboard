/* eslint-disable */
// @ts-nocheck

export interface CancelInput {
  /** @nullable */
  reason?: string | null;
  /** true (default): ingredients stay available. false: the food was made and is
   * wasted — the frozen plan is deducted from stock and logged as `waste`. */
  restore_inventory?: boolean;
}
