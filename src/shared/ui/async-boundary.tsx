import * as React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Skeleton } from "./skeleton";
import { EmptyState } from "./empty-state";
import { Button } from "./button";
import { getErrorMessage } from "@/shared/api/errors";

export interface AsyncBoundaryProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  /** When true (and not loading/error) the empty state renders instead of children. */
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * Shared loading / error / empty wrapper for list and table pages, so every
 * page resolves async states the same way instead of hand-rolling the
 * ternary chain.
 */
export function AsyncBoundary({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyState,
  loadingState,
  onRetry,
  children,
}: AsyncBoundaryProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <>
        {loadingState ?? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        )}
      </>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t("common.errorTitle", { defaultValue: "Something went wrong" })}
        description={error ? getErrorMessage(error) : undefined}
        action={
          onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1">
              <RotateCcw size={13} /> {t("common.retry", { defaultValue: "Retry" })}
            </Button>
          )
        }
      />
    );
  }

  if (isEmpty) {
    return <>{emptyState ?? <EmptyState title={t("common.noResults")} />}</>;
  }

  return <>{children}</>;
}
