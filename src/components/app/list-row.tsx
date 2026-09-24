import type { ReactNode } from "react";
import { ChevronRight, Minus, Plus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One list row (POS SPEC §7) — 56 min height, inset 16/20, hairline between
 * siblings when stacked in a <ListCard>.
 *
 *  nav     glyph · title / meta · value · chevron          settings links
 *  ledger  ± disc · title / meta · signed figure           movements, adjustments
 *  item    glyph/avatar · title / meta · trailing          people, records
 *  pick    glyph · title / meta · control (radio/check)    choices
 *
 * Meta is facts joined by " · "; wrap figures in <bdi> (or use lib/format).
 */
export type ListRowVariant = "nav" | "ledger" | "item" | "pick";

interface ListRowProps {
  variant?: ListRowVariant;
  title: ReactNode;
  meta?: ReactNode;
  /** Let a long meta line wrap instead of cutting it to one line. */
  wrapMeta?: boolean;
  icon?: LucideIcon;
  /** Replaces the glyph (an avatar, an image). */
  leading?: ReactNode;
  /** ledger: the direction of the movement. */
  sign?: "in" | "out";
  /** A value word or figure on the end side. */
  value?: ReactNode;
  /** Figures render mono/tabular. */
  numericValue?: boolean;
  /** Controls, a pill, a menu. */
  trailing?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
}

export function ListRow({
  variant = "item",
  title,
  meta,
  wrapMeta = false,
  icon: Icon,
  leading,
  sign,
  value,
  numericValue,
  trailing,
  selected,
  onClick,
  disabled,
  className,
}: ListRowProps) {
  const interactive = !!onClick && !disabled;

  let lead: ReactNode = leading ?? null;
  if (!lead && variant === "ledger" && sign) {
    const SignGlyph = sign === "in" ? Plus : Minus;
    lead = (
      <span
        aria-hidden
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          sign === "in"
            ? "bg-success/12 text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]"
            : "bg-destructive/12 text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]",
        )}
      >
        <SignGlyph className="size-4" strokeWidth={2.5} />
      </span>
    );
  } else if (!lead && Icon) {
    lead = (
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </span>
    );
  }

  const body = (
    <>
      {selected ? <span aria-hidden className="absolute inset-y-0 start-0 w-1 bg-primary" /> : null}
      {lead}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {meta ? <span className={cn("mt-0.5 block text-[13px] text-muted-foreground", wrapMeta ? "break-words" : "truncate")}>{meta}</span> : null}
      </span>
      {value !== undefined && value !== null ? (
        <span
          className={cn(
            "shrink-0 text-sm",
            numericValue ? "font-mono font-semibold tabular-nums" : "text-muted-foreground",
          )}
        >
          <bdi>{value}</bdi>
        </span>
      ) : null}
      {trailing ? (
        <span className="flex shrink-0 items-center gap-1" onClick={(e) => interactive && e.stopPropagation()}>
          {trailing}
        </span>
      ) : null}
      {variant === "nav" ? (
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
      ) : null}
    </>
  );

  const cls = cn(
    "relative flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-start sm:px-5",
    interactive &&
      "cursor-pointer transition-colors duration-150 hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:outline-none motion-reduce:transition-none",
    selected && "bg-accent hover:bg-accent",
    disabled && "text-disabled-foreground",
    className,
  );

  return interactive ? (
    <button type="button" data-slot="list-row" onClick={onClick} aria-current={selected || undefined} className={cls}>
      {body}
    </button>
  ) : (
    <div data-slot="list-row" className={cls}>
      {body}
    </div>
  );
}

/** A flush card of rows with hairlines between them. */
export function ListCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-slot="list-card" className={cn("divide-y overflow-hidden rounded-2xl border bg-card", className)}>
      {children}
    </div>
  );
}

/** Arithmetic under a list: label at the start, figure at the end. */
export function SummaryLine({
  label,
  value,
  emphasis,
  muted,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  emphasis?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        emphasis ? "min-h-12 text-base font-semibold" : "min-h-9 text-sm",
        muted && "text-muted-foreground",
        className,
      )}
    >
      <span className={cn(!emphasis && "text-muted-foreground")}>{label}</span>
      <bdi className={cn("font-mono tabular-nums", emphasis ? "text-lg" : "font-medium")}>{value}</bdi>
    </div>
  );
}
