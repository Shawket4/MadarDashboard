/**
 * The basket a customer is building, wherever they are building it.
 *
 * Shared by the delivery flow and the table-ordering page, because a basket is
 * a basket: the same lines, the same merge-by-uid, the same quantity clamp.
 * The two pages differ in what they do with it at the end — one places a
 * delivery order, the other sends a round to the kitchen — and in nothing
 * before that.
 *
 * Deliberately NOT persisted here. The delivery flow keeps its cart in local
 * storage against an org+branch key so a customer who browsed a closed branch
 * can come back to it; a table's basket is a single sitting and should not
 * outlive the visit, let alone follow the next party to the same table.
 */
import { useMemo, useState } from "react";

import { FIELD_LIMITS } from "./limits";

import type { CartLine } from "./types";
import { cartSubtotal } from "./utils";

export interface Cart {
  lines: CartLine[];
  /** Add a new configured line, or replace the one with the same `uid`. */
  addOrUpdate: (line: CartLine) => void;
  setQty: (uid: string, qty: number) => void;
  remove: (uid: string) => void;
  clear: () => void;
  /** How many of each menu item are in the basket, for the card badges. */
  countByItem: Record<string, number>;
  /** Total units, for the cart button's count. */
  itemCount: number;
  /** Estimated, in piastres. The server prices authoritatively. */
  subtotal: number;
}

export function useCart(initial: CartLine[] = []): Cart {
  const [lines, setLines] = useState<CartLine[]>(initial);

  const addOrUpdate = (line: CartLine) =>
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.uid === line.uid);
      if (idx < 0) return [...prev, line];
      const next = [...prev];
      next[idx] = line;
      return next;
    });

  const setQty = (uid: string, qty: number) =>
    setLines((prev) =>
      prev.map((l) =>
        l.uid === uid ? { ...l, quantity: Math.min(FIELD_LIMITS.lineQty, Math.max(1, qty)) } : l,
      ),
    );

  const remove = (uid: string) => setLines((prev) => prev.filter((l) => l.uid !== uid));

  const countByItem = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of lines) m[l.item.id] = (m[l.item.id] ?? 0) + l.quantity;
    return m;
  }, [lines]);

  return {
    lines,
    addOrUpdate,
    setQty,
    remove,
    clear: () => setLines([]),
    countByItem,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: cartSubtotal(lines),
  };
}
