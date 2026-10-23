/* eslint-disable */
// @ts-nocheck
import type { SessionCursor } from './sessionCursor';
import type { SessionRow } from './sessionRow';

export interface SessionPage {
  next?: null | SessionCursor;
  sessions: SessionRow[];
}
