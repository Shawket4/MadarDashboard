/* eslint-disable */
// @ts-nocheck
import type { PurchaseOrder } from './purchaseOrder';
import type { PurchaseOrderLine } from './purchaseOrderLine';

export type PurchaseOrderFull = PurchaseOrder & {
  lines: PurchaseOrderLine[];
};
