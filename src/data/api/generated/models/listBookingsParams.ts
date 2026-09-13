/* eslint-disable */
// @ts-nocheck

export type ListBookingsParams = {
branch_id: string;
/**
 * Calendar date (`YYYY-MM-DD`, branch-local, midnight→midnight). Defaults to today.
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
