/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { StockRow } from './stockRow';

export interface BranchStockReport {
  branch_id: string;
  branch_name: string;
  items: StockRow[];
}
