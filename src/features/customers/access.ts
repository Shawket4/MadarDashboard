/**
 * Who may see and do what to a person — a customer who may also hold a loyalty
 * card under the same id. Two capability families meet here and neither
 * widens the other:
 *
 *  - `customers.*` opens the customer: identity, orders, edit, merge, erase;
 *  - `loyalty.*` opens the card: balance, ledger, adjust, forget (see
 *    `features/loyalty/shared/access.ts`).
 *
 * Someone holding only `loyalty.members.list` still gets the Members tab, read
 * from the loyalty endpoint, with exactly the columns it always had. Someone
 * holding only `customers.view` gets the customer and no loyalty action.
 */
import type { Authz } from "@/data/authz/use-authz";
import { loyaltyAccess, type LoyaltyAccess } from "@/features/loyalty/shared/access";
import { Cap } from "@/generated/capabilities";

export interface PeopleAccess extends LoyaltyAccess {
  canViewCustomers: boolean;
  canCreate: boolean;
  canEdit: boolean;
  /** Split from edit: a merge moves balances and retires a card. */
  canMerge: boolean;
  canErase: boolean;
  /** Where they live is its own PII capability: needed to dispatch, not to take an order. */
  canViewAddresses: boolean;
}

export function peopleAccess(authz: Authz): PeopleAccess {
  return {
    ...loyaltyAccess(authz),
    canViewCustomers: authz.can(Cap.customersView),
    canCreate: authz.can(Cap.customersCreate),
    canEdit: authz.can(Cap.customersEdit),
    canMerge: authz.can(Cap.customersMerge),
    canErase: authz.can(Cap.customersErase),
    canViewAddresses: authz.can(Cap.customersAddressesView),
  };
}

/** The endpoint a people list reads, or null when the person may not see it. */
export type PeopleSource = "customers" | "members";

/**
 * `membersOnly` is the Loyalty → Members tab: it needs `loyalty.members.list`
 * as it always did, and reads `/customers?member=true` when the person may see
 * customers, the loyalty members endpoint otherwise. The Customers page needs
 * `customers.view` and nothing else.
 */
export function peopleSource(access: PeopleAccess, membersOnly: boolean): PeopleSource | null {
  if (membersOnly) {
    if (!access.canListMembers) return null;
    return access.canViewCustomers ? "customers" : "members";
  }
  return access.canViewCustomers ? "customers" : null;
}

/**
 * Opening one person by id (from a list, an order, a ledger row): the customer
 * side, the card side, or both. Neither means there is nothing to open.
 */
export const canOpenPerson = (access: PeopleAccess): boolean => access.canViewCustomers || access.canViewMember;
