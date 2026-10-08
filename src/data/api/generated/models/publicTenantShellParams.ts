/* eslint-disable */
// @ts-nocheck

export type PublicTenantShellParams = {
/**
 * The shop's host, e.g. `rue.madar-pos.cloud`. nginx sends it as the
 * `X-Shell-Host` header; the query parameter is for tests and probes.
 */
host?: string;
/**
 * The page's path and query, e.g. `/order/menu?branch=…`. nginx sends it
 * as the `X-Shell-Path` header.
 */
path?: string;
};
