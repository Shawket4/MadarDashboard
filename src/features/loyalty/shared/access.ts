/**
 * Who may do what on the loyalty admin — mirrored from the backend's guards.
 *
 * The server is the guard (`check_permission` plus a role check on the three
 * actions that sit above the till); this is so nobody is shown a button whose
 * only outcome is a 403. Kept in one pure function so the mirror can be tested
 * against the handlers it copies:
 *
 *  - settings / reward catalogue writes: `loyalty:update` — seeded for
 *    org_admin and branch_manager (and a teller, who never reaches this page);
 *  - listing members: org_admin, super_admin, branch_manager (`list_members`);
 *  - manual adjustment and forgetting a member: org_admin, super_admin only
 *    (`handlers::adjust`, `handlers::delete_member`);
 *  - Google Wallet diagnostics: super_admin only.
 */
export interface LoyaltyAccess {
  canEditProgram: boolean;
  canListMembers: boolean;
  canAdjust: boolean;
  canForget: boolean;
  canInspectWallet: boolean;
}

export function loyaltyAccess(role: string | null | undefined): LoyaltyAccess {
  const admin = role === "org_admin" || role === "super_admin";
  const manager = admin || role === "branch_manager";
  return {
    canEditProgram: manager,
    canListMembers: manager,
    canAdjust: admin,
    canForget: admin,
    canInspectWallet: role === "super_admin",
  };
}
