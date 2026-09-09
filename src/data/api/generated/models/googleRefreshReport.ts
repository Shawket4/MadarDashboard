/* eslint-disable */
// @ts-nocheck
import type { GoogleRefreshReportClass } from './googleRefreshReportClass';
import type { GoogleRefreshReportObject } from './googleRefreshReportObject';
import type { WalletStep } from './walletStep';

/**
 * A provisioning run, in full.
 */
export interface GoogleRefreshReport {
  /**
     * The class as Google holds it now.
     * @nullable
     */
  class?: GoogleRefreshReportClass;
  /**
     * Branches Google kept on the shop's class.
     * @minimum 0
     */
  class_locations: number;
  /**
     * The first thing that went wrong, if anything did.
     * @nullable
     */
  error?: string | null;
  /**
     * The object as Google holds it now.
     * @nullable
     */
  object?: GoogleRefreshReportObject;
  /**
     * Branches Google kept on this member's object.
     * @minimum 0
     */
  object_locations: number;
  /**
     * Branches this member's card was sent, from our side.
     * @minimum 0
     */
  sent_locations: number;
  /** Every request and Google's answer, in order. */
  steps: WalletStep[];
}
