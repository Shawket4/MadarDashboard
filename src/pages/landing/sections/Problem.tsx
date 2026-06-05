import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { useTranslation } from "react-i18next";

const KEYS = ["01", "02", "03", "04"] as const;

export default function Problem({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("problem.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-10 mb-10 max-w-3xl">
          <h2 className="font-bold text-navy text-[44px] leading-[1.05] tracking-[-0.025em]">
            {t("problem.title")}
          </h2>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-16 gap-y-8">
          {KEYS.map((k) => (
            <article key={k} className="flex gap-5">
              <span className="font-bold text-terracotta text-[28px] leading-none tabular tracking-tight shrink-0 w-8 pt-1">
                {t(`problem.items.${k}.n`)}
              </span>
              <div>
                <h3 className="font-bold text-navy text-[18px] leading-[1.25] tracking-[-0.01em] mb-2.5">
                  {t(`problem.items.${k}.title`)}
                </h3>
                <p className="text-[13px] text-navy/65 leading-[1.6]">
                  {t(`problem.items.${k}.body`)}
                </p>
              </div>
            </article>
          ))}
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
