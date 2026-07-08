/* eslint-disable */
// @ts-nocheck
import type { HistoryTurn } from './historyTurn';

export interface AiChatRequest {
  /**
     * Recent prior turns in this conversation (oldest → newest), so follow-ups
     * like "and last month?" resolve. Send only the last few; the server caps
     * the window regardless.
     * @nullable
     */
  history?: HistoryTurn[] | null;
  /**
     * When true, also return a one-sentence natural-language summary of the
     * result (a second, small model call, answered in `locale`). Default false.
     */
  include_summary?: boolean;
  /**
     * Answer language — "en" or "ar" (default "en"). Drives translated labels
     * and the summary language. Usually the dashboard's active language.
     * @nullable
     */
  locale?: string | null;
  /**
     * The merchant's plain-language question, e.g. "top 5 products last month"
     * or "أعلى ٥ منتجات الشهر الماضي".
     */
  question: string;
}
