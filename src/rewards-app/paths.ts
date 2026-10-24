/**
 * The Rewards host's URL space (rewards.madar-pos.cloud).
 *
 * The owner pages are the dashboard's own `src/features/rewards` pages, whose
 * links say `/rewards/members` and so on. Here they live at the root, so the
 * router rewrites: `/members` in the address bar is `/rewards/members` inside
 * (and back). `/login` and `/counter` are not rewritten.
 */
export const INTERNAL = "/rewards";

const OWN = ["/login", "/counter"];

const own = (path: string) => OWN.some((p) => path === p || path.startsWith(`${p}/`));

export const isCounterPath = (path: string): boolean => path === "/counter" || path.startsWith("/counter/");

/** Address bar → router: `/members` → `/rewards/members`, `/` → `/rewards`. */
export function toInternal(path: string): string {
  if (own(path) || path === INTERNAL || path.startsWith(`${INTERNAL}/`)) return path;
  return path === "/" ? INTERNAL : `${INTERNAL}${path}`;
}

/** Router → address bar: `/rewards/members` → `/members`, `/rewards` → `/`. */
export function toExternal(path: string): string {
  if (path === INTERNAL || path === `${INTERNAL}/`) return "/";
  return path.startsWith(`${INTERNAL}/`) ? path.slice(INTERNAL.length) : path;
}

/**
 * Where to go after signing in: a same-host path only (never `//elsewhere` or
 * a full URL), as the router spells it.
 */
export function afterSignIn(redirect: string | undefined): string {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//") || redirect.startsWith("/\\")) return INTERNAL;
  const cut = redirect.search(/[?#]/);
  const path = cut < 0 ? redirect : redirect.slice(0, cut);
  const rest = cut < 0 ? "" : redirect.slice(cut);
  if (own(path)) return INTERNAL;
  return toInternal(path) + rest;
}
