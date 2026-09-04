/* eslint-disable */
// @ts-nocheck
import type { AiChatResponse } from './aiChatResponse';
import type { ResultBlock } from './resultBlock';

/**
 * One frame of a streamed turn.
 *
 * Every variant except `Answer`/`Clarify`/`Incomplete` is progress and may be
 * ignored. Deliberately coarse: emitting the model's partial tokens would mean
 * streaming text that has not been through pseudonym restoration yet, and a
 * half-restored name is exactly what must never render.
 */
export type ChatFrame = {
  /** @nullable */
  conversation_id?: string | null;
  event: 'started';
} | {
  event: 'thinking';
  /** @minimum 0 */
  step: number;
} | {
  dataset: string;
  event: 'querying';
  /** @nullable */
  title?: string | null;
} | {
  block: ResultBlock;
  event: 'result';
} | {
  event: 'answer';
  response: AiChatResponse;
} | {
  event: 'error';
  message: string;
};
