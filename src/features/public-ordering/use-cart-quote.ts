/**
 * The server's price for the basket, deals applied.
 *
 * The backend applies the best deals itself (at intake online, when the bill
 * settles at a table); this asks it, while the customer is still choosing, what
 * it will do — so the basket shows the deal and the total it will actually
 * charge instead of a surprise afterwards.
 *
 * Debounced on the cart's CONTENT (not on re-renders), and a quote is only
 * handed back while it still describes the cart on screen. When the quote
 * fails or is in flight the caller falls back to its own estimate: the page
 * never waits on this.
 */
import { useQuery } from "@tanstack/react-query";

import { publicBranchCartQuote, publicTableCartQuote } from "@/data/api/generated/api";
import type { CartQuote } from "@/data/api/generated/models/cartQuote";
import { useDebounced } from "@/lib/use-debounced";

import type { CartLine, Channel } from "./types";
import { cartContentKey, cartSubtotal, toCartLineInput } from "./utils";

export type QuoteTarget =
  | { kind: "branch"; id: string | null; channel: Channel }
  | { kind: "table"; id: string };

export interface CartPricing {
  /** The server's quote for exactly this cart, or null (none yet / failed / stale). */
  quote: CartQuote | null;
  /** Items before deals: the server's figure when quoted, else the estimate. */
  itemsTotal: number;
  /** Items after deals — what the items will actually cost. */
  afterDeals: number;
}

export function useCartQuote(target: QuoteTarget, lines: CartLine[], enabled = true): CartPricing {
  const key = cartContentKey(lines);
  const settledKey = useDebounced(key, 300);
  const channel = target.kind === "branch" ? target.channel : null;
  const { data } = useQuery({
    queryKey: ["public-cart-quote", target.kind, target.id, channel, settledKey],
    queryFn: ({ signal }) => {
      const items = JSON.parse(settledKey) as ReturnType<typeof toCartLineInput>[];
      return target.kind === "branch"
        ? publicBranchCartQuote(target.id!, { channel, items }, undefined, signal)
        : publicTableCartQuote(target.id, { items }, undefined, signal);
    },
    enabled: enabled && !!target.id && lines.length > 0 && settledKey === key,
    retry: false,
    staleTime: 30_000,
  });
  // Only a quote for the cart on screen, and one that lines up with it.
  const quote = enabled && lines.length > 0 && settledKey === key && data && data.lines.length === lines.length ? data : null;
  const estimate = cartSubtotal(lines);
  return {
    quote,
    itemsTotal: quote ? quote.items_total : estimate,
    afterDeals: quote ? quote.total_after_deals : estimate,
  };
}
