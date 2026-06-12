/* eslint-disable */
// @ts-nocheck

export type ListRunsHandlerParams = {
/**
 * Page size, clamped to [1, 100]. Default 20.
 */
limit?: number;
/**
 * Return runs started strictly before this instant (pagination cursor).
 */
before?: string;
};
