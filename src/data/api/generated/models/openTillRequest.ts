/* eslint-disable */
// @ts-nocheck
import type { TillVerification } from './tillVerification';

export interface OpenTillRequest {
  /**
     * Else the `X-Madar-Device` header.
     * @nullable
     */
  device_id?: string | null;
  /** @nullable */
  edit_reason?: string | null;
  /** @nullable */
  id?: string | null;
  /** @nullable */
  opened_at?: string | null;
  opening_cash: number;
  /** @nullable */
  opening_cash_edited?: boolean | null;
  verification?: null | TillVerification;
}
