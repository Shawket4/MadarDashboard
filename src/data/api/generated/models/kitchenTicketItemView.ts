/* eslint-disable */
// @ts-nocheck

/**
 * A KDS line as displayed/bumped.
 */
export interface KitchenTicketItemView {
  bumped: boolean;
  id: string;
  line: unknown;
  qty: number;
  /** @nullable */
  station_id?: string | null;
  /** @nullable */
  station_name?: string | null;
}
