import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import Browser from "@/pages/landing/components/devices/Browser";
import { useTranslation } from "react-i18next";

export default function ManagementHero({ pageIndex }: { pageIndex: number }) {
  const { t, i18n } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("managementHero.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-0 mb-4 max-w-2xl">
          <h2 className="font-bold text-navy text-[44px] leading-[1.05] tracking-[-0.025em] whitespace-pre-line">
            {t("managementHero.title")}
          </h2>
        </div>

        <div className="relative mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm mt-4 w-full min-h-0 overflow-hidden">
          <div className="overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10 h-full flex flex-col">
            <Browser 
            src={i18n.language === 'ar' ? '/screenshots/dashboard-hero-ar.png' : '/screenshots/dashboard-hero-en.png'} 
            className="w-full object-cover object-top" 
            url="sufrix.com" />
          </div>
        </div>

        <p className="text-xs tracking-[0.24em] uppercase text-navy/45 font-semibold mt-6 mb-4">
          {t("managementHero.caption")}
        </p>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
