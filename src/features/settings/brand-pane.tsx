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
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page";
import { ImageUploader } from "@/components/app/image-uploader";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrg, updateOrg, uploadOrgLogo } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { resolveBrand } from "@/features/loyalty/brand";
import { CardFace } from "@/features/loyalty/card-face";

export function BrandPane() {
  const { t, i18n } = useTranslation();
  const orgId = useAuthStore((s) => s.user?.org_id) ?? "";
  const isSuperAdmin = useAuthStore((s) => s.user?.role) === "super_admin";
  const queryClient = useQueryClient();

  /// Super admin only — the endpoint enforces it too, and this is the visible
  /// half of that.
  const setTier = async (on: boolean) => {
    try {
      await updateOrg(orgId, { custom_branding: on });
      await queryClient.invalidateQueries({ queryKey: ["org-brand", orgId] });
      toast.success(t("settings.saved", "Saved"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

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
      logo_is_mark: org.data?.brand_logo_is_mark ?? false,
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

      {org.data && !org.data.custom_branding ? (
        // Said plainly, and next to the preview it explains. The alternative is
        // a manager uploading a logo, seeing Madar's colours, and reporting it
        // as a bug — which is what a silent tier gate produces.
        <div className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/40 p-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("settings.brandTierOff", "Custom branding is not enabled")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "settings.brandTierOffHint",
                "Your logo still appears on receipts. Customer cards and the signup page use Madar's colours until custom branding is switched on for your organisation — talk to us about it.",
              )}
            </p>
          </div>
        </div>
      ) : null}

      {isSuperAdmin && org.data ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("settings.brandTier", "Custom branding (super admin)")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "settings.brandTierHint",
                "Lets this organisation put its own logo and colours on customer cards and the signup page. Madar stays in the footer either way.",
              )}
            </p>
          </div>
          <Switch
            checked={org.data.custom_branding}
            onCheckedChange={(v) => void setTier(v)}
          />
        </div>
      ) : null}

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
