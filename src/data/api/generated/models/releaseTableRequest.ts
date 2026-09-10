/* eslint-disable */
// @ts-nocheck

export interface ReleaseTableRequest {
  branch_id: string;
  /**
     * The party ATE here and has paid: the table needs bussing before anyone
     * else sits, so it lands `dirty` rather than `free`. The same fork the
     * till makes locally when a parked order checks out versus is discarded --
     * a discard means nobody ever sat, and the table goes straight back to the
     * room. Without this the dashboard would show a table with dirty plates on
     * it as ready for the next party.
     */
  bus?: boolean;
}
