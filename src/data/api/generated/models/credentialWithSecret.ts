/* eslint-disable */
// @ts-nocheck
import type { CredentialSummary } from './credentialSummary';

/**
 * Returned ONLY by create and rotate. The secret is bcrypt-hashed on the way
 * in and is not recoverable afterwards, so the dashboard must show it once and
 * tell the operator to copy it.
 */
export type CredentialWithSecret = CredentialSummary & {
  secret: string;
};
