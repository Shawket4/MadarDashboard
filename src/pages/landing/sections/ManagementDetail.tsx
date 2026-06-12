import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import BrowserMinimal from "@/pages/landing/components/devices/BrowserMinimal";
import { useTranslation } from "react-i18next";

const DETAILS = ["01", "02", "03"] as const;

export default function ManagementDetail({ pageIndex }: { pageIndex: number }) {
  const { t, i18n } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("managementDetail.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="flex-1 grid grid-cols-12 gap-12 mt-4">
          <div className="col-span-6 flex flex-col">
            <h2 className="font-bold text-navy text-[36px] leading-[1.05] tracking-[-0.02em] mb-6">
              {t("managementDetail.title")}
            </h2>
            <p className="text-[14px] text-navy/65 leading-[1.65] mb-4">
              {t("managementDetail.body")}
            </p>

            <div className="space-y-4 mt-2">
              {DETAILS.map((k) => (
                <div key={k} className="flex gap-4">
                  <span className="text-terracotta font-bold text-[13px] tabular shrink-0 w-5 pt-0.5">
                    {String(parseInt(k))}
                  </span>
                  <div>
                    <h4 className="font-bold text-navy text-[13.5px] mb-1 tracking-[-0.005em]">
                      {t(`managementDetail.details.${k}.title`)}
                    </h4>
                    <p className="text-[12.5px] text-navy/60 leading-[1.55]">
                      {t(`managementDetail.details.${k}.body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-6 relative h-[480px]">
            {/* Background mockup */}
            <div className="absolute top-0 right-0 w-[85%] z-10 transition-transform duration-500 hover:-translate-y-2">
              <div className="rounded-[10px] overflow-hidden shadow-[0_20px_40px_-12px_rgba(10,37,64,0.15)] ring-1 ring-navy/5">
                <BrowserMinimal
                  title={t("managementDetail.details.02.title")}
                  src={i18n.language === 'ar' ? '/screenshots/dashboard-inventory-ar.png' : '/screenshots/dashboard-inventory-en.png'}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Foreground mockup */}
            <div className="absolute bottom-4 left-0 w-[90%] z-20 transition-transform duration-500 hover:-translate-y-2">
              <div className="rounded-[10px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(10,37,64,0.3)] ring-1 ring-navy/10 bg-cream">
                <BrowserMinimal
                  title={t("managementDetail.details.03.title")}
                  src={i18n.language === 'ar' ? '/screenshots/dashboard-shifts-ar.png' : '/screenshots/dashboard-shifts-en.png'}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
