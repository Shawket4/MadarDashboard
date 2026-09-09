/**
 * The logo a generated spreadsheet wears.
 *
 * The shop's own when it is on the branding tier, and `undefined` otherwise —
 * which the Excel engine reads as "use Madar's". Read through the tier-gated
 * public brand endpoint rather than the org row, so a shop that has uploaded a
 * logo but has not been given the tier cannot end up with it on a file.
 *
 * One hook rather than each export deciding, because "remember to check the
 * flag" across thirty-odd export buttons is a rule that gets missed once and
 * then ships a shop's mark on a tier it did not buy.
 */
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { useOrgId } from "@/hooks/use-org-id";

export function useExportLogo(): string | undefined {
  const brand = usePublicBrand(useOrgId());
  return brand?.ownBranding ? (brand.logoUrl ?? undefined) : undefined;
}
