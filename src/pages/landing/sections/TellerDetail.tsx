import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import IPad from "@/pages/landing/components/devices/IPad";
import { useTranslation } from "react-i18next";

const DETAILS = ["01", "02", "03"] as const;

export default function TellerDetail({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("tellerDetail.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="flex-1 grid grid-cols-12 gap-12 mt-10">
          <div className="col-span-6 flex flex-col">
            <h2 className="font-bold text-navy text-[36px] leading-[1.05] tracking-[-0.02em] mb-6">
              {t("tellerDetail.title")}
            </h2>
            <p className="text-[14px] text-navy/65 leading-[1.65] mb-8">
              {t("tellerDetail.body")}
            </p>

            <div className="space-y-5 mt-2">
              {DETAILS.map((k) => (
                <div key={k} className="flex gap-4">
                  <span className="text-terracotta font-bold text-[13px] tabular shrink-0 w-5 pt-0.5">
                    {String(parseInt(k))}
                  </span>
                  <div>
                    <h4 className="font-bold text-navy text-[13.5px] mb-1 tracking-[-0.005em]">
                      {t(`tellerDetail.details.${k}.title`)}
                    </h4>
                    <p className="text-[12.5px] text-navy/60 leading-[1.55]">
                      {t(`tellerDetail.details.${k}.body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-6 relative h-full flex items-center">
            <div className="absolute top-0 right-0 w-[85%] z-0 translate-x-8 -translate-y-4">
              <IPad src="/screenshots/teller-detail-1.png" className="w-full shadow-2xl opacity-100 mix-blend-luminosity hover:mix-blend-normal hover:opacity-100 transition-all" />
            </div>
            <div className="relative w-[90%] z-10 mt-20">
              <IPad src="/screenshots/teller-detail-2.png" className="w-full shadow-2xl" />
            </div>
          </div>
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
