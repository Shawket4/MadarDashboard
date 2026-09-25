/* eslint-disable */
// @ts-nocheck

/**
 * The four sale channels' toggles, resolved: `pos` (the till), `qr` (the
 * table QR menu), `online` (the storefront, all four delivery sub-channels)
 * and `delivery` (aggregator apps; stored and returned, honoured by the
 * future menu push). Every channel is on until the owner switches it off.
 */
export interface ChannelToggles {
  delivery?: boolean;
  online?: boolean;
  pos?: boolean;
  qr?: boolean;
}
