import type { GuestSavedLocation } from "@/data/api/generated/models/guestSavedLocation";
import type { PublicBranch } from "@/data/api/generated/models/publicBranch";

import type { LatLng } from "./components/delivery-map";
import { isFlatChannel, type Channel } from "./types";

/**
 * Whether this order needs the location step at all.
 *
 * Outside always does: the delivery pin prices the order. In-mall does only
 * where the branch's "Require GPS location" toggle (`in_mall_require_location`)
 * is on: the step exists to prove the customer is at the branch, so with the
 * toggle off there is nothing to ask and the customer goes straight to the
 * menu (shop, floor and unit are still required at checkout). Umbrella and
 * pickup never do. A branch that has not loaded yet counts as "on", the
 * server's default.
 */
export function locationStepRequired(
  channel: Channel | null | undefined,
  branch: Pick<PublicBranch, "in_mall_require_location"> | null | undefined,
): boolean {
  if (!channel || isFlatChannel(channel)) return false;
  if (channel === "outside") return true;
  return branch?.in_mall_require_location ?? true;
}

/**
 * The point a saved address may stand in for.
 *
 * Outside: the saved pin is where the order goes, so it is the point. In-mall:
 * the point is the DEVICE's location, proof of being at the branch now, and a
 * saved address (the coordinates of an earlier order) is not that proof. It
 * still fills shop, floor and unit; it never confirms the location.
 */
export function savedPointFor(channel: Channel, loc: GuestSavedLocation): LatLng | null {
  if (channel !== "outside") return null;
  if (loc.customer_lat == null || loc.customer_lng == null) return null;
  return { lat: loc.customer_lat, lng: loc.customer_lng };
}
