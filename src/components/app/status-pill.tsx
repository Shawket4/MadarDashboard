import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, CircleDashed, Info, XCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A status — glyph + label, never colour alone (POS SPEC §10).
 *
 * Tones: neutral ◯ · accent ◐ (in progress / open) · success ✓ · warning ⚠ ·
 * danger ⊗ · info ⓘ. Text is the tone pulled halfway to the foreground so it
 * clears AA on its own wash in both themes (see CLAUDE.md "Colour and contrast").
 */
export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-secondary text-muted-foreground",
  accent: "bg-accent text-foreground",
  success:
    "bg-success/12 text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]",
  warning:
    "bg-warning/14 text-[color-mix(in_oklch,var(--color-warning)_55%,var(--color-foreground))]",
  danger:
    "bg-destructive/12 text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]",
  info: "bg-info/12 text-[color-mix(in_oklch,var(--color-info)_60%,var(--color-foreground))]",
};

const TONE_GLYPH: Record<StatusTone, LucideIcon> = {
  neutral: Circle,
  accent: CircleDashed,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

export interface StatusPillProps {
  tone?: StatusTone;
  children: ReactNode;
  /** Override the tone's default glyph. */
  icon?: LucideIcon;
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill({ tone = "neutral", children, icon, size = "md", className }: StatusPillProps) {
  const Glyph = icon ?? TONE_GLYPH[tone];
  return (
    <span
      data-slot="status-pill"
      data-tone={tone}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        size === "md" ? "h-6 ps-2 pe-2.5 text-xs" : "h-5 ps-1.5 pe-2 text-[11px]",
        TONE_CLASS[tone],
        className,
      )}
    >
      <Glyph aria-hidden className={size === "md" ? "size-3.5" : "size-3"} strokeWidth={2.25} />
      {children}
    </span>
  );
}

/** Maps a status word to a tone. Features keep their own maps; these are the shared defaults. */
export const STATUS_TONES: Record<string, StatusTone> = {
  active: "success",
  completed: "success",
  paid: "success",
  finalized: "success",
  received: "success",
  approved: "success",
  open: "accent",
  ordered: "accent",
  pending: "warning",
  partially_received: "warning",
  draft: "neutral",
  inactive: "neutral",
  archived: "neutral",
  closed: "neutral",
  voided: "danger",
  cancelled: "danger",
  canceled: "danger",
  rejected: "danger",
  refunded: "danger",
  force_closed: "warning",
  no_show: "danger",
};

export const toneFor = (status: string | null | undefined, fallback: StatusTone = "neutral"): StatusTone =>
  (status && STATUS_TONES[status.toLowerCase()]) || fallback;
