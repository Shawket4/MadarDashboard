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
  kind?: null | CashMovementKind;
  note: string;
}
