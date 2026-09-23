/* eslint-disable */
// @ts-nocheck
import type { CashMovementKind } from './cashMovementKind';

export interface CashMovementRequest {
  amount: number;
  /** @nullable */
  client_ref?: string | null;
  /** @nullable */
  corrects_id?: string | null;
  /** @nullable */
  created_at?: string | null;
  /** @nullable */
  device_id?: string | null;
  /**
     * A pay-out handed to an employee for shop purchases: logged in Dawam as
     * their expense advance, never deducted (AV-8).
     * @nullable
     */
  expense_advance_to?: string | null;
  kind?: null | CashMovementKind;
  note: string;
}
