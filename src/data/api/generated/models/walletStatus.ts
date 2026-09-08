/* eslint-disable */
// @ts-nocheck
import type { WalletProvider } from './walletProvider';

export interface WalletStatus {
  /**
     * Apple's push channel, which is SEPARATE from pass signing.
     *
     * A pass can be issued perfectly and never change on anyone's phone,
     * because the two are configured independently — and this panel used to
     * report Apple as fine while every balance update went nowhere.
     */
  apns: WalletProvider;
  apple: WalletProvider;
  google: WalletProvider;
}
