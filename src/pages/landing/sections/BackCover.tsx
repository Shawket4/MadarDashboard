import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { meta } from "@/pages/landing/lib/tokens";
import { useTranslation } from "react-i18next";

export default function BackCover({ pageIndex }: { pageIndex: number }) {
  const { t, i18n } = useTranslation();
  const wordmark = i18n.language === "ar" ? "/sufrix_ar.svg" : "/sufrix.svg";
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-16">
        <header className="flex items-start justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("backCover.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-12" aria-hidden />
        </header>

        <div className="flex-1 flex flex-col justify-center max-w-[760px]">
          <h2 className="font-extrabold text-navy text-[64px] leading-[0.98] rtl:leading-[1.4] tracking-[-0.03em] whitespace-pre-line mb-8">
            {t("backCover.title")}
          </h2>
          <p className="text-[14.5px] text-navy/65 leading-[1.7] max-w-[560px]">
            {t("backCover.body")}
          </p>
        </div>

        <div className="flex items-end justify-between gap-12 pt-8 border-t border-navy/10">
          <div className="flex flex-col gap-2">
            <img src={wordmark} alt={meta.brand} className="h-12" />
            <span className="text-xs tracking-[0.32em] uppercase text-navy/55 font-medium mt-1.5">
              {t("backCover.edition")}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs tracking-[0.28em] uppercase text-navy/45 font-semibold">
              {t("backCover.contact")}
            </span>
            <div className="flex items-center gap-2.5 text-xs tracking-[0.24em] uppercase text-navy/70 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
              <span>{meta.domain}</span>
            </div>
          </div>
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
