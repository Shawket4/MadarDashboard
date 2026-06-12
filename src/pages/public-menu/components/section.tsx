import type { ReactNode } from "react";

/** Titled block inside the item-detail sheet (sizes, addons, quantity). */
export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</h3>
        {subtitle && <span className="text-xs text-slate-400 font-bold text-end">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
