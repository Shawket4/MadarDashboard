/** sessionStorage key for the per-org guest cart. */
export const STORAGE_KEY = (orgId: string) => `rue:public-cart:${orgId}`;

/** Silent background refetch cadence (also paired with the backend ETag → cheap 304s). */
export const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Fly-to-cart flight duration. */
export const FLIGHT_MS = 720;

/** Animated price roll duration. */
export const PRICE_ROLL_MS = 360;
