/* eslint-disable */
// @ts-nocheck

export type ListBookingsParams = {
branch_id: string;
/**
 * Service date (`YYYY-MM-DD`, branch-local, 05:00→05:00). Defaults to today.
 */
date?: string;
/**
 * Explicit window (overrides `date`).
 */
from?: string;
to?: string;
/**
 * Only `confirmed` / `seated`.
 */
active?: boolean;
status?: string;
};
