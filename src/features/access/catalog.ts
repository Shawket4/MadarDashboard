/**
 * The capability registry shaped for the permission screens.
 *
 * - `legacy` capabilities are never shown (they exist only so older tablets read
 *   the same permission grid).
 * - `core` capabilities are always on for their role kinds: shown locked as
 *   "Always on", never a toggle.
 * - `advanced` capabilities sit behind a collapsed "Advanced" section.
 */
import {
  CAPABILITIES,
  CAPABILITY_GROUPS,
  type Capability,
  type CapabilityMeta,
  type RoleKind,
} from "@/generated/capabilities";

export interface CatalogGroup {
  key: string;
  en: string;
  ar: string;
  main: CapabilityMeta[];
  advanced: CapabilityMeta[];
}

const BY_KEY = new Map<string, CapabilityMeta>(CAPABILITIES.map((c) => [c.key, c]));

export const metaOf = (key: string): CapabilityMeta | undefined => BY_KEY.get(key);

export const isCoreFor = (meta: CapabilityMeta, kind: string | null | undefined): boolean =>
  !!kind && meta.core.includes(kind as RoleKind);

/** Groups in display order, each split into the main list and the advanced tier. */
export function catalogGroups(): CatalogGroup[] {
  return CAPABILITY_GROUPS.map((g) => {
    const caps = CAPABILITIES.filter((c) => c.group === g.key && c.tier !== "legacy");
    return {
      ...g,
      main: caps.filter((c) => c.tier !== "advanced"),
      advanced: caps.filter((c) => c.tier === "advanced"),
    };
  }).filter((g) => g.main.length + g.advanced.length > 0);
}

export const isArabic = (lang: string | undefined) => (lang ?? "").startsWith("ar");

export const capLabel = (meta: Pick<CapabilityMeta, "en" | "ar">, lang: string | undefined) =>
  isArabic(lang) ? meta.ar : meta.en;

export const capHint = (meta: CapabilityMeta, lang: string | undefined) =>
  isArabic(lang) ? meta.hintAr : meta.hintEn;

export const bilingual = (en: string, ar: string, lang: string | undefined) => (isArabic(lang) ? ar : en);

/** The capabilities an owner may switch between "hidden" and "ask a manager". */
export const approvalCapabilities = (): CapabilityMeta[] =>
  CAPABILITIES.filter((c) => c.approval && c.tier !== "legacy");

/** A role's grant set as keys, with core grants for its kind added (they are not stored). */
export function roleHolds(grants: readonly { capability: string }[], kind: string): Set<Capability> {
  const held = new Set(grants.map((g) => g.capability as Capability));
  for (const c of CAPABILITIES) if (isCoreFor(c, kind)) held.add(c.key);
  return held;
}
