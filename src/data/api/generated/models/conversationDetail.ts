/* eslint-disable */
// @ts-nocheck
import type { ConversationSummary } from './conversationSummary';
import type { StoredTurn } from './storedTurn';

/**
 * A conversation with its turns.
 */
export type ConversationDetail = ConversationSummary & ({
  /**
     * The running summary of everything before the verbatim window. Returned
     * so the UI can show what was condensed instead of a silent gap.
     * @nullable
     */
  condensed?: string | null;
  turns: StoredTurn[];
});
