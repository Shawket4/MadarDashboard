import { env } from "@/data/config/env";

/**
 * Whether the public sign-up (/signup) is switched on. Off unless the build
 * sets `VITE_SIGNUP_ENABLED=1` (or `true`). While it is off, the login page
 * does not link to it and /signup sends a visitor to /login, with one way in:
 * `/signup?preview=1`. That is how the flow is tested end-to-end on production
 * with a test org before anyone is shown it. It is a switch, not a lock: the
 * server's endpoints are public either way.
 */
export const signupEnabled = (value: string | undefined = env.VITE_SIGNUP_ENABLED): boolean =>
  value === "1" || value === "true";

/** May this visitor open /signup? On when the flag is on, or by the preview key. */
export const signupOpen = (preview: string | undefined, enabled: boolean = signupEnabled()): boolean =>
  enabled || preview === "1";
