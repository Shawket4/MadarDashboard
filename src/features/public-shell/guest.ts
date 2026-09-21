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

/**
 * "Order now" opens from a card's token, and the token does not say whose
 * phone it is — only its last four digits (`•••• 4567`). The device tokens
 * here are keyed by phone, so the ones worth trying are: the phone this device
 * last used with this shop, then any proved phone ending in those digits.
 *
 * Bounded, because every try is a request against a rate-limited endpoint,
 * and the server is the only judge: a token for the wrong phone simply gets
 * the masked answer again.
 */
export const orderNowCandidates = (orgId: string, phoneHint: string, limit = 3): { phone: string; token: string }[] => {
  const tail = phoneHint.replace(/\D/g, "").slice(-4);
  const phones: string[] = [];
  const recent = getGuestPhone(orgId);
  if (recent) phones.push(recent);
  try {
    if (tail.length === 4) {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key?.startsWith(DEVICE_KEY_PREFIX)) continue;
        const phone = key.slice(DEVICE_KEY_PREFIX.length);
        if (phone.endsWith(tail) && !phones.includes(phone)) phones.push(phone);
      }
    }
  } catch {
    /* storage unavailable — the customer verifies instead */
  }
  const out: { phone: string; token: string }[] = [];
  for (const phone of phones) {
    const token = getDeviceToken(phone);
    if (token) out.push({ phone, token });
    if (out.length >= limit) break;
  }
  return out;
};
