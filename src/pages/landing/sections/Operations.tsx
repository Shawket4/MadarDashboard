import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { useTranslation } from "react-i18next";

const SECTIONS = ["01", "02", "03"] as const;

export default function Operations({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("operations.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-6 mb-2 max-w-3xl">
          <h2 className="font-bold text-navy text-[44px] leading-[1.05] tracking-[-0.025em]">
            {t("operations.title")}
          </h2>
          <p className="mt-5 text-[14px] text-navy/65 leading-[1.65] max-w-2xl">
            {t("operations.lede")}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-10 mt-6">
          {SECTIONS.map((k, i) => (
            <article key={k} className="flex flex-col">
              <span className="text-terracotta font-bold text-[28px] leading-none tabular tracking-tight mb-5">
                {i + 1}
              </span>
              <h3 className="font-bold text-navy text-[22px] leading-[1.1] tracking-[-0.015em] mb-3">
                {t(`operations.sections.${k}.title`)}
              </h3>
              <div className="w-8 h-px bg-navy/25 mb-4" />
              <p className="text-[13px] text-navy/65 leading-[1.65]">
                {t(`operations.sections.${k}.body`)}
              </p>
            </article>
          ))}
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
