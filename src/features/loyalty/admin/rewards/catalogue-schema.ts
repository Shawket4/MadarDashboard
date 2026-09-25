/**
 * The reward catalogue as the editor holds it, and the rules a save must pass.
 *
 * Mirrors `settings::put_reward_items` so an admin hears about a problem while
 * the row is in front of them rather than as a 400 after pressing Save:
 *
 *  - every cost is a whole number above zero ("a reward must cost more than
 *    nothing");
 *  - an item appears once — the table's key is (scope, menu item), and the
 *    server's `ON CONFLICT DO NOTHING` would otherwise drop the duplicate
 *    without a word;
 *  - every item is a live, active menu item of this org ("reward items must be
 *    active menu items of this org").
 */
import { z } from "zod";

import type { MenuItem, RewardItem } from "@/data/api/generated/models";

export const MAX_COST = 1_000_000;

export const rewardRowSchema = z.object({
  menu_item_id: z.string().min(1),
  name: z.string(),
  cost_amount: z
    .number({ message: "loyalty.errors.rewardCost" })
    .int({ message: "loyalty.errors.rewardCost" })
    .positive({ message: "loyalty.errors.rewardCost" })
    .max(MAX_COST, { message: "loyalty.errors.rewardCost" }),
});

export type RewardRow = z.infer<typeof rewardRowSchema>;

export const catalogueSchema = z
  .array(rewardRowSchema)
  .superRefine((rows, ctx) => {
    const seen = new Set<string>();
    rows.forEach((r, i) => {
      if (seen.has(r.menu_item_id)) {
        ctx.addIssue({
          code: "custom",
          path: [i, "menu_item_id"],
          message: "loyalty.errors.rewardDuplicate",
        });
      }
      seen.add(r.menu_item_id);
    });
  });

/** Why a catalogue row cannot be saved as it stands, or null when it can. */
export type RowProblem = "cost" | "duplicate" | "unavailable" | "inactive" | null;

/** Problems that make the server refuse the save; `inactive` is only a warning. */
export const isBlocking = (p: RowProblem): boolean => p !== null && p !== "inactive";

/**
 * A menu item may be offered as a reward: it exists, is not deleted, and is on
 * sale. An archived item is refused by the server; an inactive one would sit on
 * the till's reward list for something the till cannot sell.
 */
export const isOfferable = (m: Pick<MenuItem, "is_active" | "deleted_at">): boolean =>
  m.is_active && !m.deleted_at;

/**
 * Each row's problem, index-aligned with `rows`.
 *
 * `menu` is undefined while the menu is still loading — rows are not flagged
 * unavailable on the strength of a list that has not arrived.
 */
export function rowProblems(rows: RewardRow[], menu: MenuItem[] | undefined): RowProblem[] {
  const byId = menu ? new Map(menu.map((m) => [m.id, m])) : null;
  const seen = new Set<string>();
  return rows.map((r) => {
    const dup = seen.has(r.menu_item_id);
    seen.add(r.menu_item_id);
    if (!rewardRowSchema.shape.cost_amount.safeParse(r.cost_amount).success) return "cost";
    if (dup) return "duplicate";
    if (byId) {
      const m = byId.get(r.menu_item_id);
      // Gone (deleted): the server refuses the whole save over it.
      if (!m || m.deleted_at) return "unavailable";
      // Switched off: saved fine, but the till has nothing to hand over — worth
      // saying, not worth blocking (a seasonal item comes back).
      if (!m.is_active) return "inactive";
    }
    return null;
  });
}

/** The server's list, as editable rows. */
export const rowsFromCatalogue = (items: RewardItem[]): RewardRow[] =>
  items.map((i) => ({ menu_item_id: i.menu_item_id, name: i.name, cost_amount: i.cost_amount }));

/** Rows, as the PUT body's items — priced in the scope's currency. */
export const rowsToWire = (rows: RewardRow[], mode: "points" | "visits") =>
  rows.map((r) => ({
    menu_item_id: r.menu_item_id,
    cost_currency: mode,
    cost_amount: r.cost_amount,
  }));

/** Whether the editor differs from what the server last returned. */
export const catalogueChanged = (rows: RewardRow[], saved: RewardItem[]): boolean =>
  rows.length !== saved.length ||
  rows.some(
    (r, i) => r.menu_item_id !== saved[i].menu_item_id || r.cost_amount !== saved[i].cost_amount,
  );
