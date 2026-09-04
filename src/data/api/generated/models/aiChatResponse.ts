/* eslint-disable */
// @ts-nocheck
import type { AiChatKind } from './aiChatKind';

export type AiChatResponse = AiChatKind & ({
  /**
     * The conversation this turn belongs to. Present whenever the turn was
     * stored — send it back on the next message to continue.
     * @nullable
     */
  conversation_id?: string | null;
  /** Which model answered. */
  provider: string;
  /** The timezone every date in the answer is expressed in. */
  timezone: string;
});
