/**
 * The combos, deals and Bundles-report data hooks, in one place: thin
 * wrappers over the Orval client (`src/data/api/generated`), under the names
 * the screens and their tests use. Nothing here builds a request by hand.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  bundlesReport as fetchBundlesReport,
  comboEconomics,
  comboMix as fetchComboMix,
  createCombo as postCombo,
  createDeal as postDeal,
  deleteBranchChannels as delBranchChannels,
  deleteDeal as delDeal,
  deleteDealBranch as delDealBranch,
  deleteMenuItem,
  getCombo,
  getGetComboQueryKey,
  getGetSettingsQueryKey,
  getListCombosQueryKey,
  getListDealsQueryKey,
  getSettings,
  listCombos,
  listDeals,
  putBranchChannels as putBranch,
  putDealBranch as putDealBranchApi,
  putMeal,
  putSettings,
  updateCombo as putCombo,
  updateDeal as putDeal,
  uploadMenuItemImage,
  getBundlesReportQueryKey,
  getComboMixQueryKey,
} from "@/data/api/generated/api";

import type {
  BundlesReport,
  BundlesReportParams,
  ChannelOverride,
  Combo,
  ComboEconomics,
  ComboEconomicsRequest,
  ComboMix,
  ComboPage,
  ComboSettings,
  ComboSettingsWrite,
  ComboWrite,
  DealRule,
  DealWrite,
  ListCombosParams,
  MealTarget,
} from "./types";

type Opts = { enabled?: boolean };

// ── Combos ───────────────────────────────────────────────────────────────────

export const useCombos = (params: ListCombosParams, opts: Opts = {}): UseQueryResult<ComboPage> =>
  useQuery({
    queryKey: getListCombosQueryKey(params),
    queryFn: ({ signal }) => listCombos(params, undefined, signal),
    enabled: opts.enabled ?? true,
  });

export const useCombo = (id: string, params: { branch_id?: string } = {}, opts: Opts = {}): UseQueryResult<Combo> =>
  useQuery({
    queryKey: getGetComboQueryKey(id, params),
    queryFn: ({ signal }) => getCombo(id, params, undefined, signal),
    enabled: (opts.enabled ?? true) && !!id,
  });

export const createCombo = (body: ComboWrite): Promise<Combo> => postCombo(body);
export const updateCombo = (id: string, body: ComboWrite): Promise<Combo> => putCombo(id, body);
/** A combo is a menu item: it is deleted, and its image uploaded, through the item endpoints. */
export const deleteCombo = (id: string): Promise<void> => deleteMenuItem(id);
export const uploadComboImage = (id: string, file: File): Promise<unknown> => uploadMenuItemImage(id, { image: file });

/** The editor's live panel: nothing is saved. `body` null = not ready to ask. */
export const useComboEconomics = (body: ComboEconomicsRequest | null, opts: Opts = {}): UseQueryResult<ComboEconomics> =>
  useQuery({
    queryKey: ["/combos/economics", body],
    queryFn: ({ signal }) => comboEconomics(body as ComboEconomicsRequest, undefined, signal),
    enabled: (opts.enabled ?? true) && body !== null,
    retry: false,
  });

/** C14: point an item at a combo slot, or clear it (both null). Read back on `GET /menu-items/{id}` (`meal`). */
export const setItemMeal = (itemId: string, target: MealTarget): Promise<void> =>
  putMeal(itemId, target ?? { combo_id: null, slot_id: null });

// ── Settings (§11.1: org-wide channels, per-branch overrides, margin floor) ──

export const useComboSettings = (opts: Opts = {}): UseQueryResult<ComboSettings> =>
  useQuery({ queryKey: getGetSettingsQueryKey(), queryFn: ({ signal }) => getSettings(undefined, signal), enabled: opts.enabled ?? true });

export const saveComboSettings = (body: ComboSettingsWrite): Promise<ComboSettings> => putSettings(body);
export const putBranchChannels = (branchId: string, sell: ChannelOverride): Promise<void> => putBranch(branchId, sell);
export const deleteBranchChannels = (branchId: string): Promise<void> => delBranchChannels(branchId);

// ── Deals ────────────────────────────────────────────────────────────────────

export const useDeals = (params: { is_active?: boolean } = {}, opts: Opts = {}): UseQueryResult<DealRule[]> =>
  useQuery({
    queryKey: getListDealsQueryKey(params),
    queryFn: ({ signal }) => listDeals(params, undefined, signal),
    enabled: opts.enabled ?? true,
  });

export const createDeal = (body: DealWrite): Promise<DealRule> => postDeal(body);
export const updateDeal = (id: string, body: DealWrite): Promise<DealRule> => putDeal(id, body);
export const deleteDeal = (id: string): Promise<void> => delDeal(id);
export const putDealBranch = (id: string, branchId: string, isActive: boolean): Promise<void> =>
  putDealBranchApi(id, branchId, { is_active: isActive });
export const deleteDealBranch = (id: string, branchId: string): Promise<void> => delDealBranch(id, branchId);

// ── Bundles report ───────────────────────────────────────────────────────────

export const useBundlesReport = (params: BundlesReportParams, opts: Opts = {}): UseQueryResult<BundlesReport> =>
  useQuery({
    queryKey: getBundlesReportQueryKey(params),
    queryFn: ({ signal }) => fetchBundlesReport(params, undefined, signal),
    enabled: opts.enabled ?? true,
  });

export const useComboMix = (comboId: string, params: Omit<BundlesReportParams, "kind">, opts: Opts = {}): UseQueryResult<ComboMix> =>
  useQuery({
    queryKey: getComboMixQueryKey(comboId, params),
    queryFn: ({ signal }) => fetchComboMix(comboId, params, undefined, signal),
    enabled: (opts.enabled ?? true) && !!comboId,
  });
