/* eslint-disable */
// @ts-nocheck
import type { GoogleObjectDumpObject } from './googleObjectDumpObject';

/**
 * The card Google holds, plus the two counts that make it readable at a glance.
 */
export interface GoogleObjectDump {
  /**
     * Why there is no object, in Google's words.
     * @nullable
     */
  error?: string | null;
  /**
     * Branches this member's card should be pinned to, from our own side.
     * @minimum 0
     */
  expected_locations: number;
  /**
     * Google's object, untouched. `None` when the read itself failed.
     * @nullable
     */
  object?: GoogleObjectDumpObject;
  /**
     * Branches Google says are on it. A gap between the two is the answer.
     * @minimum 0
     */
  stored_locations: number;
}
