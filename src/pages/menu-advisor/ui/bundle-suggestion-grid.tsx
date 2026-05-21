import { PackagePlus, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { fmtMoney, fmtPercent } from "@/shared/lib/format";
import type { BundleSuggestion } from "../api/types";

interface BundleSuggestionGridProps {
  suggestions: BundleSuggestion[];
}

export function BundleSuggestionGrid({ suggestions }: BundleSuggestionGridProps) {
  // Sort by incremental CM mid, descending
  const sorted = [...suggestions].sort(
    (a, b) => b.forecast.incremental_cm_mid - a.forecast.incremental_cm_mid
  );

  if (sorted.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground bg-muted/20">
        No bundle opportunities found right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sorted.map(bundle => (
        <div key={bundle.id || bundle.focus_item} className="flex flex-col overflow-hidden rounded-xl border bg-background hover:border-primary/50 transition-colors">
          {/* Header: Items */}
          <div className="p-4 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <PackagePlus size={16} className="text-primary" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary/70">Menu Pairing</span>
            </div>
            <p className="font-bold text-lg leading-tight">
              {bundle.focus_item} <span className="text-muted-foreground font-normal mx-1">+</span> {bundle.bundle_items.join(" + ")}
            </p>
          </div>
          
          {/* Body: Prices & Impact */}
          <div className="p-5 flex-1 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide font-semibold">Suggested Bundle Price</p>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
                    {fmtMoney(bundle.bundle_list_price)}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {fmtMoney(bundle.bundle_suggested_price)}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-primary bg-primary/10 hover:bg-primary/20 text-sm py-1">
                {fmtPercent(bundle.bundle_discount_pct)} OFF
              </Badge>
            </div>

            {/* Plain English Explanation */}
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {bundle.explanation}
            </p>

            {/* Financial Impact */}
            <div className="flex items-center gap-3 p-4 bg-success/10 text-success rounded-xl border border-success/20">
              <div className="p-2 bg-success/20 rounded-full">
                <TrendingUp size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Est. Profit Boost</p>
                <p className="font-bold text-lg">+{fmtMoney(bundle.forecast.incremental_cm_mid)} <span className="text-sm font-normal opacity-80">/ month</span></p>
              </div>
            </div>
          </div>

          {/* Missing Cost Warning Banner */}
          {bundle.missing_costs && (
            <div className="bg-warning/10 border-t border-warning/20 p-3 flex gap-2 items-center text-warning text-sm">
              <AlertTriangle className="shrink-0" size={16} />
              <p>
                <strong>Ingredient Cost is Missing.</strong> One or more items in this bundle have no recorded cost. The estimated profit boost may be inaccurate.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
