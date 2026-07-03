/* eslint-disable */
// @ts-nocheck

export type CatalogSyncParams = {
/**
 * Branch whose resolved prices/availability to return
 */
branch_id: string;
/**
 * delivery_channel: in_mall | outside | umbrella | pickup — omit for branch-only resolution (in-store POS)
 */
channel?: string;
/**
 * Device's cached catalog_revision; == current ⇒ changed:false, no payload
 */
since?: number;
};
