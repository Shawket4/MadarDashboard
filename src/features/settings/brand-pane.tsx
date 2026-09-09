/**
 * The organisation's own look — its mark, its card image, and where else to
 * find it.
 *
 * Deliberately narrow. Name, currency, tax rate and the rest stay super-admin
 * territory; this exists so a shop can change the things that are THEIRS
 * without filing a request, because they are on their receipts, their loyalty
 * cards and their customers' wallet passes. A shop should not need a support
 * ticket to fix a moved Instagram handle.
 *
 * There are no colour controls and there should not be: the card's palette is
 * DERIVED from this image when it uploads (`orgs::branding`), which means a
 * shop cannot pick two colours nobody can read, and the card and the logo can
 * never disagree about what the brand is.
 */
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useOrgId } from "@/hooks/use-org-id";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page";
import { ImageUploader } from "@/components/app/image-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrg, updateOrg, uploadOrgCardImage, uploadOrgLogo } from "@/data/api/generated/api";
import type { Org } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SocialLinksFields,
  socialLinksPatch,
  socialLinksSchema,
  socialLinksToForm,
} from "@/features/orgs/social-links";

import { ShopAddressCard } from "./shop-address-card";

import { resolveBrand } from "@/features/loyalty/shared/brand";
import { CardFace } from "@/features/loyalty/public/card-face";

export function BrandPane() {
  const { t, i18n } = useTranslation();
  // The scoped org, not the token's: a super admin's token carries none, and
  // reading it directly left them looking at an empty shop on a page they are
  // entitled to use.
  const orgId = useOrgId() ?? "";
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

  const uploadCardImage = async (file: File): Promise<string> => {
    try {
      const updated = await uploadOrgCardImage(orgId, { image: file });
      await queryClient.invalidateQueries({ queryKey: ["org-brand", orgId] });
      toast.success(t("settings.cardImageSaved", "Card image updated"));
      return updated.brand_card_image ?? "";
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
      card_image_url: org.data?.brand_card_image ?? null,
      background_color: org.data?.brand_background ?? null,
      foreground_color: org.data?.brand_foreground ?? null,
      label_color: org.data?.brand_accent ?? null,
    },
    i18n.resolvedLanguage ?? "en",
  );

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title={t("settings.brand", "Brand")}
        description={t(
          "settings.brandDesc",
          "Your mark and your links, on receipts and on your customers' loyalty cards.",
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

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-medium">
              {t("settings.cardImage", "Card image")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "settings.cardImageHint",
                "A wide photo across the customer's card, in Apple Wallet and Google Wallet alike. It is cropped to a band, so put the subject in the middle. Optional.",
              )}
            </p>
          </div>
          <ImageUploader value={org.data?.brand_card_image} onUpload={uploadCardImage} />
        </CardContent>
      </Card>

      {org.data ? (
        <ShopAddressCard slug={org.data.slug} customBranding={org.data.custom_branding} />
      ) : null}

      {org.data ? <SocialLinksCard org={org.data} /> : null}

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

/**
 * Where else to find the shop.
 *
 * Its own component so the form's hooks live below the pane's loading branch
 * and reset cleanly when the org read lands — the pane returns a skeleton
 * before `org.data` exists, and a form declared above that would have to be
 * written around it.
 *
 * The same seven fields the super admin's org dialog shows, from the same
 * definition. Saving them is `PATCH /orgs/{id}` with nothing but
 * `social_links`, so this cannot touch a field a manager is not entitled to.
 */
function SocialLinksCard({ org }: { org: Org }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const schema = useMemo(() => z.object({ social: socialLinksSchema(t) }), [t]);
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { social: socialLinksToForm(org.social_links) },
  });

  const saved = org.social_links;
  useEffect(() => {
    form.reset({ social: socialLinksToForm(saved) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      await updateOrg(org.id, { social_links: socialLinksPatch(v.social, org.social_links) });
      await queryClient.invalidateQueries({ queryKey: ["org-brand", org.id] });
      toast.success(t("settings.socialSaved", "Links updated"));
    } catch (e) {
      // The server holds the same closed list and the same https rule, and it
      // is the one that decides. Whatever it objects to, the shop hears it.
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <SocialLinksFields />
            <div className="flex justify-end">
              <Button type="submit" loading={busy}>
                {t("common.save", "Save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
