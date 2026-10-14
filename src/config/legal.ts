/**
 * Public legal documents, served as a static site independent of this app and of
 * the API — these URLs are cited in the App Store and Google Play listings, so
 * they must resolve even when the backend is down.
 *
 * Single source of truth: if the documents ever move, change it here only.
 */
export const LEGAL_BASE = "https://legal.madar-pos.cloud";

export const LEGAL_URLS = {
  index: LEGAL_BASE,
  privacy: `${LEGAL_BASE}/privacy-policy.html`,
  terms: `${LEGAL_BASE}/terms-of-service.html`,
  dpa: `${LEGAL_BASE}/dpa.html`,
  subprocessors: `${LEGAL_BASE}/subprocessors.html`,
  retention: `${LEGAL_BASE}/data-retention.html`,
  deleteAccount: `${LEGAL_BASE}/delete-account.html`,
  security: `${LEGAL_BASE}/security.html`,
  employeePrivacy: `${LEGAL_BASE}/employee-privacy-notice.html`,
} as const;

/**
 * The version of the Terms of Service a new shop accepts at sign-up; the
 * server stores it with the org. Change it when `terms-of-service.html` changes
 * in a way owners must accept again.
 */
export const TERMS_VERSION = "1.0";
