/* eslint-disable */
// @ts-nocheck
import type { ChannelToggles } from './channelToggles';

/**
 * `PUT /settings/combos`. `min_margin` is replaced (omitted or `null` = no
 * warning); `channels`, when present, replaces the org-wide toggles.
 */
export interface ComboSettingsWrite {
  channels?: null | ChannelToggles;
  /**
     * A fraction between "0" and "1", e.g. "0.55".
     * @nullable
     */
  min_margin?: string | null;
}
