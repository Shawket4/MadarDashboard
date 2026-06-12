import { useEffect, useRef, useState } from "react";
import { STORAGE_KEY } from "../lib/constants";
import type { CartLine } from "../lib/types";

/** Cart persisted to sessionStorage, keyed per org. */
export function usePersistentCart(orgId: string | null) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const hydratedRef = useRef(false);

  // Hydrate
  useEffect(() => {
    if (!orgId) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY(orgId));
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) setCart(parsed as CartLine[]);
      }
    } catch {
      /* corrupted storage — ignore */
    }
    hydratedRef.current = true;
  }, [orgId]);

  // Persist (skip first render to avoid clobbering with empty state)
  useEffect(() => {
    if (!orgId || !hydratedRef.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY(orgId), JSON.stringify(cart));
    } catch {
      /* quota or private mode — ignore */
    }
  }, [cart, orgId]);

  return [cart, setCart] as const;
}
