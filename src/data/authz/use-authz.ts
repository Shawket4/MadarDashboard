/**
 * What the signed-in person may do: their effective capabilities from
 * `GET /authz/me` (architecture E). Every nav entry, page and button asks this
 * — never the role name — so nobody is shown something whose only outcome is a
 * 403. The server still enforces everything.
 *
 * - A super admin (platform) holds everything; nothing is fetched.
 * - While the answer is loading, the last answer for this person (kept in
 *   storage) stands in, so a reload does not flash an empty sidebar.
 * - Against a backend without `/authz/me` (404) the role's registry defaults
 *   stand in, so the dashboard keeps working during a staggered deploy.
 */
import { useMemo } from "react";
import { AxiosError } from "axios";

import { useGetMyAuthz } from "@/data/api/generated/api";
import type { MyAuthz } from "@/data/api/generated/models";
import { useAuthStore } from "@/data/stores/auth.store";
import { CAPABILITIES, type Capability, type RoleKind } from "@/generated/capabilities";
import { safeStorage } from "@/lib/safe-storage";

export interface Limits {
  max_amount?: number | null;
  max_percent?: number | null;
  max_value?: number | null;
}

export interface Authz {
  /** True once a real (or remembered) answer is in hand. */
  ready: boolean;
  platform: boolean;
  owner: boolean;
  roleKinds: readonly string[];
  can: (cap: Capability) => boolean;
  canAny: (...caps: Capability[]) => boolean;
  /**
   * Held at EVERY branch of the business (`/authz/me` `everywhere`), what an
   * org-wide act needs: a department, a shift block, a public holiday. A
   * backend that doesn't send the list falls back to `can`.
   */
  canEverywhere: (cap: Capability) => boolean;
  /** Not held, but the owner lets this person ask a manager. */
  canAsk: (cap: Capability) => boolean;
  limitsOf: (cap: Capability) => Limits | undefined;
}

const KEY = (userId: string) => `madar.authz.${userId}`;

/** Build the checker from an answer. Pure, so it is tested directly. */
export function authzFrom(me: MyAuthz | null | undefined, opts: { platform?: boolean } = {}): Authz {
  if (opts.platform) {
    return {
      ready: true,
      platform: true,
      owner: true,
      roleKinds: ["org_admin"],
      can: () => true,
      canAny: () => true,
      canEverywhere: () => true,
      canAsk: () => false,
      limitsOf: () => undefined,
    };
  }
  const held = new Set(me?.capabilities ?? []);
  const ask = new Set(me?.ask_manager ?? []);
  const limits = (me?.limits ?? {}) as Record<string, Limits>;
  const platform = !!me?.platform;
  const can = (cap: Capability) => platform || held.has(cap);
  const everywhere = me?.everywhere ? new Set(me.everywhere) : null;
  const canEverywhere = (cap: Capability) => platform || (everywhere ? everywhere.has(cap) : can(cap));
  return {
    ready: !!me,
    platform,
    owner: !!me?.owner || platform,
    roleKinds: me?.role_kinds ?? [],
    can,
    canAny: (...caps) => caps.some(can),
    canEverywhere,
    canAsk: (cap) => !can(cap) && ask.has(cap),
    limitsOf: (cap) => limits[cap],
  };
}

/** What a role kind held by default, for a backend that predates `/authz/me`. */
export function defaultsFor(role: string | undefined, userId = ""): MyAuthz | null {
  if (!role) return null;
  const kind = role as RoleKind;
  const caps = CAPABILITIES.filter((c) => c.tier !== "legacy" && c.defaults.includes(kind)).map((c) => c.key);
  return {
    user_id: userId,
    epoch: 0,
    spec_version: 0,
    owner: kind === "org_admin",
    platform: false,
    role_kinds: [kind],
    capabilities: caps,
    ask_manager: [],
    limits: {},
  };
}

function remembered(userId: string | undefined): MyAuthz | undefined {
  if (!userId) return undefined;
  try {
    const raw = safeStorage.getItem(KEY(userId));
    return raw ? (JSON.parse(raw) as MyAuthz) : undefined;
  } catch {
    return undefined;
  }
}

export function useAuthz(): Authz {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const platform = user?.role === "super_admin";
  const q = useGetMyAuthz(undefined, {
    query: {
      enabled: !!token && !!user && !platform,
      staleTime: 60_000,
      placeholderData: () => remembered(user?.id),
    },
  });

  const data = q.data;
  const notDeployed = q.error instanceof AxiosError && q.error.response?.status === 404;

  return useMemo(() => {
    if (platform) return authzFrom(null, { platform: true });
    if (data) {
      if (!q.isPlaceholderData && user?.id) {
        try {
          safeStorage.setItem(KEY(user.id), JSON.stringify(data));
        } catch {
          /* storage is a convenience */
        }
      }
      return authzFrom(data);
    }
    if (notDeployed) return authzFrom(defaultsFor(user?.role, user?.id));
    return authzFrom(null);
  }, [platform, data, q.isPlaceholderData, notDeployed, user?.id, user?.role]);
}

/** `useCan(Cap.x)` for a single check. */
export function useCan(cap: Capability): boolean {
  return useAuthz().can(cap);
}
