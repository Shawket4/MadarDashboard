import { AlertTriangle, ArrowRight, Info, Check } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { fmtMoney, fmtPercent } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import type { PriceSuggestion, RemovalScenario } from "../api/types";

interface PriceSuggestionListProps {
  suggestions: PriceSuggestion[];
  removals?: RemovalScenario[]; // Passed only for Pruning section
  isStableSection?: boolean;
}

// Plain English mapping for the quadrants
const tagMapping: Record<string, { label: string; color: string }> = {
  Star: { label: "Popular & Profitable", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  Plowhorse: { label: "Popular but Low Margin", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  Puzzle: { label: "High Margin but Unpopular", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  Dog: { label: "Underperforming", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  InsufficientData: { label: "Needs More Data", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export function PriceSuggestionList({ suggestions, removals = [], isStableSection = false }: PriceSuggestionListProps) {
  // Sort by popularity so the most important items are at the top
  const sorted = [...suggestions].sort((a, b) => (b.popularity_share ?? 0) - (a.popularity_share ?? 0));

  return (
    <div className="space-y-4">
      {/* Show removal impacts if any exist for this section */}
      {removals.length > 0 && (
        <div className="mb-6 grid gap-3">
          {removals.map(scenario => (
             <div key={scenario.item_name} className="p-4 rounded-xl border bg-danger/5 border-danger/20 shadow-sm space-y-2">
               <div className="flex justify-between items-start">
                 <p className="font-bold text-danger">Impact of removing {scenario.item_name}</p>
                 <Badge variant={scenario.net_cm_change > 0 ? "success" : "destructive"}>
                    {scenario.net_cm_change > 0 ? "+" : ""}{fmtMoney(scenario.net_cm_change)} / month
                 </Badge>
               </div>
               <p className="text-sm text-danger/80">{scenario.explanation}</p>
             </div>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground bg-muted/20">
          {isStableSection ? "No stable items found." : "Nothing to do here right now. Great job!"}
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map(suggestion => {
            const hasChange = suggestion.suggested_price !== null && suggestion.suggested_price !== suggestion.current_price;
            const deltaPct = suggestion.suggested_delta_pct ?? 0;
            const isRaise = deltaPct > 0;
            const tagInfo = tagMapping[suggestion.quadrant] || tagMapping.InsufficientData;
            
            return (
              <div 
                key={suggestion.item_name} 
                className={cn(
                  "border rounded-xl bg-background overflow-hidden flex flex-col",
                  suggestion.quadrant === "InsufficientData" && "opacity-75"
                )}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between p-5 gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{suggestion.item_name}</h3>
                      <div className={cn("px-2 py-0.5 text-xs font-semibold rounded-md border", tagInfo.color)}>
                        {tagInfo.label}
                      </div>
                      {suggestion.cost_missing && (
                        <div className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-warning/10 text-warning border border-warning/20">
                          <AlertTriangle size={12} /> Missing Cost
                        </div>
                      )}
                    </div>
                    
                    {/* Plain English Explanation */}
                    <div className="flex items-start gap-2 text-muted-foreground text-sm pt-1">
                      <Info className="shrink-0 mt-0.5 text-primary/60" size={16} />
                      <p className="leading-relaxed">{suggestion.explanation}</p>
                    </div>
                  </div>

                  {/* Pricing Action */}
                  <div className="flex flex-col items-start sm:items-end bg-muted/30 p-3 rounded-lg border min-w-[140px]">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                      {hasChange ? "Suggested Action" : "Current Price"}
                    </span>
                    
                    {hasChange ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
                            {fmtMoney(suggestion.current_price)}
                          </span>
                          <ArrowRight size={14} className="text-muted-foreground" />
                          <span className="font-bold text-lg text-primary">{fmtMoney(suggestion.suggested_price!)}</span>
                        </div>
                        <span className={cn(
                          "text-xs font-bold px-1.5 py-0.5 rounded mt-1",
                          isRaise ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        )}>
                          {isRaise ? "Raise by " : "Lower by "}{fmtPercent(Math.abs(deltaPct))}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg tabular-nums">{fmtMoney(suggestion.current_price)}</span>
                        {suggestion.action === "Hold" && (
                          <Check size={16} className="text-success" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Missing Cost Warning Banner */}
                {suggestion.cost_missing && (
                  <div className="bg-warning/10 border-t border-warning/20 p-3 flex gap-2 items-center text-warning text-sm">
                    <AlertTriangle className="shrink-0" size={16} />
                    <p>
                      <strong>Ingredient Cost is Missing (0.00).</strong> Margin calculations and price suggestions may be inaccurate until you add recipe costs.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
