/**
 * Who may do what on the loyalty admin — the same capabilities the backend
 * checks, read from the person's effective permissions (`useAuthz`), so nobody
 * is shown a button whose only outcome is a 403:
 *
 *  - settings / reward catalogue writes: `loyalty.use`;
 *  - listing members and the loyalty report: `loyalty.members.list`;
 *  - opening one member (from an order, from a customer): `loyalty.read`, or
 *    the members list;
 *  - manual points adjustment: `loyalty.points.adjust`;
 *  - deleting a member: `loyalty.members.delete`;
 *  - Google Wallet diagnostics: platform (super admin) only.
 */
import type { Authz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";

export interface LoyaltyAccess {
  canEditProgram: boolean;
  canListMembers: boolean;
  canViewMember: boolean;
  canAdjust: boolean;
  canForget: boolean;
  canInspectWallet: boolean;
}

export function loyaltyAccess(authz: Authz): LoyaltyAccess {
  return {
    canEditProgram: authz.can(Cap.loyaltyUse),
    canListMembers: authz.can(Cap.loyaltyMembersList),
    canViewMember: authz.canAny(Cap.loyaltyMembersList, Cap.loyaltyRead),
    canAdjust: authz.can(Cap.loyaltyPointsAdjust),
    canForget: authz.can(Cap.loyaltyMembersDelete),
    canInspectWallet: authz.platform,
  };
}
