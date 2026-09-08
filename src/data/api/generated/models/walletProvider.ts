/* eslint-disable */
// @ts-nocheck

/**
 * What a wallet needs before it will offer a button, and whether it has it.
 */
export interface WalletProvider {
  /** Everything present. False means the button is not offered at all. */
  configured: boolean;
  /** @nullable */
  detail?: string | null;
  /** The settings still missing, by name. Empty when `configured`. */
  missing: string[];
  /**
     * Google only: what Google itself said when asked. `None` for Apple, which
     * signs locally and has nobody to ask.
     * @nullable
     */
  reachable?: boolean | null;
}
