/**
 * Who may do what in the Rewards module: the capabilities the server checks
 * (REWARDS_DASHBOARD_DESIGN.md §8), read from the person's effective
 * permissions, so nobody is offered a click that ends in a 403.
 *
 *  - overview, members table, stats, broadcasts log: `loyalty.members.list`;
 *  - one member, the programme, tracks and the card design (read): `loyalty.read`;
 *  - tracks and the card design (write, publish): `loyalty.card.design`;
 *  - sending or cancelling a message: `loyalty.broadcast`;
 *  - the programme form, adjust, leave: as Settings › Loyalty had them (`loyaltyAccess`).
 */
import type { Authz } from "@/data/authz/use-authz";
import { loyaltyAccess, type LoyaltyAccess } from "@/features/loyalty/shared/access";
import { Cap } from "@/generated/capabilities";

export interface RewardsAccess extends LoyaltyAccess {
  canDesign: boolean;
  canBroadcast: boolean;
}

export function rewardsAccess(authz: Authz): RewardsAccess {
  return {
    ...loyaltyAccess(authz),
    canDesign: authz.can(Cap.loyaltyCardDesign),
    canBroadcast: authz.can(Cap.loyaltyBroadcast),
  };
}
