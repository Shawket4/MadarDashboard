import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "./skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  loading?: boolean;
  className?: string;
  accent?: "primary" | "success" | "warning" | "destructive" | "info" | "violet";
  onClick?: () => void;
}

const ACCENT_BG: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
};

export function StatCard({ label, value, sub, icon: Icon, trend, loading, className, accent = "primary", onClick }: StatCardProps) {
  if (loading)
    return (
      <div className={cn("rounded-xl border bg-card p-5 space-y-3", className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    );

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-5 transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1 tabular font-sans">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          {trend && (
            <p className={cn("text-xs font-semibold mt-1", trend.value >= 0 ? "text-success" : "text-destructive")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", ACCENT_BG[accent])}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
