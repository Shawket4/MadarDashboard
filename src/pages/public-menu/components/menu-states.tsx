import { useTranslation } from "react-i18next";
import { Coffee } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

/** First-paint loading placeholder mirroring the real layout. */
export function MenuSkeleton() {
  const { i18n } = useTranslation();
  return (
    <div
      dir={i18n.dir()}
      className="public-menu-root max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500"
    >
      <div className="flex items-center gap-4 mt-6">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>
      <div className="space-y-12">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-[2rem]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-screen error state with a refresh action. */
export function MenuError() {
  const { t, i18n } = useTranslation();
  return (
    <div
      dir={i18n.dir()}
      className="public-menu-root min-h-screen flex items-center justify-center p-4 bg-slate-50"
    >
      <div className="text-center space-y-6 max-w-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="h-24 w-24 bg-white shadow-sm rounded-3xl flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
          <Coffee size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">{t("menu.errors.title")}</h2>
          <p className="text-slate-500">{t("menu.errors.body")}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("menu.errors.refresh")}
        </Button>
      </div>
    </div>
  );
}
