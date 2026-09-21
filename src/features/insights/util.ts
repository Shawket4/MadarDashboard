import { queryClient } from "@/data/api/query";

/** Invalidate every insights query (ledger, margin watch, targets, decisions).
 *  Writes are cheap and the surfaces cross-feed (a dismissal changes the ledger,
 *  the watch card and the decision log), so one broad sweep keeps them honest. */
export const invalidateInsights = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/insights"),
  });

/** Readable state tints for figures (CLAUDE.md contrast formula) — never raw tokens on text. */
export const TINT = {
  success: "text-[color-mix(in_oklab,var(--color-success)_60%,var(--color-foreground))]",
  warning: "text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]",
  danger: "text-[color-mix(in_oklab,var(--color-destructive)_60%,var(--color-foreground))]",
} as const;
