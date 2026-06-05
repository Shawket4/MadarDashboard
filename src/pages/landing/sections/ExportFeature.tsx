import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import Browser from "@/pages/landing/components/devices/Browser";
import { useTranslation } from "react-i18next";

const DETAILS = ["01", "02", "03"] as const;

export default function ExportFeature({ pageIndex }: { pageIndex: number }) {
  const { t, i18n } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("featureExport.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="flex-1 grid grid-cols-12 gap-12 mt-10">
          <div className="col-span-5 flex flex-col justify-center">
            <h2 className="font-bold text-navy text-[36px] leading-[1.05] tracking-[-0.02em] mb-6 whitespace-pre-line">
              {t("featureExport.title")}
            </h2>
            <p className="text-[14px] text-navy/65 leading-[1.65] mb-8">
              {t("featureExport.body")}
            </p>

            <div className="space-y-5 mt-2">
              {DETAILS.map((k) => (
                <div key={k} className="flex gap-4">
                  <span className="text-terracotta font-bold text-[13px] tabular shrink-0 w-5 pt-0.5">
                    {String(parseInt(k))}
                  </span>
                  <div>
                    <h4 className="font-bold text-navy text-[13.5px] mb-1 tracking-[-0.005em]">
                      {t(`featureExport.details.${k}.title`)}
                    </h4>
                    <p className="text-[12.5px] text-navy/60 leading-[1.55]">
                      {t(`featureExport.details.${k}.body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-7 flex flex-col justify-center">
            <Browser src={i18n.language === 'ar' ? '/screenshots/feature-export-ar.png' : '/screenshots/feature-export-en.png'} className="w-full" url="sufrix.com/reports" />
          </div>
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
