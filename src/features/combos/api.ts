/**
 * The combos, deals and Bundles-report data hooks, in one place.
 *
 * TEMPORARY SHAPE: until Builder A publishes the spec there is no generated
 * client for these endpoints, and this app never hand-writes a fetch. So each
 * hook here is a typed stub that fails with `NOT_GENERATED` (and the tests mock
 * this module). When `CONTRACT READY` lands, this file becomes a thin wrapper
 * over the Orval hooks with the same exported names, and the screens don't
 * change.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type {
  BundlesReport,
  BundlesReportParams,
  ChannelOverride,
  Combo,
  ComboEconomics,
  ComboMix,
  ComboPage,
  ComboSettings,
  ComboSettingsWrite,
  ComboWrite,
  DealRule,
  DealWrite,
  ListCombosParams,
  MealTarget,
} from "./contract";

export class NotGeneratedError extends Error {
  constructor(what: string) {
    super(`${what}: the combos API client is not generated yet`);
    this.name = "NotGeneratedError";
  }
}

const notYet = <T,>(what: string) => (): Promise<T> => Promise.reject(new NotGeneratedError(what));

type Opts = { enabled?: boolean };

// ── Combos ───────────────────────────────────────────────────────────────────

export const useCombos = (params: ListCombosParams, opts: Opts = {}): UseQueryResult<ComboPage> =>
  useQuery({ queryKey: ["/combos", params], queryFn: notYet<ComboPage>("GET /combos"), enabled: opts.enabled ?? true, retry: false });

export const useCombo = (id: string, params: { branch_id?: string } = {}, opts: Opts = {}): UseQueryResult<Combo> =>
  useQuery({ queryKey: [`/combos/${id}`, params], queryFn: notYet<Combo>("GET /combos/{id}"), enabled: opts.enabled ?? true, retry: false });

export const createCombo = (_body: ComboWrite): Promise<Combo> => notYet<Combo>("POST /combos")();
export const updateCombo = (_id: string, _body: ComboWrite): Promise<Combo> => notYet<Combo>("PUT /combos/{id}")();
/** A combo is a menu item: it is deleted, and its image uploaded, through the item endpoints. */
export const deleteCombo = (_id: string): Promise<void> => notYet<void>("DELETE /menu-items/{id}")();
export const uploadComboImage = (_id: string, _file: File): Promise<unknown> => notYet<unknown>("POST /menu-items/{id}/image")();

/** The editor's live panel: nothing is saved. `body` null = not ready to ask. */
export const useComboEconomics = (
  body: (ComboWrite & { branch_id?: string | null }) | null,
  opts: Opts = {},
): UseQueryResult<ComboEconomics> =>
  useQuery({
    queryKey: ["/combos/economics", body],
    queryFn: notYet<ComboEconomics>("POST /combos/economics"),
    enabled: (opts.enabled ?? true) && body !== null,
    retry: false,
  });

/** C14: point an item at a combo slot, or clear it. The pointer is read back on `GET /menu-items/{id}` (`meal`). */
export const setItemMeal = (_itemId: string, _target: MealTarget): Promise<void> => notYet<void>("PUT /menu-items/{id}/meal")();

// ── Settings (§11.1: org-wide channels, per-branch overrides, margin floor) ──

export const useComboSettings = (opts: Opts = {}): UseQueryResult<ComboSettings> =>
  useQuery({ queryKey: ["/settings/combos"], queryFn: notYet<ComboSettings>("GET /settings/combos"), enabled: opts.enabled ?? true, retry: false });

export const saveComboSettings = (_body: ComboSettingsWrite): Promise<ComboSettings> =>
  notYet<ComboSettings>("PUT /settings/combos")();
export const putBranchChannels = (_branchId: string, _sell: ChannelOverride): Promise<void> =>
  notYet<void>("PUT /settings/combos/branches/{branch_id}")();
export const deleteBranchChannels = (_branchId: string): Promise<void> =>
  notYet<void>("DELETE /settings/combos/branches/{branch_id}")();

// ── Deals ────────────────────────────────────────────────────────────────────

export const useDeals = (params: { is_active?: boolean } = {}, opts: Opts = {}): UseQueryResult<DealRule[]> =>
  useQuery({ queryKey: ["/deals", params], queryFn: notYet<DealRule[]>("GET /deals"), enabled: opts.enabled ?? true, retry: false });

export const createDeal = (_body: DealWrite): Promise<DealRule> => notYet<DealRule>("POST /deals")();
export const updateDeal = (_id: string, _body: DealWrite): Promise<DealRule> => notYet<DealRule>("PUT /deals/{id}")();
export const deleteDeal = (_id: string): Promise<void> => notYet<void>("DELETE /deals/{id}")();
export const putDealBranch = (_id: string, _branchId: string, _isActive: boolean): Promise<void> =>
  notYet<void>("PUT /deals/{id}/branches/{branch_id}")();
export const deleteDealBranch = (_id: string, _branchId: string): Promise<void> =>
  notYet<void>("DELETE /deals/{id}/branches/{branch_id}")();

// ── Bundles report ───────────────────────────────────────────────────────────

export const useBundlesReport = (params: BundlesReportParams, opts: Opts = {}): UseQueryResult<BundlesReport> =>
  useQuery({ queryKey: ["/reports/bundles", params], queryFn: notYet<BundlesReport>("GET /reports/bundles"), enabled: opts.enabled ?? true, retry: false });

export const useComboMix = (
  comboId: string,
  params: Omit<BundlesReportParams, "kind">,
  opts: Opts = {},
): UseQueryResult<ComboMix> =>
  useQuery({
    queryKey: [`/reports/bundles/combos/${comboId}/mix`, params],
    queryFn: notYet<ComboMix>("GET /reports/bundles/combos/{id}/mix"),
    enabled: opts.enabled ?? true,
    retry: false,
  });
