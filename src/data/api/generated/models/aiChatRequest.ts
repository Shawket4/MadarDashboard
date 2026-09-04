/* eslint-disable */
// @ts-nocheck
import type { HistoryTurn } from './historyTurn';

export interface AiChatRequest {
  /**
     * Continue a stored conversation. When set, history is loaded from the
     * server and `history` below is ignored — this is the path that gives
     * resumable chats and unlimited, compacted context.
     *
     * Omit it to start a new conversation; the response says which one was
     * created.
     * @nullable
     */
  conversation_id?: string | null;
  /**
     * Recent prior turns, oldest first. The stateless fallback, kept for
     * clients that manage their own window and for one-off questions. Ignored
     * when `conversation_id` is set. The server caps it regardless.
     * @nullable
     */
  history?: HistoryTurn[] | null;
  /**
     * Answer language — "en" or "ar" (default "en"). Drives translated labels
     * and the reply language.
     * @nullable
     */
  locale?: string | null;
  /**
     * The merchant's plain-language question, e.g. "top 5 products last month"
     * or "أعلى ٥ منتجات الشهر الماضي".
     */
  question: string;
}
