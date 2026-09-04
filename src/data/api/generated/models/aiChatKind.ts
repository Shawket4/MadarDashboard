/* eslint-disable */
// @ts-nocheck
import type { ResultBlock } from './resultBlock';

/**
 * How the turn ended. Every variant is a 200.
 */
export type AiChatKind = {
  kind: 'answer';
  results: ResultBlock[];
  text: string;
} | {
  kind: 'clarify';
  question: string;
} | {
  kind: 'incomplete';
  results: ResultBlock[];
  text: string;
};
