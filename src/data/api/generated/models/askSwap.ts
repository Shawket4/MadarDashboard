/* eslint-disable */
// @ts-nocheck

export interface AskSwap {
  /** The date of MY shift I give away. */
  my_date: string;
  /** MY shift (a block I'm rostered on that date). */
  my_shift_id: string;
  /** The date of the colleague's shift I take. */
  peer_date: string;
  peer_id: string;
  /** The COLLEAGUE's shift. */
  peer_shift_id: string;
}
