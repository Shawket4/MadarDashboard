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
  /**
     * Ignored. The server decides whether the opening was an edit, from its
     * own expected carryover — a stale device computes this against a figure
     * that has since moved on. Kept so older tablets keep parsing.
     * @nullable
     */
  opening_cash_edited?: boolean | null;
  verification?: null | TillVerification;
}
