/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface PaymentSplitInput {
  amount: number;
  method: string;
  /** @nullable */
  reference?: string | null;
}
