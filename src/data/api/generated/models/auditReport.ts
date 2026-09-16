/* eslint-disable */
// @ts-nocheck
import type { AuditBreakdownEntry } from './auditBreakdownEntry';

export interface AuditReport {
  by_issuer: AuditBreakdownEntry[];
  by_reason: AuditBreakdownEntry[];
  /** @nullable */
  from?: string | null;
  /** @nullable */
  to?: string | null;
  total_amount_minor: number;
  total_count: number;
}
