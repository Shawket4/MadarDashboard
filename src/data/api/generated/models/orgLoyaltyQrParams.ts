/* eslint-disable */
// @ts-nocheck

export type OrgLoyaltyQrParams = {
/**
 * `true` (default) → branded A6 card PNG; `false` → plain receipt QR PNG.
 */
card?: boolean;
/**
 * Dynamic caption line beneath the tagline (A6 card only).
 */
caption?: string;
/**
 * Raster DPI for the A6 card (clamped 72–2400). Default 600.
 * @minimum 0
 */
dpi?: number;
/**
 * Print bleed in mm (A6 card only). Default 0.
 */
bleed_mm?: number;
/**
 * Draw crop marks (A6 card, only meaningful when `bleed_mm > 0`).
 */
crop_marks?: boolean;
/**
 * Return the A6 card as SVG (`data:image/svg+xml;base64,…`). Default false.
 */
svg?: boolean;
/**
 * Pixels per module for the plain receipt QR (1–40). Default 16.
 * @minimum 0
 */
module_px?: number;
/**
 * `true` → the code and nothing else: a square QR, black on a white quiet
 * zone, 70 mm a side at `dpi` (PNG, or SVG with `svg=true`). No card, no
 * frame, no purpose line or caption, no "Powered by", no Madar mark and no
 * shop name. Overrides `card`; `caption`, `bleed_mm`, `crop_marks` and
 * `module_px` are ignored. Default false.
 */
unbranded?: boolean;
/**
 * With `unbranded=true` only: put the shop's logo in the middle of the
 * code (default true). Only a shop on the branding tier with a printable
 * logo has one to put there; otherwise the code comes out plain, and the
 * response's `centre_logo` says so. `false` → always a plain QR, at a
 * lower error-correction level (bigger modules). The branded card ignores
 * it.
 */
centre_logo?: boolean;
slug?: string;
};
