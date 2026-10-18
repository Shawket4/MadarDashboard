import { forwardRef, type ComponentProps } from "react";
import { Link as RouterLink } from "@tanstack/react-router";

import { useNavIntent } from "@/lib/prefetch/nav-context";
import { withIntent } from "@/lib/prefetch/intent";

type RouterLinkProps = ComponentProps<typeof RouterLink>;

/**
 * The dashboard's `<Link>`: the router's, plus a DATA prefetch on intent. The
 * router already preloads the route's code on hover (`defaultPreload:
 * "intent"`); this also warms the destination page's queries, resolved through
 * the prefetch registry with the link's own `to`/`params`/`search` (hover after
 * a short pause, focus, or at once on pointerdown — see `lib/prefetch/intent`).
 *
 * Import it from here, never `Link` from `@tanstack/react-router` (ESLint
 * enforces it in the dashboard). `preload={false}` or `disabled` warms nothing.
 */
export const Link = forwardRef<HTMLAnchorElement, RouterLinkProps>(function Link(props, ref) {
  const nav = useNavIntent({ code: false });
  const { to, from, params, search, hash, preload, disabled } = props as RouterLinkProps & {
    to?: string;
    from?: string;
    params?: unknown;
    search?: unknown;
    hash?: unknown;
  };
  const handlers = preload === false || disabled ? null : nav({ to, from, params, search, hash });
  return <RouterLink ref={ref} {...(withIntent(props as Record<string, unknown>, handlers) as RouterLinkProps)} />;
}) as unknown as typeof RouterLink;
