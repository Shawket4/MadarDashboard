/**
 * The list of items that COLLECT a stamp, and its translation to and from the
 * wire.
 *
 * Isolated from the component for the same reason the reward catalogue's rules
 * are: the one thing about this list that can be got wrong is not how it looks
 * but what an empty one MEANS, and that is worth stating in a file a person can
 * read end to end and a test can pin without a DOM.
 *
 * **An empty list means every item collects.** Not "nothing collects". It is
 * where every programme starts and where a shop that never opens this picker
 * stays, which is the whole reason the feature costs nothing to ignore. A shop
 * that wants nothing to earn switches the programme off.
 */
import type { EarningItem, MenuItem } from "@/data/api/generated/models";

/** One row of the picker. The name is carried for display only. */
export type EarningRow = {
  menu_item_id: string;
  name: string;
};

/** Can this menu item be picked? The same test the rewards list applies. */
export const isPickable = (m: MenuItem): boolean => m.is_active && !m.deleted_at;

export function rowsFromList(items: EarningItem[]): EarningRow[] {
  return items.map((i) => ({ menu_item_id: i.menu_item_id, name: i.name }));
}

/** The wire shape: ids alone, in the order shown. */
export function rowsToWire(rows: EarningRow[]): string[] {
  const seen = new Set<string>();
  return rows.map((r) => r.menu_item_id).filter((id) => !seen.has(id) && seen.add(id));
}

/**
 * Has the admin actually changed anything?
 *
 * Order matters here as it does on the server, which stores a `sort_order` —
 * but only membership changes what a customer earns, so a reorder that changed
 * nothing else should not light up the Save button as though it had. Compared
 * as SETS for that reason.
 */
export function listChanged(rows: EarningRow[], saved: EarningItem[]): boolean {
  const a = new Set(rowsToWire(rows));
  const b = new Set(saved.map((i) => i.menu_item_id));
  if (a.size !== b.size) return true;
  for (const id of a) if (!b.has(id)) return true;
  return false;
}
