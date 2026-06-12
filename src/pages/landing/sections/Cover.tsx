import Page from "@/pages/landing/components/Page";
import { meta } from "@/pages/landing/lib/tokens";
import { useTranslation } from "react-i18next";

export default function Cover() {
  const { t, i18n } = useTranslation();
  const wordmark = i18n.language === "ar" ? "/sufrix_ar.svg" : "/sufrix.svg";

  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-16">
        <header className="flex items-start justify-between">
          <img src={wordmark} alt={meta.brand} className="h-12" />
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium pt-1 tabular">
            {t("meta.publication")} · {meta.year}
          </span>
        </header>

        <div className="flex-1 flex flex-col justify-center max-w-[900px]">
          <p className="text-xs tracking-[0.36em] uppercase text-terracotta font-semibold mb-9">
            {t("cover.eyebrow")}
          </p>
          <h1 className="font-extrabold text-navy text-[86px] leading-[0.98] rtl:leading-[1.4] tracking-[-0.035em] whitespace-pre-line">
            {t("cover.headline")}
          </h1>
        </div>

        <footer className="flex items-end justify-between gap-16">
          <p className="text-[14.5px] text-navy/65 max-w-[560px] leading-[1.65]">
            {t("cover.subtitle")}
          </p>
          <div className="flex items-center gap-2.5 text-xs tracking-[0.32em] uppercase text-navy/55 font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
            <span>{meta.domain}</span>
          </div>
        </footer>
      </div>
    </Page>
  );
}
