import { useCallback, useMemo } from "react";
import { usePersistentCart } from "./use-persistent-cart";
import { haptic } from "../lib/menu-format";
import type { CartLine } from "../lib/types";

/**
 * Guest cart: persistence + derived totals + mutations. Lives outside the page
 * component so cart changes don't re-render the menu grid (only consumers of
 * the returned values re-render).
 */
export function usePublicCart(orgId: string | null) {
  const [cart, setCart] = usePersistentCart(orgId);

  const count = useMemo(() => cart.reduce((s, l) => s + l.quantity, 0), [cart]);
  const total = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart],
  );

  const addLine = useCallback(
    (line: CartLine) => {
      setCart((prev) => {
        const idx = prev.findIndex((l) => l.signature === line.signature);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + line.quantity };
          return next;
        }
        return [...prev, line];
      });
    },
    [setCart],
  );

  const removeLine = useCallback(
    (lineId: string) => {
      haptic("light");
      setCart((prev) => prev.filter((l) => l.lineId !== lineId));
    },
    [setCart],
  );

  const updateQty = useCallback(
    (lineId: string, qty: number) => {
      setCart((prev) =>
        prev
          .map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
          .filter((l) => l.quantity > 0),
      );
    },
    [setCart],
  );

  return { cart, count, total, addLine, removeLine, updateQty };
}
