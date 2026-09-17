/* eslint-disable */
// @ts-nocheck

/**
 * One outreach campaign's return-on-nudge: did the member earn again within
 * 30 days of the message.
 */
export interface CampaignEffectivenessRow {
  /** `"winback"` or `"birthday"`. */
  campaign: string;
  /** `returned_within_30d / sent`. `0.0` when nothing was sent. */
  return_rate: number;
  returned_within_30d: number;
  sent: number;
}
