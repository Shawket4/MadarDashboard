/* eslint-disable */
// @ts-nocheck

export type BranchMenuEngineeringParams = {
from?: string;
to?: string;
limit?: number;
/**
 * `snapshot` (default) — COGS from sale-time order snapshots.
 * `current` — COGS from today's recipe rollups.
 */
cost_basis?: string;
};
