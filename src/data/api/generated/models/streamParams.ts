/* eslint-disable */
// @ts-nocheck

export type StreamParams = {
branch_id: string;
/**
 * Comma-separated topics: `delivery,tickets,kitchen,orders`. Omit to receive
 * every topic the caller is permitted to read.
 * @nullable
 */
topics?: string | null;
};
