import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import IPad from "@/pages/landing/components/devices/IPad";
import { useTranslation } from "react-i18next";

export default function TellerHero({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("tellerHero.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="mt-4 mb-4 max-w-2xl">
          <h2 className="font-bold text-navy text-[44px] leading-[1.05] tracking-[-0.025em] whitespace-pre-line">
            {t("tellerHero.title")}
          </h2>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0">
          <IPad src="/screenshots/teller-hero.png" className="w-[520px] object-contain" />
        </div>

        <p className="text-xs tracking-[0.24em] uppercase text-navy/45 font-semibold mt-6 mb-4">
          {t("tellerHero.caption")}
        </p>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
