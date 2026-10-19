import {
  BookOpenText,
  Building2,
  Coins,
  CreditCard,
  FolderTree,
  KeyRound,
  ListChecks,
  ListTree,
  Receipt,
  Scale,
  Tablet,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Readiness, ReadinessCheck, ReadinessProblem } from "@/data/api/generated/models";

/*
 * The Setup page's vocabulary: for each readiness check the server sends
 * (`GET /orgs/{id}/readiness`, MadarRust `orgs/readiness.rs`), its icon and the
 * page that fixes it. The words live in `setup.checks.<key>` in en.json and
 * ar.json; `checks.test.ts` fails when a key has no words. Nothing here decides
 * whether a check passes: that is the server's.
 */

/** Where a check's button goes. `tablet` and an empty `menu` open dialogs instead. */
export interface CheckLink {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
}

export interface CheckDef {
  icon: LucideIcon;
  link: CheckLink;
}

export const CHECKS: Record<string, CheckDef> = {
  branch: { icon: Building2, link: { to: "/branches" } },
  menu: { icon: UtensilsCrossed, link: { to: "/menu/items" } },
  payment: { icon: CreditCard, link: { to: "/settings/payment-methods" } },
  sign_in: { icon: KeyRound, link: { to: "/access/users" } },
  tablet: { icon: Tablet, link: { to: "/devices" } },
  items_no_category: { icon: FolderTree, link: { to: "/menu/items" } },
  items_zero_price: { icon: Coins, link: { to: "/menu/items" } },
  required_group_empty: { icon: ListTree, link: { to: "/menu/groups" } },
  menu_lint: { icon: ListChecks, link: { to: "/menu/items" } },
  recipes: { icon: BookOpenText, link: { to: "/menu/items", search: { tab: "items", recipe: "missing" } } },
  ingredient_costs: { icon: Scale, link: { to: "/inventory/ingredients" } },
  team: { icon: Users, link: { to: "/access/users" } },
  receipt: { icon: Receipt, link: { to: "/settings/brand" } },
};

/** The checks this build knows how to show; an unknown key from a newer server is skipped. */
export const known = (checks: readonly ReadinessCheck[]): ReadinessCheck[] => checks.filter((c) => c.key in CHECKS);

/** Where one named problem is fixed: its own editor. */
export function problemLink(p: ReadinessProblem): CheckLink {
  if (p.item_id) return { to: "/menu/items/$itemId", params: { itemId: p.item_id } };
  if (p.entity_type === "branch") return { to: "/branches" };
  if (p.entity_type === "ingredient") return { to: "/inventory/ingredients" };
  return { to: "/menu/groups" };
}

/** The setup's state, as the page and the home card say it. */
export type Stage = "none" | "setup" | "ready" | "live";

export function stageOf(r: Readiness | undefined): Stage {
  if (!r || r.checks.length === 0) return "none";
  if (!r.ready) return "setup";
  return r.live ? "live" : "ready";
}

/** The home card shows until the shop is ready AND has sold; a new blocking problem brings it back. */
export const showsHomeCard = (r: Readiness | undefined): boolean => {
  const s = stageOf(r);
  return s === "setup" || s === "ready";
};

export const blocking = (r: Readiness): ReadinessCheck[] => known(r.checks).filter((c) => c.level === "blocking");
export const advice = (r: Readiness): ReadinessCheck[] => known(r.checks).filter((c) => c.level === "advice");

/** The first blocking check still open: the one thing to do next. */
export const nextCheck = (r: Readiness): ReadinessCheck | undefined => blocking(r).find((c) => !c.ok);

/** Blocking checks still open. */
export const leftToDo = (r: Readiness): number => blocking(r).filter((c) => !c.ok).length;
