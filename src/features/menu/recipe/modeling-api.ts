/**
 * TEMPORARY until `npm run generate:api` on the modeling branch.
 *
 * Hand-typed client for the menu-modeling (stream F) endpoints that the exported
 * `openapi.json` on main does not have yet. Types mirror the Rust structs in
 * MadarRust `src/menu/{bases,packaging,linked,studio,modifiers}.rs` and
 * `src/inventory/handlers.rs` on branch `modeling-f`. Calls go through the same
 * `customInstance` mutator Orval uses, so auth/org headers and 401 handling are
 * identical. Replace every import of this module with the generated hooks once
 * the spec is exported.
 */
import { useQuery } from "@tanstack/react-query";

import { customInstance } from "@/data/api/custom-instance";
import type { Capability } from "@/generated/capabilities";

/** TEMPORARY until authz regen: not in the generated `Cap` map yet. */
export const MENU_PACKAGING_RULES_APPLY = "menu.packaging_rules.apply" as Capability;
import type { IngredientCategory, RecipeLineOut, SizeOut, StudioAggregate } from "@/data/api/generated/models";

// ── Additive fields on existing shapes ───────────────────────────────────────

/** Where a stored size recipe line came from. Legacy rows (`null`) are `own`. */
export type LineSource = "own" | "base" | "rule" | "linked";

export type RecipeLineOutExt = RecipeLineOut & {
  source?: LineSource | string | null;
  size_label?: string | null;
};

export type SizeOutExt = Omit<SizeOut, "recipe"> & {
  base_id?: string | null;
  recipe: RecipeLineOutExt[];
};

export type StudioAggregateExt = Omit<StudioAggregate, "sizes"> & {
  sizes: SizeOutExt[];
  recipe_source_item_id?: string | null;
  linked_copy_ids?: string[];
};

export const asStudioExt = (s: StudioAggregate): StudioAggregateExt => s as unknown as StudioAggregateExt;

export type IngredientCategoryExt = IngredientCategory & { is_packaging?: boolean };

/** `OptionRecipeLineInput` with the per-size label (`null` = every size). */
export interface OptionRecipeLineInputExt {
  ingredient_id: string;
  quantity: number;
  unit: string;
  size_label?: string | null;
}

// ── Recipe bases ─────────────────────────────────────────────────────────────

export interface RecipeBaseLineOut {
  id: string;
  size_label: string | null;
  ingredient_id: string;
  ingredient_name: string;
  /** Base-unit quantity as a decimal string. */
  quantity: string;
  unit: string;
  sort: number;
}

export interface RecipeBaseOut {
  id: string;
  org_id: string;
  name: string;
  name_ar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lines: RecipeBaseLineOut[];
  size_count: number;
  item_count: number;
}

export interface RecipeBaseLineInput {
  size_label?: string | null;
  ingredient_id: string;
  quantity: number;
  unit: string;
  sort?: number | null;
}

export interface CreateRecipeBaseRequest {
  name: string;
  name_ar?: string | null;
  is_active?: boolean | null;
  lines?: RecipeBaseLineInput[] | null;
}

export interface PatchRecipeBaseRequest {
  name?: string;
  name_ar?: string | null;
  is_active?: boolean;
}

export interface RecipeBaseSaveResult {
  base: RecipeBaseOut;
  sizes_changed: number;
  catalog_revision: number;
}

export interface RecipeBaseUsageSize {
  size_id: string;
  size_label: string;
  menu_item_id: string;
  menu_item_name: string;
}

export interface RecipeBaseUsage {
  base_id: string;
  item_count: number;
  size_count: number;
  sizes: RecipeBaseUsageSize[];
}

export interface SizeBaseResult {
  size_id: string;
  base_id: string | null;
  sizes_changed: number;
  catalog_revision: number;
}

export const listRecipeBases = () => customInstance<RecipeBaseOut[]>({ url: "/recipe-bases", method: "GET" });
export const getRecipeBase = (id: string) => customInstance<RecipeBaseOut>({ url: `/recipe-bases/${id}`, method: "GET" });
export const createRecipeBase = (data: CreateRecipeBaseRequest) =>
  customInstance<RecipeBaseOut>({ url: "/recipe-bases", method: "POST", data });
export const patchRecipeBase = (id: string, data: PatchRecipeBaseRequest) =>
  customInstance<RecipeBaseSaveResult>({ url: `/recipe-bases/${id}`, method: "PATCH", data });
export const deleteRecipeBase = (id: string) => customInstance<void>({ url: `/recipe-bases/${id}`, method: "DELETE" });
export const putRecipeBaseLines = (id: string, lines: RecipeBaseLineInput[]) =>
  customInstance<RecipeBaseSaveResult>({ url: `/recipe-bases/${id}/lines`, method: "PUT", data: { lines } });
export const getRecipeBaseUsage = (id: string) =>
  customInstance<RecipeBaseUsage>({ url: `/recipe-bases/${id}/usage`, method: "GET" });
export const putSizeBase = (sizeId: string, baseId: string | null) =>
  customInstance<SizeBaseResult>({ url: `/menu-item-sizes/${sizeId}/base`, method: "PUT", data: { base_id: baseId } });

export const recipeBasesKey = ["/recipe-bases"] as const;
export const recipeBaseUsageKey = (id: string) => ["/recipe-bases", id, "usage"] as const;

export const useRecipeBases = (enabled = true) =>
  useQuery({ queryKey: recipeBasesKey, queryFn: listRecipeBases, enabled });
export const useRecipeBaseUsage = (id: string | null) =>
  useQuery({ queryKey: recipeBaseUsageKey(id ?? ""), queryFn: () => getRecipeBaseUsage(id!), enabled: !!id });

// ── Packaging rules ──────────────────────────────────────────────────────────

export interface PackagingRuleLineOut {
  ingredient_id: string;
  ingredient_name: string;
  quantity: string;
  unit: string;
  sort: number;
}

export interface PackagingRuleOut {
  id: string;
  org_id: string;
  name: string;
  match_category_id: string | null;
  match_size_label: string | null;
  match_item_id: string | null;
  sort: number;
  is_active: boolean;
  lines: PackagingRuleLineOut[];
  created_at: string;
  updated_at: string;
}

export interface PackagingRuleLineInput {
  ingredient_id: string;
  quantity: number;
  unit: string;
}

export interface CreatePackagingRuleRequest {
  name: string;
  match_category_id?: string | null;
  match_size_label?: string | null;
  match_item_id?: string | null;
  sort?: number | null;
  is_active?: boolean | null;
  lines: PackagingRuleLineInput[];
}

/** PATCH: absent = unchanged; explicit `null` on a match field clears it. */
export type PatchPackagingRuleRequest = Partial<CreatePackagingRuleRequest>;

export interface ApplyPackagingRulesResult {
  sizes_seen: number;
  sizes_changed: number;
  sizes_with_rule: number;
  sizes_with_manual_packaging: number;
  catalog_revision: number;
}

export const listPackagingRules = () =>
  customInstance<PackagingRuleOut[]>({ url: "/packaging-rules", method: "GET" });
export const createPackagingRule = (data: CreatePackagingRuleRequest) =>
  customInstance<PackagingRuleOut>({ url: "/packaging-rules", method: "POST", data });
export const patchPackagingRule = (id: string, data: PatchPackagingRuleRequest) =>
  customInstance<PackagingRuleOut>({ url: `/packaging-rules/${id}`, method: "PATCH", data });
export const deletePackagingRule = (id: string) =>
  customInstance<void>({ url: `/packaging-rules/${id}`, method: "DELETE" });
export const applyPackagingRules = () =>
  customInstance<ApplyPackagingRulesResult>({ url: "/packaging-rules/apply", method: "POST" });

export const packagingRulesKey = ["/packaging-rules"] as const;
export const usePackagingRules = (enabled = true) =>
  useQuery({ queryKey: packagingRulesKey, queryFn: listPackagingRules, enabled });

// ── Linked copies ────────────────────────────────────────────────────────────

export interface CreateLinkedCopyRequest {
  name: string;
  /** Piastres, applied to every size of the copy. */
  price: number;
  category_id?: string | null;
}

export interface RecipeLinkInfo {
  menu_item_id: string;
  recipe_source_item_id: string | null;
  recipe_source_item_name: string | null;
  linked_copy_ids: string[];
  in_sync: boolean | null;
}

export interface LinkedCopyResult {
  menu_item_id: string;
  link: RecipeLinkInfo;
  catalog_revision: number;
}

export const createLinkedCopy = (itemId: string, data: CreateLinkedCopyRequest) =>
  customInstance<LinkedCopyResult>({ url: `/menu-items/${itemId}/linked-copy`, method: "POST", data });
export const getRecipeLink = (itemId: string) =>
  customInstance<RecipeLinkInfo>({ url: `/menu-items/${itemId}/recipe-link`, method: "GET" });
export const deleteRecipeLink = (itemId: string) =>
  customInstance<RecipeLinkInfo>({ url: `/menu-items/${itemId}/recipe-link`, method: "DELETE" });

export const recipeLinkKey = (itemId: string) => ["/menu-items", itemId, "recipe-link"] as const;
export const useRecipeLink = (itemId: string, enabled = true) =>
  useQuery({ queryKey: recipeLinkKey(itemId), queryFn: () => getRecipeLink(itemId), enabled: enabled && !!itemId });
