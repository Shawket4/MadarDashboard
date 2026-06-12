import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import ArchitectureDiagram from "@/pages/landing/components/ArchitectureDiagram";
import { useTranslation } from "react-i18next";

export default function Product() {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("product.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-8 mb-6 flex items-end justify-between gap-12">
          <h2 className="font-bold text-navy text-[44px] leading-[1.02] tracking-[-0.025em] whitespace-pre-line">
            {t("product.title")}
          </h2>
          <p className="text-[14px] text-navy/65 leading-[1.5] max-w-[280px] font-medium">
            {t("product.lede")}
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center my-2">
          <div className="w-full max-w-[820px]">
            <ArchitectureDiagram />
          </div>
        </div>

        <p className="text-[12.5px] text-navy/65 leading-[1.6] max-w-[640px] mt-2 mb-4">
          {t("product.caption")}
        </p>

        <PageFooter page={4} />
      </div>
    </Page>
  );
}
