import type { QueryClient } from "@tanstack/react-query";

import {
  getGetLoyaltySettingsQueryOptions,
  getGetCustomerQueryOptions,
  getGetLoyaltyMemberQueryOptions,
  getListBranchesQueryOptions,
  getListCustomerAddressesQueryOptions,
  getListCustomerBookingsQueryOptions,
  getListCustomersQueryOptions,
} from "@/data/api/generated/api";
import type { ListCustomersParams } from "@/data/api/generated/models";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { cachedAuthz } from "@/features/reports/queries";
import { Cap } from "@/generated/capabilities";
import type { PeopleAccess } from "./access";
import { customersSearch } from "./search";
import { PAGE_SIZE, isSource, type CustomerSource } from "./util";

/** A customer's bookings, a page at a time (the sheet's Bookings section). */
export const CUSTOMER_BOOKINGS_PAGE = 10;

/**
 * The customers list request, built in ONE place: the list reads it and the
 * sidebar prefetch warms it, so both ask for the same cache key.
 */
export function customersListParams(
  f: { q: string; member: boolean | undefined; from: CustomerSource | null },
  limit: number,
): ListCustomersParams {
  return { q: f.q.trim() || undefined, member: f.member, source: f.from ?? undefined, limit, offset: 0 };
}

/**
 * Hover/focus on something that opens a person: every query the customer
 * sheet fires on open, under the same capability gates. `isMember` unknown
 * (a name link) leaves the card to the sheet, which asks once the customer says.
 */
export function prefetchCustomer(
  qc: QueryClient,
  id: string,
  { access, orgId, branchId = null, isMember }: { access: PeopleAccess; orgId: string | null; branchId?: string | null; isMember?: boolean },
): void {
  if (access.canViewCustomers) {
    void qc.prefetchQuery(getGetCustomerQueryOptions(id));
    if (access.canViewAddresses) void qc.prefetchQuery(getListCustomerAddressesQueryOptions(id));
    void qc.prefetchQuery(getListCustomerBookingsQueryOptions(id, { limit: CUSTOMER_BOOKINGS_PAGE, offset: 0 }));
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  }
  if (access.canViewMember && (access.canViewCustomers ? isMember === true : true)) {
    void qc.prefetchQuery(getGetLoyaltyMemberQueryOptions(id, branchId ? { branch_id: branchId } : undefined));
  }
}

/**
 * Sidebar/palette intent: the list as the page opens it (remembered filters,
 * first window). The nav entry needs `customers.view`, so it reads `/customers`.
 * The loyalty program (points or stamps, for the balance column) only for who
 * may read it, as the list asks: the page's list is org-wide, so `{}`.
 */
export function prefetchCustomers(qc: QueryClient, { branchId, search }: PrefetchCtx): void {
  const f = customersSearch.entryValues(branchId, search);
  const from = isSource(f.from) ? f.from : null;
  void qc.prefetchQuery(getListCustomersQueryOptions(customersListParams({ q: f.q, member: f.members || undefined, from }, PAGE_SIZE)));
  if (cachedAuthz(qc).can(Cap.loyaltyRead)) void qc.prefetchQuery(getGetLoyaltySettingsQueryOptions({}));
}
