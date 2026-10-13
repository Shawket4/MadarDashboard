import {
  Building2,
  Coffee,
  CreditCard,
  PlusCircle,
  Rocket,
  ScrollText,
  Sprout,
  Store,
  Tags,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { hasFeature } from "@/generated/plans";

/* ─────────────────────────────────────────────────────────────────────────────
 * Onboarding step tree — dependency-ordered, derived from the real backend setup
 * graph. The wizard walks these in order; the live dashboard mirror lights up the
 * matching tile as each `statusKey` flips done. Step progress (done/count/
 * required) is the source of truth from GET /orgs/{id}/onboarding — this file
 * only carries presentation (order, stage grouping, icon) and the i18n key stem.
 * ────────────────────────────────────────────────────────────────────────── */

export type StepKey =
  | "org_profile"
  | "branch"
  | "payment_methods"
  | "ingredients"
  | "categories"
  | "menu_items"
  | "addons"
  | "recipes"
  | "team"
  | "go_live";

export interface StepDef {
  key: StepKey;
  /** The GET /onboarding step this maps to. `go_live` is the synthetic finale. */
  statusKey?: string;
  stageId: StageId;
  icon: LucideIcon;
}

export type StageId = "cafe" | "branch" | "pay" | "menu" | "team" | "live";

export interface StageDef {
  id: StageId;
  icon: LucideIcon;
}

/** Navigator groupings, in order. */
export const STAGES: StageDef[] = [
  { id: "cafe", icon: Store },
  { id: "branch", icon: Building2 },
  { id: "pay", icon: CreditCard },
  { id: "menu", icon: Coffee },
  { id: "team", icon: Users },
  { id: "live", icon: Rocket },
];

/** Linear wizard order. Required steps (branch → payment → categories → items)
 *  gate completion; everything else is an optional enhancer. */
export const STEPS: StepDef[] = [
  { key: "org_profile", statusKey: "org_profile", stageId: "cafe", icon: Store },
  { key: "branch", statusKey: "branch", stageId: "branch", icon: Building2 },
  { key: "payment_methods", statusKey: "payment_methods", stageId: "pay", icon: CreditCard },
  { key: "ingredients", statusKey: "ingredients", stageId: "menu", icon: Sprout },
  { key: "categories", statusKey: "categories", stageId: "menu", icon: Tags },
  { key: "menu_items", statusKey: "menu_items", stageId: "menu", icon: Coffee },
  { key: "addons", statusKey: "addons", stageId: "menu", icon: PlusCircle },
  { key: "recipes", statusKey: "recipes", stageId: "menu", icon: ScrollText },
  { key: "team", statusKey: "team", stageId: "team", icon: Users },
  { key: "go_live", stageId: "live", icon: Rocket },
];

/** Mirror tiles, in display order — each reads a count (and optional ring) from
 *  the onboarding status. `first_order` powers the "go live" finale tile. */
export const MIRROR_TILES = [
  "org_profile",
  "branch",
  "payment_methods",
  "categories",
  "menu_items",
  "ingredients",
  "addons",
  "team",
  "first_order",
] as const;

/** localStorage / sessionStorage keys for the gate + nudge. */
export const ONBOARDING_SKIP_KEY = "madar.onboarding.skip";
export const NUDGE_DISMISS_KEY = "madar.onboarding.nudge.dismissed";

/**
 * The steps of the checklist that need a plan feature. Ingredients and
 * recipes feed stock and cost, which are the paid plan's inventory; a Free
 * shop sells without them, so its wizard, mirror and nudge leave them out
 * (the server still lists them; they are never required).
 */
const INVENTORY_STEPS: readonly string[] = ["ingredients", "recipes"];

/** Whether a checklist step (by its server key) applies to this plan. Unknown plan = Paid. */
export const stepApplies = (key: string, plan: string | null | undefined): boolean =>
  !INVENTORY_STEPS.includes(key) || hasFeature(plan, "inventory");

/** The wizard's steps for a plan, in order. */
export const stepsForPlan = (plan: string | null | undefined): StepDef[] =>
  STEPS.filter((s) => stepApplies(s.key, plan));
