/* eslint-disable */
// @ts-nocheck

export type PublicMenuParams = {
channel: string;
/**
 * Read-only browse preview. When `true`, the menu is returned even if the
 * channel is closed right now, so customers can browse while a branch is
 * closed. This NEVER relaxes the channel-*enabled* check, and the
 * delivery-quote / order-intake endpoints stay gated on open-now — so a
 * preview can never become a real order against a closed channel.
 * @nullable
 */
preview?: boolean | null;
};
