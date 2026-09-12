/* eslint-disable */
// @ts-nocheck
import type { PublicTableLine } from './publicTableLine';

export interface PublicTableRound {
  fired_at: string;
  items: PublicTableLine[];
  number: number;
}
