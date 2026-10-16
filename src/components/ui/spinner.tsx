import { Loader2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The one spinner. A CSS loop (the compositor keeps it turning while the main
 * thread is busy), and the only place `animate-spin` is allowed; it keeps
 * turning under reduced motion, which is the policy for progress indicators
 * (scripts/motion-check.mjs enforces both).
 *
 * It takes the text colour and is decorative: put the words ("Saving…") or an
 * aria-busy beside it. `icon` swaps the glyph (a refresh arrow that turns while
 * busy); `spinning={false}` shows that glyph still.
 */
export function Spinner({
  className,
  icon: Icon = Loader2,
  spinning = true,
}: {
  className?: string;
  icon?: LucideIcon;
  spinning?: boolean;
}) {
  return <Icon data-slot="spinner" aria-hidden className={cn("size-4", spinning && "animate-spin", className)} />;
}
