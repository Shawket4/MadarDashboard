import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { useTranslation } from "react-i18next";

const SECTIONS = ["01", "02", "03"] as const;

/**
 * Page 10 — Smart pricing.
 * Two-column: text + numbered details on left, stylized
 * "suggestion card" mockup on the right so the page shows the engine
 * in action without needing a real screenshot.
 */
export default function SmartPricing({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("smartPricing.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-4 mb-4 max-w-3xl">
          <h2 className="font-bold text-navy text-[44px] leading-[1.02] rtl:leading-[1.25] tracking-[-0.025em] whitespace-pre-line">
            {t("smartPricing.title")}
          </h2>
          <p className="mt-5 text-[14px] text-navy/65 leading-[1.65] max-w-2xl">
            {t("smartPricing.lede")}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-12 mt-4">
          {/* Left — three sections */}
          <div className="col-span-7 flex flex-col justify-center space-y-7">
            {SECTIONS.map((k) => (
              <article key={k} className="flex gap-5">
                <span className="text-terracotta font-bold text-[22px] leading-none tabular tracking-tight shrink-0 w-7 pt-1">
                  {t(`smartPricing.sections.${k}.n`)}
                </span>
                <div>
                  <h3 className="font-bold text-navy text-[16px] leading-[1.2] tracking-[-0.01em] mb-2">
                    {t(`smartPricing.sections.${k}.title`)}
                  </h3>
                  <p className="text-[12.5px] text-navy/65 leading-[1.6]">
                    {t(`smartPricing.sections.${k}.body`)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Right — suggestion card mockup */}
          <div className="col-span-5 flex items-center">
            <div
              className="w-full bg-cream p-7 relative"
              style={{
                borderRadius: "12px",
                boxShadow:
                  "0 20px 40px -16px rgba(10, 37, 64, 0.18), 0 0 0 1px rgba(10, 37, 64, 0.08)",
              }}
            >
              {/* Item header */}
              <div className="flex items-baseline justify-between mb-1">
                <h4 className="font-bold text-navy text-[20px] tracking-[-0.015em]">
                  {t("smartPricing.card.title")}
                </h4>
                <span className="text-xs tracking-[0.22em] uppercase text-navy/40 font-semibold tabular">
                  {t("smartPricing.card.currentLabel")}
                </span>
              </div>
              <div className="text-navy/60 text-[14px] tabular mb-5">
                {t("smartPricing.card.currentValue")}
              </div>

              <div className="border-t border-navy/10 pt-4 space-y-3">
                <Row
                  label={t("smartPricing.card.velocityLabel")}
                  value={t("smartPricing.card.velocityValue")}
                />
                <Row
                  label={t("smartPricing.card.marginLabel")}
                  value={t("smartPricing.card.marginValue")}
                />
              </div>

              {/* Suggestion strip */}
              <div className="mt-5 -mx-7 -mb-7 px-7 py-4 bg-navy rounded-b-[12px]">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[9.5px] tracking-[0.24em] uppercase text-cream/55 font-semibold">
                    {t("smartPricing.card.suggestionLabel")}
                  </span>
                  <span className="text-xs tracking-[0.18em] uppercase text-terracotta font-bold tabular">
                    {t("smartPricing.card.impactValue")}
                  </span>
                </div>
                <div className="text-cream font-bold text-[18px] tracking-[-0.01em] mt-1 tabular">
                  {t("smartPricing.card.suggestionValue")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10.5px] tracking-[0.22em] uppercase text-navy/45 font-semibold">
        {label}
      </span>
      <span className="text-navy text-[13px] font-semibold tabular">{value}</span>
    </div>
  );
}
