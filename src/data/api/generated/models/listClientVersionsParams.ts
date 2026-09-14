/* eslint-disable */
// @ts-nocheck

export type ListClientVersionsParams = {
/**
 * Only clients that took a legacy path within the window (default `true`).
 */
legacy_only?: boolean;
/**
 * Look-back window in days, 1..=365 (default 14 — the G-old gate).
 */
days?: number;
/**
 * Narrow to one branch.
 */
branch_id?: string;
};
