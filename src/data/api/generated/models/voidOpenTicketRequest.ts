/* eslint-disable */
// @ts-nocheck
import type { VoidReason } from './voidReason';

/**
 * Why a bill is torn up. `reason` is typed; `note` is what actually happened,
 * required when the reason is `other`.
 *
 * Deserialised leniently, because a void queued offline by an older till
 * arrives here months later with the picker's LABEL (`"Order mistake"`, or
 * `"Order mistake — burnt"`) where the enum now is, and a queued op that fails
 * to parse dead-letters. Those spellings map exactly as migration
 * `20260912020000` mapped the stored rows; an unrecognised string is `other`
 * with the whole text as the note, so nothing the waiter wrote is lost.
 */
export interface VoidOpenTicketRequest {
  /** @nullable */
  note?: string | null;
  reason?: null | VoidReason;
}
