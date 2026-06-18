/* eslint-disable */
// @ts-nocheck

export type TableQrParams = {
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
};
