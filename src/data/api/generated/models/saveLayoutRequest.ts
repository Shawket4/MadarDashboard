/* eslint-disable */
// @ts-nocheck
import type { TablePosition } from './tablePosition';

export interface SaveLayoutRequest {
  branch_id: string;
  tables: TablePosition[];
}
