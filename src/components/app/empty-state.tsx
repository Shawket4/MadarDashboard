import type { ReactNode } from "react";
import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  /** A sentence that says what will appear here — never a bare "No data". */
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Empty content (POS SPEC §11): badge glyph, 16/600 title, 14 message, optional action. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Icon aria-hidden className="size-5" />
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-base font-semibold text-balance">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  /** Name what failed ("Couldn't load orders"), not a generic "Error". */
  title?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  retryLabel?: string;
  className?: string;
}

/** A failed load — never shown as empty. Danger badge, message, primary Retry. */
export function ErrorState({ title, message, onRetry, retrying, retryLabel, className }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-destructive/12 text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]">
        <AlertTriangle aria-hidden className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-base font-semibold text-balance">
          {title ?? t("common.loadFailed", "Couldn't load this")}
        </p>
        {message ? <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button onClick={onRetry} loading={retrying} className="mt-1">
          {retrying ? null : <RotateCw aria-hidden />}
          {retryLabel ?? t("common.retry", "Retry")}
        </Button>
      ) : null}
    </div>
  );
}
