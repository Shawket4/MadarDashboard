/**
 * Where else to find the shop — the links printed on a customer's wallet pass.
 *
 * The list is CLOSED and its order is the order a card prints them in. The
 * server validates the same closed list and rejects anything that is not an
 * `https` URL with a 400, because these end up as tappable links on a pass: a
 * field that renders whatever was typed can be made to say anything. Validating
 * here as well is not a second opinion, it is so a shop finds out in the field
 * it typed rather than in a toast.
 *
 * One definition, used by both places an org is edited — the super admin's org
 * dialog and the shop's own brand settings. A seven-field form written twice is
 * a seven-field form that disagrees with itself within a release.
 */
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useFormContext, type FieldValues } from "react-hook-form";
import {
  Camera,
  Globe,
  MessageCircle,
  Music,
  Play,
  ThumbsUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { OrgSocialLinks } from "@/data/api/generated/models/orgSocialLinks";

/**
 * The platforms, in the order a card prints them.
 *
 * NOTE ON THE ICONS: lucide dropped its brand icons, so there is no `Instagram`
 * or `Facebook` to reach for in this version — the whole set is gone, not just
 * the ones that lapsed. Each row therefore carries a fallback chosen to be
 * TELLABLE APART at 14px rather than to impersonate a logo, and every row is
 * labelled with the platform's name, so the glyph is decoration and not the
 * only thing identifying the field. `X` is the exception that reads correctly:
 * the platform's mark is a cross. It is decorative and never a button here, so
 * it cannot be mistaken for a "clear this row" control.
 */
export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", Icon: Camera, sample: "https://instagram.com/yourshop" },
  { key: "facebook", label: "Facebook", Icon: ThumbsUp, sample: "https://facebook.com/yourshop" },
  { key: "tiktok", label: "TikTok", Icon: Music, sample: "https://tiktok.com/@yourshop" },
  { key: "x", label: "X", Icon: X, sample: "https://x.com/yourshop" },
  { key: "youtube", label: "YouTube", Icon: Play, sample: "https://youtube.com/@yourshop" },
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, sample: "https://wa.me/201234567890" },
  { key: "website", label: "Website", Icon: Globe, sample: "https://yourshop.com" },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  Icon: LucideIcon;
  sample: string;
}>;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["key"];

/**
 * `https` and nothing else — the same rule the server holds to.
 *
 * `http` is refused rather than upgraded: silently rewriting what a shop typed
 * would mean the field shows one address and the pass carries another.
 */
export const isHttpsUrl = (value: string): boolean => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.hostname.length > 0;
};

/** One link field: empty (which removes it) or a full `https://` address. */
const linkField = (t: TFunction) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === "" || isHttpsUrl(v),
      t("orgs.socialInvalid", "Use the full address, starting with https://"),
    );

/** The `social` branch of a form schema. Compose it into the parent object. */
export const socialLinksSchema = (t: TFunction) => {
  const link = linkField(t);
  return z.object({
    instagram: link,
    facebook: link,
    tiktok: link,
    x: link,
    youtube: link,
    whatsapp: link,
    website: link,
  });
};

export type SocialLinksValues = z.infer<ReturnType<typeof socialLinksSchema>>;

/** Whatever the server holds, as form defaults. Anything unrecognised is dropped. */
export function socialLinksToForm(saved: OrgSocialLinks | null | undefined): SocialLinksValues {
  const read = (key: SocialPlatform): string => {
    const value = saved?.[key];
    return typeof value === "string" ? value : "";
  };
  return {
    instagram: read("instagram"),
    facebook: read("facebook"),
    tiktok: read("tiktok"),
    x: read("x"),
    youtube: read("youtube"),
    whatsapp: read("whatsapp"),
    website: read("website"),
  };
}

/**
 * What to send.
 *
 * A key is included when it has a value, or when it HAD one and has been
 * emptied — an empty value is how a link is removed, and a key that is simply
 * absent is not a removal. Platforms that were never set stay out of the
 * request entirely, so a shop with one Instagram link does not write six empty
 * strings into its own row.
 */
export function socialLinksPatch(
  values: SocialLinksValues,
  saved: OrgSocialLinks | null | undefined,
): Record<string, string> {
  const patch: Record<string, string> = {};
  for (const { key } of SOCIAL_PLATFORMS) {
    const next = values[key].trim();
    const previous = saved?.[key];
    const had = typeof previous === "string" && previous.trim() !== "";
    if (next) patch[key] = next;
    else if (had) patch[key] = "";
  }
  return patch;
}

/**
 * The seven fields, for a form whose schema includes `social`.
 *
 * Reads the form off context rather than taking a `control` prop: both hosts
 * already wrap their fields in `<Form {...form}>` (which is RHF's provider),
 * and threading a generic `Control` through two differently-shaped schemas buys
 * nothing but type gymnastics.
 */
export function SocialLinksFields() {
  const { t } = useTranslation();
  const form = useFormContext<FieldValues>();

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{t("orgs.socialLinks", "Where else to find you")}</p>
        <p className="text-xs text-muted-foreground">
          {t(
            "orgs.socialLinksHint",
            "These print on your customers' loyalty cards. Paste the full address, starting with https://. Clear a box to remove that link.",
          )}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map(({ key, label, Icon, sample }) => (
          <FormField
            key={key}
            control={form.control}
            name={`social.${key}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {t(`orgs.social.${key}`, label)}
                </FormLabel>
                <FormControl>
                  {/* A URL is LTR in every language: left to itself in an Arabic
                      form the scheme and the path swap ends on screen. */}
                  <Input
                    {...field}
                    value={typeof field.value === "string" ? field.value : ""}
                    dir="ltr"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    placeholder={sample}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
