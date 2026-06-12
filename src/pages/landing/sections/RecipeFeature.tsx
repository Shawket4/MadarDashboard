import Page from "@/pages/landing/components/Page";
import PageFooter from "@/pages/landing/components/PageFooter";
import IPad from "@/pages/landing/components/devices/IPad";
import { useTranslation } from "react-i18next";

const DETAILS = ["01", "02"] as const;

export default function RecipeFeature({ pageIndex }: { pageIndex: number }) {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="absolute inset-0 flex flex-col px-20 py-14">
        <header className="flex items-center justify-between">
          <span className="text-xs tracking-[0.32em] uppercase text-navy/50 font-medium">
            {t("featureRecipe.eyebrow")}
          </span>
          <img src="/Icon.svg" alt="" className="h-9" aria-hidden />
        </header>

        <div className="flex-1 grid grid-cols-12 gap-12 mt-10">
          <div className="col-span-5 flex flex-col justify-center">
            <h2 className="font-bold text-navy text-[36px] leading-[1.05] tracking-[-0.02em] mb-6 whitespace-pre-line">
              {t("featureRecipe.title")}
            </h2>
            <p className="text-[14px] text-navy/65 leading-[1.65] mb-8">
              {t("featureRecipe.body")}
            </p>

            <div className="space-y-5 mt-2">
              {DETAILS.map((k) => (
                <div key={k} className="flex gap-4">
                  <span className="text-terracotta font-bold text-[13px] tabular shrink-0 w-5 pt-0.5">
                    {String(parseInt(k))}
                  </span>
                  <div>
                    <h4 className="font-bold text-navy text-[13.5px] mb-1 tracking-[-0.005em]">
                      {t(`featureRecipe.details.${k}.title`)}
                    </h4>
                    <p className="text-[12.5px] text-navy/60 leading-[1.55]">
                      {t(`featureRecipe.details.${k}.body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-7 flex flex-col justify-center">
            <IPad src="/screenshots/feature-recipe.png" className="w-full" />
          </div>
        </div>

        <PageFooter page={pageIndex} />
      </div>
    </Page>
  );
}
