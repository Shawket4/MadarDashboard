/**
 * The organisation's logo — the one piece of an organisation a manager owns.
 *
 * Logo only, deliberately. Name, currency, tax rate and the rest stay
 * super-admin territory; this exists so a shop can change its own mark without
 * filing a request, because the mark is theirs and it is on their receipts and
 * their loyalty cards.
 *
 * There are no colour controls and there should not be: the card's palette is
 * DERIVED from this image when it uploads (`orgs::branding`), which means a
 * shop cannot pick two colours nobody can read, and the card and the logo can
 * never disagree about what the brand is.
 */
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page";
import { ImageUploader } from "@/components/app/image-uploader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrg, uploadOrgLogo } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { resolveBrand } from "@/features/loyalty/brand";
import { CardFace } from "@/features/loyalty/card-face";

export function BrandPane() {
  const { t, i18n } = useTranslation();
  const orgId = useAuthStore((s) => s.user?.org_id) ?? "";
  const queryClient = useQueryClient();

  const org = useQuery({
    queryKey: ["org-brand", orgId],
    queryFn: () => getOrg(orgId),
    enabled: !!orgId,
  });

  if (org.isLoading) return <Skeleton className="h-64 w-full" />;

  const upload = async (file: File): Promise<string> => {
    try {
      const updated = await uploadOrgLogo(orgId, { logo: file });
      // The palette is re-derived server-side on upload, so the preview below
      // must come from a fresh read rather than an optimistic guess.
      await queryClient.invalidateQueries({ queryKey: ["org-brand", orgId] });
      toast.success(t("settings.logoSaved", "Logo updated"));
      return updated.logo_url ?? "";
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  // The preview is the REAL card component with the real derived colours, not a
  // mock-up: a preview that renders differently from the thing it previews is
  // worse than none.
  const brand = resolveBrand(
    {
      org_name: org.data?.name ?? "",
      program_name: t("nav.loyalty", "Rewards"),
      program_name_ar: null,
      logo_url: org.data?.logo_url ?? null,
      background_color: org.data?.brand_background ?? null,
      foreground_color: org.data?.brand_foreground ?? null,
      label_color: org.data?.brand_accent ?? null,
    },
    i18n.resolvedLanguage ?? "en",
  );

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title={t("settings.brand", "Logo")}
        description={t(
          "settings.brandDesc",
          "Your mark, on receipts and on your customers' loyalty cards.",
        )}
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <ImageUploader
            value={org.data?.logo_url}
            onUpload={upload}
            hint={t(
              "settings.logoHint",
              "PNG or JPG, square works best. The card's colours are taken from it automatically.",
            )}
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          {t("settings.cardPreview", "How the loyalty card will look")}
        </p>
        <CardFace
          brand={brand}
          mode="visits"
          balance={3}
          target={5}
          toGo={2}
          canRedeem={false}
          memberName={t("settings.previewMember", "Member name")}
        />
        <p className="text-xs text-muted-foreground">
          {t(
            "settings.brandDerived",
            "Colours are read from your logo and adjusted so the text stays readable. Upload a new logo to change them.",
          )}
        </p>
      </div>
    </div>
  );
}
