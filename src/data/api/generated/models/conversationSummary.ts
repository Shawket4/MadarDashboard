/* eslint-disable */
// @ts-nocheck

/**
 * A conversation without its turns, for the list view.
 */
export interface ConversationSummary {
  /**
     * True once older turns have been folded into a summary — surfaced so a
     * client can say "earlier messages condensed" rather than appearing to
     * have lost them.
     */
  compacted: boolean;
  created_at: string;
  id: string;
  /** @nullable */
  last_turn_at?: string | null;
  title: string;
  turn_count: number;
}
