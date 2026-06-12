import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { useTranslation } from "react-i18next";

const SECTIONS = ["01", "02"] as const;

/**
 * Page 11 — Built to flex.
 * Two horizontal sections: Talabat integration (current) and Smart
 * bundles (with a roadmap badge — honest positioning).
 */
export default function BuiltToFlex({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("builtToFlex.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-4 mb-2 max-w-3xl">
          <h2 className="font-bold text-navy text-[44px] leading-[1.02] rtl:leading-[1.25] tracking-[-0.025em] whitespace-pre-line">
            {t("builtToFlex.title")}
          </h2>
          <p className="mt-5 text-[14px] text-navy/65 leading-[1.65] max-w-2xl">
            {t("builtToFlex.lede")}
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-10 mt-4">
          {SECTIONS.map((k) => {
            const badge = t(`builtToFlex.sections.${k}.badge`, {
              defaultValue: "",
            });
            return (
              <article
                key={k}
                className="grid grid-cols-12 gap-8 pb-8 border-b border-navy/10 last:border-b-0 last:pb-0"
              >
                <div className="col-span-1 flex items-start">
                  <span className="text-terracotta font-bold text-[44px] leading-none tabular tracking-tight">
                    {t(`builtToFlex.sections.${k}.n`)}
                  </span>
                </div>
                <div className="col-span-11">
                  <div className="flex items-baseline gap-4 mb-3 flex-wrap">
                    <h3 className="font-bold text-navy text-[26px] leading-[1.1] tracking-[-0.015em]">
                      {t(`builtToFlex.sections.${k}.title`)}
                    </h3>
                    {badge && (
                      <span className="inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.2em] uppercase font-bold text-terracotta border border-terracotta/50 rounded-full px-2.5 py-1">
                        <span className="w-1 h-1 rounded-full bg-terracotta" />
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[13.5px] text-navy/65 leading-[1.7] max-w-[640px]">
                    {t(`builtToFlex.sections.${k}.body`)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
