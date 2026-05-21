import { AlertCircle, Tag, PackagePlus, Trash2, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";

import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { useAdvisorReport } from "../api/service";
import { PriceSuggestionList } from "./price-suggestion-list";
import { BundleSuggestionGrid } from "./bundle-suggestion-grid";

export default function MenuAdvisorDashboard() {
  const { orgId } = useCurrentContext();
  
  // Hardcoded to 30 days window for now, could be controlled via a date picker
  const windowDays = 30;
  const { data: report, isLoading, error } = useAdvisorReport(orgId || undefined, windowDays);

  if (isLoading) {
    return (
      <PageShell title="Menu Insights" description="Analyzing your menu performance...">
         <div className="space-y-8 animate-pulse">
           <div className="h-64 bg-muted/50 rounded-2xl border"></div>
           <div className="h-64 bg-muted/50 rounded-2xl border"></div>
         </div>
      </PageShell>
    );
  }

  if (error || !report) {
    return (
      <PageShell title="Menu Insights" description="Smart recommendations to boost profit">
         <div className="p-8 text-center text-danger bg-danger/10 border border-danger/20 rounded-xl flex flex-col items-center gap-2">
           <AlertCircle />
           <p>Failed to load menu insights. Please try again later.</p>
         </div>
      </PageShell>
    );
  }

  // Filter actions for sections
  const pricingSuggestions = report.price_suggestions.filter(s => s.action === "RaisePrice" || s.action === "LowerPrice");
  const pruningSuggestions = report.price_suggestions.filter(s => s.action === "Remove" || s.action === "Reformulate");
  const stableSuggestions = report.price_suggestions.filter(s => s.action === "Hold" || s.action === "Monitor");

  return (
    <PageShell 
      title="Menu Insights" 
      description={`Based on the last ${report.window_days} days of sales. Analyzed ${report.items_sufficient} out of ${report.items_total} items.`}
    >
      <div className="space-y-10 pb-12 max-w-5xl">
        
        {/* Section 1: Quick Pricing Wins */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Tag className="text-primary" size={20} />
            <h2 className="text-xl font-bold tracking-tight">Quick Pricing Wins</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Immediate adjustments you can make to capitalize on popular items or stimulate sales for underperformers.
          </p>
          <PriceSuggestionList suggestions={pricingSuggestions} />
        </section>

        {/* Section 2: Bundle Opportunities */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <PackagePlus className="text-emerald-500" size={20} />
            <h2 className="text-xl font-bold tracking-tight">Menu Pairings & Bundles</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Create these combos to boost your average order value based on items that are frequently bought together.
          </p>
          <BundleSuggestionGrid suggestions={report.bundle_suggestions} />
        </section>

        {/* Section 3: Menu Cleanup (Pruning) */}
        {pruningSuggestions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Trash2 className="text-danger" size={20} />
              <h2 className="text-xl font-bold tracking-tight">Menu Cleanup</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              These items are dragging down your profitability and confusing customers. Consider removing them.
            </p>
            <PriceSuggestionList suggestions={pruningSuggestions} removals={report.removal_scenarios} />
          </section>
        )}

        {/* Section 4: Performing Well */}
        <section className="space-y-4 pt-8">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <CheckCircle2 className="text-muted-foreground" size={20} />
            <h2 className="text-xl font-bold tracking-tight text-muted-foreground">Stable Items</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            These items are priced correctly or don't have enough recent sales data to justify a change. No action needed right now.
          </p>
          <div className="opacity-80">
            <PriceSuggestionList suggestions={stableSuggestions} isStableSection />
          </div>
        </section>

      </div>
    </PageShell>
  );
}
