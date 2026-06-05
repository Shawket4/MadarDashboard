import { useTranslation } from "react-i18next";
import { useListPublicOrgs } from "@/shared/api/generated/api";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

export function TrustedBy() {
  const { t } = useTranslation();
  const { data: orgs, isLoading } = useListPublicOrgs();

  if (isLoading) {
    return (
      <section className="py-20 bg-cream flex flex-col items-center justify-center">
        <p className="text-sm uppercase tracking-wider text-navy/50 font-bold mb-8">Trusted by</p>
        <div className="flex gap-8 overflow-hidden opacity-50">
           <Skeleton className="w-24 h-12" />
           <Skeleton className="w-24 h-12" />
           <Skeleton className="w-24 h-12" />
        </div>
      </section>
    );
  }

  if (!orgs || orgs.length === 0) return null;

  return (
    <section className="py-20 bg-cream flex flex-col items-center justify-center border-y border-navy/5">
      <p className="text-sm uppercase tracking-wider text-navy/50 font-bold mb-10">Trusted by</p>
      <TooltipProvider delayDuration={100}>
        <div className="flex flex-wrap justify-center gap-12 px-4 max-w-4xl mx-auto">
          {orgs.map((org) => (
            <Tooltip key={org.name}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100 cursor-help">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="h-16 w-auto object-contain max-w-[120px]" />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xl font-bold text-navy">{org.name}</div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-navy text-cream border-none shadow-lg px-4 py-3 text-center">
                <p className="font-bold text-lg mb-1">{org.name}</p>
                {org.created_at && (
                  <p className="text-xs text-cream/70 mb-1">
                    {t("landing.trustedBy.since", "Since")} {new Date(org.created_at).getFullYear()}
                  </p>
                )}
                {org.address && (
                  <p className="text-sm mb-1 text-cream/90">{org.address}</p>
                )}
                {org.branch_count !== undefined && (
                  <p className="text-xs font-semibold text-terracotta mt-1">
                    {org.branch_count} {org.branch_count === 1 ? t("landing.trustedBy.branch", "Branch") : t("landing.trustedBy.branches", "Branches")}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </section>
  );
}
