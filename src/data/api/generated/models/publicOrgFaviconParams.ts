/* eslint-disable */
// @ts-nocheck

export type PublicOrgFaviconParams = {
org_id?: string;
slug?: string;
/**
 * Rounded up to 32, 180 or 512. Defaults to 180 — big enough for a home
 * screen, and a browser downsamples for the tab perfectly well.
 * @minimum 0
 */
size?: number;
};
