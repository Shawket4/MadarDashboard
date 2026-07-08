/* eslint-disable */
// @ts-nocheck

/**
 * One earlier exchange in the same conversation, in COMPACT form: the question
 * and which report answered it. This is all the model needs to resolve a
 * follow-up ("and last month?", "what about Sidi Henish?") — never the full
 * result tables — so per-message cost stays constant with the sliding window.
 */
export interface HistoryTurn {
  /** The earlier user question. */
  question: string;
  /**
     * The report id that answered it, if known.
     * @nullable
     */
  report_id?: string | null;
}
