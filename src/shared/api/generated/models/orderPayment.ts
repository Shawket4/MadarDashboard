/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface OrderPayment {
  amount: number;
  id: string;
  method: string;
  order_id: string;
  /** @nullable */
  reference?: string | null;
}
