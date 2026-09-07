/* eslint-disable */
// @ts-nocheck

/**
 * One reward applied to one line of the cart.
 */
export interface LoyaltyRedemptionInput {
  /**
     * Index into `items`. An index rather than an id because a cart may hold
     * the same menu item on two lines with different modifiers, and only the
     * position tells them apart.
     * @minimum 0
     */
  item_index: number;
  /**
     * How many of that line's units the reward covers. Defaults to one.
     * @nullable
     */
  units?: number | null;
}
