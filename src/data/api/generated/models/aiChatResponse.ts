/* eslint-disable */
// @ts-nocheck
import type { AiChatResponseRowsItem } from './aiChatResponseRowsItem';
import type { ChartHint } from './chartHint';
import type { Column } from './column';

export interface AiChatResponse {
  /** Suggested visualization for the result. */
  chart: ChartHint;
  /** Column metadata for rendering the table/chart. */
  columns: Column[];
  /** Which model answered (e.g. "gemini-2.5-flash"). */
  provider: string;
  /** The report the assistant chose. */
  report_id: string;
  /** @minimum 0 */
  row_count: number;
  /** Result rows, each an object keyed by column key. */
  rows: AiChatResponseRowsItem[];
  /**
     * Optional one-sentence summary (only when `include_summary` was set and
     * the model produced one), in the requested locale.
     * @nullable
     */
  summary?: string | null;
  title: string;
  /** True when the result was capped. */
  truncated: boolean;
}
