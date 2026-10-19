/**
 * What the org in scope has: its plan's features plus its add-ons (Rewards by Madar:
 * `loyalty` on Free). madar-plan's `entitlements_with`, in one line.
 *
 * The add-ons are kept here, set by the auth store whenever it learns them, so
 * config modules (nav, settings nav) can ask without importing the store.
 */
import { hasFeature, type Feature } from "@/generated/plans";

let addons: readonly string[] = [];

export function setOrgAddons(next: readonly string[]): void {
  addons = next;
}

export function orgHasFeature(plan: string | null | undefined, feature: Feature): boolean {
  return hasFeature(plan, feature) || addons.includes(feature);
}
