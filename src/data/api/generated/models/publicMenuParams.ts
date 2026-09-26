/* eslint-disable */
// @ts-nocheck

export type PublicMenuParams = {
/**
 * A delivery channel, or `dine_in` — the dine-in menu (branch prices, no
 * channel discount), accepted ONLY with `preview=true`: the read-only
 * menu of a shop that takes no online orders. Nothing can be ordered
 * against it; quote and intake know no such channel.
 */
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
