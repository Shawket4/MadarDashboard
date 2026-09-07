/**
 * Guest identity for the PUBLIC surfaces: the phone a customer is known by, and
 * the device token that lets them skip the WhatsApp OTP next time.
 *
 * Shared by ordering and by table bookings, which is why it lives here and not
 * in either feature — the two are separately built bundles and neither may
 * import the other. The storage keys keep their original `madar_delivery_*` /
 * `madar_guest_*` names so nobody is logged out by the move.
 */
/**
 * Canonicalise an Egyptian phone to bare `20…` MSISDN digits (no `+`), mirroring
 * the backend's `normalize_phone`. Resolves every common way a customer types
 * their number to the same value, so the OTP key, device-token key, and the
 * order's `customer_phone` all agree:
 *   `01012345678`            → `201012345678`
 *   `1012345678` (no lead 0) → `201012345678`
 *   `+20 101 234 5678`       → `201012345678`
 *   `00201012345678` / `201…`→ `201012345678`
 */
export const normalizePhone = (raw: string): string => {
  let digits = raw.replace(/\D/g, ""); // drop +, spaces, dashes — digits only
  if (digits.startsWith("00")) digits = digits.slice(2); // 0020… → 20…
  if (digits === "") return "";
  if (digits.startsWith("20")) return digits; // already country-coded
  if (digits.startsWith("0")) return `20${digits.slice(1)}`; // 01… → 201…
  return `20${digits}`; // bare national (1…) → 201…
};

/** A complete Egyptian mobile in canonical form: `201` + 9 national digits. */
export const isValidPhone = (raw: string): boolean =>
  /^201\d{9}$/.test(normalizePhone(raw));

const DEVICE_KEY_PREFIX = "madar_delivery_device:";

/** Read the stored device token for a phone (skips OTP when present). */
export const getDeviceToken = (phone: string): string | null => {
  try {
    return localStorage.getItem(DEVICE_KEY_PREFIX + normalizePhone(phone));
  } catch {
    return null;
  }
};

/** Persist a verified device token keyed by normalized phone. */
export const setDeviceToken = (phone: string, token: string): void => {
  try {
    localStorage.setItem(DEVICE_KEY_PREFIX + normalizePhone(phone), token);
  } catch {
    /* storage unavailable — fall back to per-checkout OTP */
  }
};

const GUEST_PHONE_KEY_PREFIX = "madar_guest_phone:";

/** Recall the last phone used for this org (pre-fills the phone step). */
export const getGuestPhone = (orgId: string): string | null => {
  try {
    return localStorage.getItem(GUEST_PHONE_KEY_PREFIX + orgId);
  } catch {
    return null;
  }
};

/** Persist the phone entered for this org so it pre-fills on the next visit. */
export const setGuestPhone = (orgId: string, phone: string): void => {
  try {
    localStorage.setItem(GUEST_PHONE_KEY_PREFIX + orgId, phone);
  } catch {
    /* storage unavailable */
  }
};
