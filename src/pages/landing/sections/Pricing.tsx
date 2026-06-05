import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

const TIERS = ["essential", "advanced"] as const;
const PLANS = ["1mo", "3mo", "6mo", "12mo"] as const;

export default function Pricing({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-10">
        <header className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("pricing.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-2 mb-4 max-w-2xl shrink-0">
          <h2 className="font-bold text-navy text-[44px] leading-[1.05] tracking-[-0.025em] whitespace-pre-line">
            {t("pricing.title")}
          </h2>
          <p className="text-[14px] text-navy/65 leading-[1.65] mt-2 max-w-xl">
            {t("pricing.lede")}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-10 items-start max-w-5xl min-h-0">
          {TIERS.map((tier) => (
            <div 
              key={tier} 
              className={`relative overflow-hidden rounded-2xl p-6 transition-transform hover:-translate-y-1 ${
                tier === "advanced" 
                  ? "bg-navy text-cream shadow-2xl shadow-navy/20" 
                  : "bg-cream/40 border border-navy/10 shadow-sm"
              }`}
            >
              {tier === "advanced" && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 rounded-full" />
              )}
              
              <h3 className={`font-bold text-[28px] mb-2 tracking-tight ${tier === "advanced" ? "text-cream" : "text-navy"}`}>
                {t(`pricing.tiers.${tier}.name`)}
              </h3>
              <p className={`text-[15px] font-semibold mb-5 ${tier === "advanced" ? "text-terracotta" : "text-terracotta"}`}>
                {t(`pricing.tiers.${tier}.price`)}
              </p>
              
              <div className="space-y-2 mb-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier === "advanced" ? "text-terracotta" : "text-terracotta"}`} strokeWidth={3} />
                    <span className={`text-[14px] leading-[1.4] ${tier === "advanced" ? "text-cream/80" : "text-navy/70"}`}>
                      {t(`pricing.tiers.${tier}.features.${i}`)}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`pt-5 border-t ${tier === "advanced" ? "border-cream/10" : "border-navy/5"}`}>
                <div className="space-y-3">
                  {PLANS.map((plan) => (
                    <div key={plan} className="flex justify-between items-center">
                      <span className={`text-[13.5px] font-medium ${tier === "advanced" ? "text-cream/60" : "text-navy/60"}`}>
                        {t(`pricing.tiers.${tier}.plans.${plan}.label`)}
                      </span>
                      <span className={`text-[14.5px] font-bold tabular ${tier === "advanced" ? "text-cream" : "text-navy"}`}>
                        {t(`pricing.tiers.${tier}.plans.${plan}.value`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
