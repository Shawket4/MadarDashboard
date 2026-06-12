import { useTranslation } from "react-i18next";
import { SearchX } from "lucide-react";

/** Shimmer skeleton for initial load */
export function MenuSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-20 space-y-10 animate-pulse">
      {/* Fake header */}
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-neutral-200" />
          <div className="w-28 h-4 rounded-full bg-neutral-200" />
        </div>
        <div className="w-10 h-10 rounded-2xl bg-neutral-200" />
      </div>

      {/* Fake category pills */}
      <div className="flex gap-2">
        {[60, 80, 56, 72].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-neutral-200" style={{ width: w }} />
        ))}
      </div>

      {/* Fake sections */}
      {[4, 3].map((count, si) => (
        <div key={si} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 rounded-full bg-neutral-200" />
            <div className="flex-1 h-px bg-neutral-100" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="aspect-[3/4] bg-neutral-100" />
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="h-3.5 rounded-full bg-neutral-100 w-3/4" />
                  <div className="h-3 rounded-full bg-neutral-100 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Generic fetch error */
export function MenuError() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center">
        <SearchX size={24} className="text-neutral-400" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-[#0A2540]">{t("menu.error.title", "Menu unavailable")}</p>
        <p className="text-sm text-neutral-500">{t("menu.error.body", "Please try again in a moment.")}</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-5 py-2.5 rounded-full bg-[#0A2540] text-white text-sm font-medium active:opacity-80"
      >
        {t("common.retry", "Retry")}
      </button>
    </div>
  );
}

/** Empty search results */
export function MenuSearchEmpty({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center">
        <SearchX size={22} className="text-neutral-300" />
      </div>
      <p className="font-semibold text-[#0A2540]">
        {t("menu.search.noResults", { query })}
      </p>
      <p className="text-sm text-neutral-400 max-w-[220px]">
        {t("menu.search.noResultsHint", "Try a different keyword")}
      </p>
    </div>
  );
}
