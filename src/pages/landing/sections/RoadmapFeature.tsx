import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import { useTranslation } from "react-i18next";
import { Receipt, Globe, Store, Music } from "lucide-react";

const ITEMS = [
  { id: "01", icon: Receipt },
  { id: "02", icon: Globe },
  { id: "03", icon: Store },
  { id: "04", icon: Music },
] as const;

export default function RoadmapFeature({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("roadmap.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="flex-1 mt-2 flex flex-col">
          <div className="max-w-2xl mb-2">
            <h2 className="font-bold text-navy text-[44px] leading-[1.05] tracking-[-0.025em] whitespace-pre-line mb-2">
              {t("roadmap.title")}
            </h2>
            <p className="text-[14px] text-navy/65 leading-[1.65]">
              {t("roadmap.body")}
            </p>
          </div>

          <div className="relative flex-1 w-full max-w-5xl mx-auto mt-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              {ITEMS.map((item, index) => {
                const Icon = item.icon;
                // Playful staggered layout
                const isEven = index % 2 === 0;
                
                return (
                  <div key={item.id} className={`w-full relative group flex ${isEven ? "mt-2" : "mb-2"}`}>
                    {/* Floating Card */}
                    <div className="bg-cream/50 border border-navy/5 px-6 py-4 rounded-3xl shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:bg-cream w-full relative overflow-hidden">
                      {/* Decorative background element */}
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-terracotta/5 rounded-full blur-2xl group-hover:bg-terracotta/10 transition-colors" />
                      
                      <div className="flex items-start gap-4 mb-3 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-navy/5 transform group-hover:rotate-12 transition-transform">
                          <Icon className="w-6 h-6 text-terracotta" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col flex-1 items-start pt-1">
                          <span className="bg-terracotta text-cream text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full mb-2 shadow-sm">
                            {t(`roadmap.items.${item.id}.badge`)}
                          </span>
                          <h4 className="font-bold text-navy text-[18px] tracking-[-0.01em]">
                            {t(`roadmap.items.${item.id}.title`)}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[13.5px] text-navy/70 leading-[1.65] relative z-10 pl-16">
                        {t(`roadmap.items.${item.id}.body`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
