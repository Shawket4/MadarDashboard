/**
 * Guest identity for the PUBLIC surfaces: the phone a customer is known by, and
 * the device token that lets them skip the WhatsApp OTP next time.
 *
 * Shared by ordering and by table bookings, which is why it lives here and not
 * in either feature — the two are separately built bundles and neither may
 * import the other. The storage keys keep their original `madar_delivery_*` /
 * `madar_guest_*` names so nobody is logged out by the move.
 */
import { canonicalPhone } from "@/lib/phone";

/**
 * The storage key for a phone: its canonical form (`src/lib/phone.ts`). Tokens
 * were always keyed by `20…` digits, so every token stored before the shared
 * rule is still found. Something that is not a phone keys nothing real.
 */
const phoneKey = (phone: string): string => canonicalPhone(phone) ?? "";

const DEVICE_KEY_PREFIX = "madar_delivery_device:";

/** Read the stored device token for a phone (skips OTP when present). */
export const getDeviceToken = (phone: string): string | null => {
  try {
    return localStorage.getItem(DEVICE_KEY_PREFIX + phoneKey(phone));
  } catch {
    return null;
  }
};

/** Persist a verified device token keyed by normalized phone. */
export const setDeviceToken = (phone: string, token: string): void => {
  try {
    localStorage.setItem(DEVICE_KEY_PREFIX + phoneKey(phone), token);
  } catch {
    /* storage unavailable — fall back to per-checkout OTP */
  }
};

/**
 * Forget a device token the server no longer honours — a loyalty sign-up that
 * came back `verify_required` for a phone we thought was proved. Left in
 * place, `getDeviceToken` would keep skipping the OTP and the page would loop.
 */
export const clearDeviceToken = (phone: string): void => {
  try {
    localStorage.removeItem(DEVICE_KEY_PREFIX + phoneKey(phone));
  } catch {
    /* storage unavailable — nothing was stored to forget */
  }
};

const GUEST_PHONE_KEY_PREFIX = "madar_guest_phone:";

/**
 * Recall the last phone used for this org (pre-fills the phone step), in
 * canonical form. Canonicalised ON READ: older visits stored whatever was typed
 * (`0100 123 4567`) or the `20…` digits, and both must still be recognised.
 * A stored value that is not a phone reads as nothing.
 */
export const getGuestPhone = (orgId: string): string | null => {
  try {
    return canonicalPhone(localStorage.getItem(GUEST_PHONE_KEY_PREFIX + orgId));
  } catch {
    return null;
  }
};

/** Persist the phone entered for this org so it pre-fills on the next visit. */
export const setGuestPhone = (orgId: string, phone: string): void => {
  try {
    localStorage.setItem(GUEST_PHONE_KEY_PREFIX + orgId, canonicalPhone(phone) ?? phone);
  } catch {
    /* storage unavailable */
  }
};
