/* eslint-disable */
// @ts-nocheck
import type { QuerySpec } from './querySpec';

/**
 * One earlier exchange, in compact form.
 *
 * Result *tables* are never replayed — they are large, and the model does not
 * need last week's rows to answer this week's question. What it does need is
 * the **query** that answered before, which is why `spec` is here: a follow-up
 * like "and last month?" or "same thing for Marina" is that spec with one
 * field changed. Prose alone forces the model to re-derive the whole query
 * from its own summary, which is exactly where a follow-up silently drifts
 * into answering a different question.
 *
 * Clients get the spec back on every result block (`results[].spec`) and
 * should echo it here.
 */
export interface HistoryTurn {
  /**
     * What the assistant replied. Optional so a client can send a partial log.
     * @nullable
     */
  answer?: string | null;
  question: string;
  spec?: null | QuerySpec;
}
