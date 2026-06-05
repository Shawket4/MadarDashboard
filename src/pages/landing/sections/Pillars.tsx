import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { useTranslation } from "react-i18next";

const KEYS = ["01", "02", "03", "04"] as const;

export default function Pillars({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();

  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("pillars.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-10 mb-10 max-w-2xl">
          <h2 className="font-bold text-navy text-[44px] leading-[1.05] tracking-[-0.025em]">
            {t("pillars.title")}
          </h2>
        </div>

        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-x-16 gap-y-10">
          {KEYS.map((k) => (
            <article key={k} className="flex flex-col">
              <div className="flex items-baseline gap-5 mb-3">
                <span className="font-bold text-terracotta text-[28px] leading-none tabular tracking-tight">
                  {t(`pillars.items.${k}.n`)}
                </span>
                <h3 className="font-bold text-navy text-[26px] leading-[1.05] tracking-[-0.015em]">
                  {t(`pillars.items.${k}.title`)}
                </h3>
              </div>
              <p className="text-navy text-[14px] leading-[1.45] font-semibold mb-2.5">
                {t(`pillars.items.${k}.lede`)}
              </p>
              <div className="w-8 h-px bg-navy/25 mb-3" />
              <p className="text-[12.5px] text-navy/65 leading-[1.6]">
                {t(`pillars.items.${k}.body`)}
              </p>
            </article>
          ))}
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
