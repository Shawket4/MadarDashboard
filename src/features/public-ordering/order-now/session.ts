/**
 * "Order now" (CUSTOMERS_UNIFICATION_DESIGN.md §4): the ordering page, opened
 * from a loyalty card, already knowing who is ordering.
 *
 * The card's token says WHO; a device token for that customer's own phone is
 * what lets this device act as them. A session exists only once the server has
 * answered with the full context — i.e. once both are in hand.
 */
import { AxiosError } from "axios";

import type { DeliveryOrderInput, OrderNowAddress, OrderNowBranch } from "@/data/api/generated/models";

export interface OrderNowCustomer {
  id: string;
  name: string;
  /** Canonical. */
  phone: string;
}

export interface OrderNowSession {
  memberToken: string;
  orgId: string;
  customer: OrderNowCustomer;
  /** Proves the customer's CURRENT phone on this device. */
  deviceToken: string;
  /** Re-checked by the server at open time; `stale` means "ask again", never "drop". */
  lastBranch: OrderNowBranch | null;
  addresses: OrderNowAddress[];
  paymentHint: "cash" | "card" | null;
  /** Replace/combine went through: the same customer, now known by this phone. */
  onIdentityReplaced: (next: { phone: string; deviceToken: string; name: string }) => void;
}

/** The identity half of a delivery order — everything else is the cart and the address. */
export type OrderIdentityFields = Pick<
  DeliveryOrderInput,
  "device_token" | "member_token" | "identity_change" | "save_address" | "contact_device_token"
>;

/** How placing the order went, for whoever has to decide what to do about it. */
export type PlaceOutcome = { ok: true } | { ok: false; status?: number; code?: string };

export interface IdentityRefusal {
  status?: number;
  code?: string;
  canCombine: boolean;
}

/** The server's identity refusals carry a stable `code`, and one of them a `can_combine`. */
export function identityRefusal(err: unknown): IdentityRefusal {
  if (!(err instanceof AxiosError)) return { canCombine: false };
  const data = err.response?.data as { code?: unknown; can_combine?: unknown } | undefined;
  return {
    status: err.response?.status,
    code: typeof data?.code === "string" ? data.code : undefined,
    canCombine: data?.can_combine === true,
  };
}

/** The one 401 that is a question, not a sign-out: prove the number this order is going to. */
export const CONTACT_VERIFICATION_REQUIRED = "CONTACT_VERIFICATION_REQUIRED";

/**
 * The server's rate limit on a card's token (or on this address): a 429 that is
 * NOT the named, month-long `IDENTITY_REPLACE_LIMIT`. It clears by itself.
 */
export function isTooManyAttempts(err: unknown): boolean {
  const { status, code } = identityRefusal(err);
  return status === 429 && code !== "IDENTITY_REPLACE_LIMIT";
}

/**
 * The saved address to open with: the most recently used one for the channel
 * they last ordered on. `stale` → the location step asks again, with a reason.
 */
export function addressForChannel(addresses: OrderNowAddress[], channel: string | null | undefined): OrderNowAddress | null {
  if (!channel) return null;
  return addresses.find((a) => a.channel === channel) ?? null;
}
