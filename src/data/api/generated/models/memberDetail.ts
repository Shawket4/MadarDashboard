/* eslint-disable */
// @ts-nocheck
import type { LedgerEntry } from './ledgerEntry';
import type { MemberView } from './memberView';

export interface MemberDetail {
  ledger: LedgerEntry[];
  member: MemberView;
}
