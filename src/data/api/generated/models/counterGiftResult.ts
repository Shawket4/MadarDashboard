/* eslint-disable */
// @ts-nocheck
import type { BirthdayGiftView } from './birthdayGiftView';
import type { MemberView } from './memberView';

export interface CounterGiftResult {
  /** True when this key had already claimed it: nothing new was written. */
  already: boolean;
  /** The gift, now `claimed`. */
  birthday_gift: BirthdayGiftView;
  member: MemberView;
}
