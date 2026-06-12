/* eslint-disable */
// @ts-nocheck
import {
  faker
} from '@faker-js/faker';

import {
  HttpResponse,
  http
} from 'msw';
import type {
  RequestHandlerOptions
} from 'msw';

import {
  Action,
  BundleStatus,
  CmQuadrant,
  Confidence,
  Decision,
  GuardClip,
  PeerPosition,
  PriceRoundingRule,
  PrinterBrand,
  RemovalRecommendation,
  RevenueClass,
  RunStatus,
  SuggestionKind,
  UserRole
} from './models';
import type {
  AddonCost,
  AddonIngredient,
  AddonItem,
  AddonOverride,
  AddonSalesRow,
  AddonSlot,
  AuthPermissionsResponse,
  Branch,
  BranchInventoryAdjustment,
  BranchInventoryItem,
  BranchInventoryTransfer,
  BranchSalesReport,
  BranchStockReport,
  BundlePerformanceResponse,
  BundleSalesRow,
  BundleSuggestionRecord,
  BundleWithComponents,
  CalibrationSummary,
  CashMovement,
  Category,
  CloseShiftResponse,
  CombinedItemSalesRow,
  CreateRunResponse,
  CreateUserResponse,
  DecisionRecord,
  DeductionLogRow,
  Discount,
  DrinkRecipe,
  ExportResponse,
  InventoryDiscrepancy,
  ItemSize,
  LoginResponse,
  MeResponse,
  MenuEngineeringReport,
  MenuItem,
  MenuItemFull,
  OnboardingStatus,
  OptionalField,
  Order,
  OrderFull,
  Org,
  OrgComparisonReport,
  OrgIngredient,
  OrgPaymentMethod,
  PaginatedBundles,
  PaginatedOrders,
  PeerComparison,
  Permission,
  PermissionMatrix,
  PersistedRun,
  PreviewIngredient,
  PriceSuggestionRecord,
  PublicMenuResponse,
  PublicOrg,
  RemovalScenarioRecord,
  ResolveBranchResponse,
  RolePermission,
  Shift,
  ShiftPreFill,
  ShiftReportResponse,
  ShiftSummary,
  SkuCost,
  TellerStats,
  TimeseriesPoint,
  Triplet,
  UploadResponse,
  UserBranch,
  UserPublic
} from './models';


export const getListAddonItemsResponseMock = (): AddonItem[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_price: faker.number.int(), display_order: faker.number.int(), id: faker.string.uuid(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2})})), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), primary_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateAddonItemResponseMock = (overrideResponse: Partial<Extract<AddonItem, object>> = {}): AddonItem => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_price: faker.number.int(), display_order: faker.number.int(), id: faker.string.uuid(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2})})), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), primary_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateAddonItemResponseMock = (overrideResponse: Partial<Extract<AddonItem, object>> = {}): AddonItem => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_price: faker.number.int(), display_order: faker.number.int(), id: faker.string.uuid(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2})})), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), primary_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getLoginResponseMock = (overrideResponse: Partial<Extract<LoginResponse, object>> = {}): LoginResponse => ({token: faker.string.alpha({length: {min: 10, max: 20}}), user: {branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))}, ...overrideResponse})

export const getMeResponseMock = (overrideResponse: Partial<Extract<MeResponse, object>> = {}): MeResponse => ({user: {branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))}, ...overrideResponse})

export const getGetMyPermissionsResponseMock = (overrideResponse: Partial<Extract<AuthPermissionsResponse, object>> = {}): AuthPermissionsResponse => ({permissions: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getResolveBranchResponseMock = (overrideResponse: Partial<Extract<ResolveBranchResponse, object>> = {}): ResolveBranchResponse => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), distance_meters: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getListBranchesResponseMock = (): Branch[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateBranchResponseMock = (overrideResponse: Partial<Extract<Branch, object>> = {}): Branch => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getGetBranchResponseMock = (overrideResponse: Partial<Extract<Branch, object>> = {}): Branch => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateBranchResponseMock = (overrideResponse: Partial<Extract<Branch, object>> = {}): Branch => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListBundlesResponseMock = (overrideResponse: Partial<Extract<PaginatedBundles, object>> = {}): PaginatedBundles => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int()},})), page: faker.number.int(), per_page: faker.number.int(), total: faker.number.int(), total_pages: faker.number.int(), ...overrideResponse})

export const getCreateBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int()},})

export const getAvailableBundlesResponseMock = (): BundleWithComponents[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int()},})))

export const getGetBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int()},})

export const getUpdateBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int()},})

export const getActivateBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int()},})

export const getArchiveBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int()},})

export const getBundlePerformanceResponseMock = (overrideResponse: Partial<Extract<BundlePerformanceResponse, object>> = {}): BundlePerformanceResponse => ({component_popularity: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), quantity_sold: faker.number.int()})), gross_revenue: faker.number.int(), net_profit: faker.number.int(), sales_volume: faker.number.int(), ...overrideResponse})

export const getListCategoriesResponseMock = (): Category[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateCategoryResponseMock = (overrideResponse: Partial<Extract<Category, object>> = {}): Category => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateCategoryResponseMock = (overrideResponse: Partial<Extract<Category, object>> = {}): Category => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListAddonCostsResponseMock = (): AddonCost[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_type: faker.string.alpha({length: {min: 10, max: 20}}), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int()})))

export const getListSkuCostsResponseMock = (): SkuCost[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), food_cost_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), item_name: faker.string.alpha({length: {min: 10, max: 20}}), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), menu_item_id: faker.string.uuid(), price: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getListDiscountsResponseMock = (): Discount[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', dtype: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', value: faker.number.int()})))

export const getCreateDiscountResponseMock = (overrideResponse: Partial<Extract<Discount, object>> = {}): Discount => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', dtype: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', value: faker.number.int(), ...overrideResponse})

export const getUpdateDiscountResponseMock = (overrideResponse: Partial<Extract<Discount, object>> = {}): Discount => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', dtype: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', value: faker.number.int(), ...overrideResponse})

export const getListAdjustmentsResponseMock = (): BranchInventoryAdjustment[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({adjusted_by: faker.string.uuid(), adjusted_by_name: faker.string.alpha({length: {min: 10, max: 20}}), adjustment_type: faker.string.alpha({length: {min: 10, max: 20}}), branch_id: faker.string.uuid(), branch_inventory_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}}), quantity: faker.number.float({fractionDigits: 2}), transfer_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getCreateAdjustmentResponseMock = (overrideResponse: Partial<Extract<BranchInventoryAdjustment, object>> = {}): BranchInventoryAdjustment => ({adjusted_by: faker.string.uuid(), adjusted_by_name: faker.string.alpha({length: {min: 10, max: 20}}), adjustment_type: faker.string.alpha({length: {min: 10, max: 20}}), branch_id: faker.string.uuid(), branch_inventory_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}}), quantity: faker.number.float({fractionDigits: 2}), transfer_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListBranchStockResponseMock = (): BranchInventoryItem[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({below_reorder: faker.datatype.boolean(), branch_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', current_stock: faker.number.float({fractionDigits: 2}), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getAddToBranchStockResponseMock = (overrideResponse: Partial<Extract<BranchInventoryItem, object>> = {}): BranchInventoryItem => ({below_reorder: faker.datatype.boolean(), branch_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', current_stock: faker.number.float({fractionDigits: 2}), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateBranchStockResponseMock = (overrideResponse: Partial<Extract<BranchInventoryItem, object>> = {}): BranchInventoryItem => ({below_reorder: faker.datatype.boolean(), branch_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', current_stock: faker.number.float({fractionDigits: 2}), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListTransfersResponseMock = (): BranchInventoryTransfer[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({destination_branch_id: faker.string.uuid(), destination_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), initiated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', initiated_by: faker.string.uuid(), initiated_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), source_branch_id: faker.string.uuid(), source_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getListCatalogResponseMock = (): OrgIngredient[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateCatalogItemResponseMock = (overrideResponse: Partial<Extract<OrgIngredient, object>> = {}): OrgIngredient => ({category: faker.string.alpha({length: {min: 10, max: 20}}), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateCatalogItemResponseMock = (overrideResponse: Partial<Extract<OrgIngredient, object>> = {}): OrgIngredient => ({category: faker.string.alpha({length: {min: 10, max: 20}}), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getCreateTransferResponseMock = (overrideResponse: Partial<Extract<BranchInventoryTransfer, object>> = {}): BranchInventoryTransfer => ({destination_branch_id: faker.string.uuid(), destination_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), initiated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', initiated_by: faker.string.uuid(), initiated_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), source_branch_id: faker.string.uuid(), source_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getUpdateTransferResponseMock = (overrideResponse: Partial<Extract<BranchInventoryTransfer, object>> = {}): BranchInventoryTransfer => ({destination_branch_id: faker.string.uuid(), destination_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), initiated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', initiated_by: faker.string.uuid(), initiated_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), source_branch_id: faker.string.uuid(), source_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getGetCalibrationHandlerResponseMock = (overrideResponse: Partial<Extract<CalibrationSummary, object>> = {}): CalibrationSummary => ({branch_id: faker.string.uuid(), cm_in_range_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), points_cm: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({classification_mode: faker.string.alpha({length: {min: 10, max: 20}}), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', item_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), predicted_delta_pct: faker.number.float({fractionDigits: 2}), previous_price: faker.number.int(), realized_at: faker.date.past().toISOString().slice(0, 19) + 'Z', realized_delta_pct: faker.number.float({fractionDigits: 2}), realized_price: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}}), suggested_price: faker.number.int(), suggestion_id: faker.string.uuid()})), points_revenue: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({classification_mode: faker.string.alpha({length: {min: 10, max: 20}}), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', item_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), predicted_delta_pct: faker.number.float({fractionDigits: 2}), previous_price: faker.number.int(), realized_at: faker.date.past().toISOString().slice(0, 19) + 'Z', realized_delta_pct: faker.number.float({fractionDigits: 2}), realized_price: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}}), suggested_price: faker.number.int(), suggestion_id: faker.string.uuid()})), revenue_in_range_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), since: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ...overrideResponse})

export const getListDecisionsHandlerResponseMock = (): DecisionRecord[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))})))

export const getGetLatestItemKpiHandlerResponsePeerComparisonMock = (overrideResponse: Partial<PeerComparison> = {}): PeerComparison => ({...{median_cm_per_unit_peers: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), median_effective_price_peers: faker.number.float({fractionDigits: 2}), median_margin_pct_peers: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), same_category_count: faker.number.int({min: 0}), your_position: faker.helpers.arrayElement(Object.values(PeerPosition))}, ...overrideResponse});

export const getGetLatestItemKpiHandlerResponseDecisionRecordMock = (overrideResponse: Partial<DecisionRecord> = {}): DecisionRecord => ({...{branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))}, ...overrideResponse});

export const getGetLatestItemKpiHandlerResponseMock = (): PriceSuggestionRecord => ({...{action: faker.helpers.arrayElement(Object.values(Action)), anchors: {cost_plus: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), peer_median: faker.number.float({fractionDigits: 2}), status_quo: faker.number.float({fractionDigits: 2})}, classification: faker.helpers.arrayElement([{mode: faker.helpers.arrayElement(['cm'] as const), quadrant: faker.helpers.arrayElement(Object.values(CmQuadrant))},{class: faker.helpers.arrayElement(Object.values(RevenueClass)), mode: faker.helpers.arrayElement(['revenue'] as const)},{mode: faker.helpers.arrayElement(['insufficient'] as const)},]), cm_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), confidence: faker.helpers.arrayElement(Object.values(Confidence)), cost_missing: faker.datatype.boolean(), cost_reduction_whatif_margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), current_price: faker.number.int(), effective_price: faker.number.float({fractionDigits: 2}), explanation: faker.string.alpha({length: {min: 10, max: 20}}), food_cost_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), guard_clips: faker.helpers.arrayElements(Object.values(GuardClip)), item_name: faker.string.alpha({length: {min: 10, max: 20}}), key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), peer_comparison: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetLatestItemKpiHandlerResponsePeerComparisonMock()},]), undefined]), popularity_share: faker.number.float({fractionDigits: 2}), price_changed_in_window: faker.datatype.boolean(), suggested_delta_abs: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), suggested_delta_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), suggested_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), units_sold_raw: faker.number.float({fractionDigits: 2})},...{branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decision: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetLatestItemKpiHandlerResponseDecisionRecordMock()},]), undefined]), id: faker.string.uuid(), run_id: faker.string.uuid()},})

export const getListRunsHandlerResponseMock = (): PersistedRun[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), config: {analysis_window_days: faker.number.float({fractionDigits: 2}), bundle_discount_pct_range: [], bundle_max_size: faker.number.int({min: 0}), bundle_top_k_partners: faker.number.int({min: 0}), bundle_top_n_per_focus: faker.number.int({min: 0}), halo_repeat_rate: faker.number.float({fractionDigits: 2}), max_price_change_pct_per_cycle: faker.number.float({fractionDigits: 2}), min_cooccurrences_for_bundle: faker.number.float({fractionDigits: 2}), min_gross_margin_pct: faker.number.float({fractionDigits: 2}), min_lift_for_bundle: faker.number.float({fractionDigits: 2}), min_units_for_classification: faker.number.float({fractionDigits: 2}), price_rounding_rule: faker.helpers.arrayElement([faker.helpers.arrayElement(Object.values(PriceRoundingRule)),]), promotion_lift_prior: faker.number.float({fractionDigits: 2}), recency_half_life_days: faker.number.float({fractionDigits: 2}), revenue_mode_max_raise_pct: faker.number.float({fractionDigits: 2}), target_food_cost_pct: faker.number.float({fractionDigits: 2})}, error_message: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), mode_summary: {items_cm_tracked: faker.number.int({min: 0}), items_insufficient: faker.number.int({min: 0}), items_revenue_only: faker.number.int({min: 0}), items_total: faker.number.int({min: 0})}, org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', status: faker.helpers.arrayElement(Object.values(RunStatus)), window_days: faker.number.float({fractionDigits: 2})})))

export const getCreateRunHandlerResponseMock = (overrideResponse: Partial<Extract<CreateRunResponse, object>> = {}): CreateRunResponse => ({run_id: faker.string.uuid(), ...overrideResponse})

export const getGetActiveRunHandlerResponseMock = (overrideResponse: Partial<Extract<PersistedRun, object>> = {}): PersistedRun => ({branch_id: faker.string.uuid(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), config: {analysis_window_days: faker.number.float({fractionDigits: 2}), bundle_discount_pct_range: [], bundle_max_size: faker.number.int({min: 0}), bundle_top_k_partners: faker.number.int({min: 0}), bundle_top_n_per_focus: faker.number.int({min: 0}), halo_repeat_rate: faker.number.float({fractionDigits: 2}), max_price_change_pct_per_cycle: faker.number.float({fractionDigits: 2}), min_cooccurrences_for_bundle: faker.number.float({fractionDigits: 2}), min_gross_margin_pct: faker.number.float({fractionDigits: 2}), min_lift_for_bundle: faker.number.float({fractionDigits: 2}), min_units_for_classification: faker.number.float({fractionDigits: 2}), price_rounding_rule: faker.helpers.arrayElement([faker.helpers.arrayElement(Object.values(PriceRoundingRule)),]), promotion_lift_prior: faker.number.float({fractionDigits: 2}), recency_half_life_days: faker.number.float({fractionDigits: 2}), revenue_mode_max_raise_pct: faker.number.float({fractionDigits: 2}), target_food_cost_pct: faker.number.float({fractionDigits: 2})}, error_message: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), mode_summary: {items_cm_tracked: faker.number.int({min: 0}), items_insufficient: faker.number.int({min: 0}), items_revenue_only: faker.number.int({min: 0}), items_total: faker.number.int({min: 0})}, org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', status: faker.helpers.arrayElement(Object.values(RunStatus)), window_days: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getGetLatestRunHandlerResponseMock = (overrideResponse: Partial<Extract<PersistedRun, object>> = {}): PersistedRun => ({branch_id: faker.string.uuid(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), config: {analysis_window_days: faker.number.float({fractionDigits: 2}), bundle_discount_pct_range: [], bundle_max_size: faker.number.int({min: 0}), bundle_top_k_partners: faker.number.int({min: 0}), bundle_top_n_per_focus: faker.number.int({min: 0}), halo_repeat_rate: faker.number.float({fractionDigits: 2}), max_price_change_pct_per_cycle: faker.number.float({fractionDigits: 2}), min_cooccurrences_for_bundle: faker.number.float({fractionDigits: 2}), min_gross_margin_pct: faker.number.float({fractionDigits: 2}), min_lift_for_bundle: faker.number.float({fractionDigits: 2}), min_units_for_classification: faker.number.float({fractionDigits: 2}), price_rounding_rule: faker.helpers.arrayElement([faker.helpers.arrayElement(Object.values(PriceRoundingRule)),]), promotion_lift_prior: faker.number.float({fractionDigits: 2}), recency_half_life_days: faker.number.float({fractionDigits: 2}), revenue_mode_max_raise_pct: faker.number.float({fractionDigits: 2}), target_food_cost_pct: faker.number.float({fractionDigits: 2})}, error_message: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), mode_summary: {items_cm_tracked: faker.number.int({min: 0}), items_insufficient: faker.number.int({min: 0}), items_revenue_only: faker.number.int({min: 0}), items_total: faker.number.int({min: 0})}, org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', status: faker.helpers.arrayElement(Object.values(RunStatus)), window_days: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getGetBundleSuggestionHandlerResponseTripletMock = (overrideResponse: Partial<Triplet> = {}): Triplet => ({...{hi: faker.number.float({fractionDigits: 2}), lo: faker.number.float({fractionDigits: 2}), mid: faker.number.float({fractionDigits: 2})}, ...overrideResponse});

export const getGetBundleSuggestionHandlerResponseDecisionRecordMock = (overrideResponse: Partial<DecisionRecord> = {}): DecisionRecord => ({...{branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))}, ...overrideResponse});

export const getGetBundleSuggestionHandlerResponseMock = (): BundleSuggestionRecord => ({...{association: {composite_score: faker.number.float({fractionDigits: 2}), pair_lifts: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({confidence_ab: faker.number.float({fractionDigits: 2}), item_a: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, item_b: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, lift: faker.number.float({fractionDigits: 2}), support: faker.number.float({fractionDigits: 2})}))}, bundle_cm: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), bundle_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), bundle_discount_pct: faker.number.float({fractionDigits: 2}), bundle_items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), bundle_list_price: faker.number.int(), bundle_margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), bundle_suggested_price: faker.number.int(), explanation: faker.string.alpha({length: {min: 10, max: 20}}), focus_item: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, forecast: {expected_velocity: {hi: faker.number.float({fractionDigits: 2}), lo: faker.number.float({fractionDigits: 2}), mid: faker.number.float({fractionDigits: 2})}, halo_units_x: faker.number.float({fractionDigits: 2}), incremental_cm: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetBundleSuggestionHandlerResponseTripletMock()},]), undefined]), inside_bundle_units_x: faker.number.float({fractionDigits: 2}), total_units_uplift_x: faker.number.float({fractionDigits: 2})}, guard_clips: faker.helpers.arrayElements(Object.values(GuardClip)), missing_costs: faker.datatype.boolean()},...{branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decision: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetBundleSuggestionHandlerResponseDecisionRecordMock()},]), undefined]), id: faker.string.uuid(), promoted_bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), run_id: faker.string.uuid()},})

export const getRecordDecisionHandlerResponseMock = (overrideResponse: Partial<Extract<DecisionRecord, object>> = {}): DecisionRecord => ({branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind)), ...overrideResponse})

export const getGetPriceSuggestionHandlerResponsePeerComparisonMock = (overrideResponse: Partial<PeerComparison> = {}): PeerComparison => ({...{median_cm_per_unit_peers: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), median_effective_price_peers: faker.number.float({fractionDigits: 2}), median_margin_pct_peers: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), same_category_count: faker.number.int({min: 0}), your_position: faker.helpers.arrayElement(Object.values(PeerPosition))}, ...overrideResponse});

export const getGetPriceSuggestionHandlerResponseDecisionRecordMock = (overrideResponse: Partial<DecisionRecord> = {}): DecisionRecord => ({...{branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))}, ...overrideResponse});

export const getGetPriceSuggestionHandlerResponseMock = (): PriceSuggestionRecord => ({...{action: faker.helpers.arrayElement(Object.values(Action)), anchors: {cost_plus: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), peer_median: faker.number.float({fractionDigits: 2}), status_quo: faker.number.float({fractionDigits: 2})}, classification: faker.helpers.arrayElement([{mode: faker.helpers.arrayElement(['cm'] as const), quadrant: faker.helpers.arrayElement(Object.values(CmQuadrant))},{class: faker.helpers.arrayElement(Object.values(RevenueClass)), mode: faker.helpers.arrayElement(['revenue'] as const)},{mode: faker.helpers.arrayElement(['insufficient'] as const)},]), cm_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), confidence: faker.helpers.arrayElement(Object.values(Confidence)), cost_missing: faker.datatype.boolean(), cost_reduction_whatif_margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), current_price: faker.number.int(), effective_price: faker.number.float({fractionDigits: 2}), explanation: faker.string.alpha({length: {min: 10, max: 20}}), food_cost_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), guard_clips: faker.helpers.arrayElements(Object.values(GuardClip)), item_name: faker.string.alpha({length: {min: 10, max: 20}}), key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), peer_comparison: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetPriceSuggestionHandlerResponsePeerComparisonMock()},]), undefined]), popularity_share: faker.number.float({fractionDigits: 2}), price_changed_in_window: faker.datatype.boolean(), suggested_delta_abs: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), suggested_delta_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), suggested_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), units_sold_raw: faker.number.float({fractionDigits: 2})},...{branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decision: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetPriceSuggestionHandlerResponseDecisionRecordMock()},]), undefined]), id: faker.string.uuid(), run_id: faker.string.uuid()},})

export const getGetRemovalScenarioHandlerResponseDecisionRecordMock = (overrideResponse: Partial<DecisionRecord> = {}): DecisionRecord => ({...{branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))}, ...overrideResponse});

export const getGetRemovalScenarioHandlerResponseMock = (): RemovalScenarioRecord => ({...{absorbed_by: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({absorbed_cm: faker.number.float({fractionDigits: 2}), absorbed_units: faker.number.float({fractionDigits: 2}), key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}})), baseline_cm: faker.number.float({fractionDigits: 2}), complementary_losses: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, lost_cm: faker.number.float({fractionDigits: 2}), lost_units: faker.number.float({fractionDigits: 2})})), explanation: faker.string.alpha({length: {min: 10, max: 20}}), item_name: faker.string.alpha({length: {min: 10, max: 20}}), key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, net_cm_change: faker.number.float({fractionDigits: 2}), net_cm_change_hi: faker.number.float({fractionDigits: 2}), net_cm_change_lo: faker.number.float({fractionDigits: 2}), recommendation: faker.helpers.arrayElement(Object.values(RemovalRecommendation))},...{branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decision: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetRemovalScenarioHandlerResponseDecisionRecordMock()},]), undefined]), id: faker.string.uuid(), run_id: faker.string.uuid()},})

export const getGetRunHandlerResponseMock = (overrideResponse: Partial<Extract<PersistedRun, object>> = {}): PersistedRun => ({branch_id: faker.string.uuid(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), config: {analysis_window_days: faker.number.float({fractionDigits: 2}), bundle_discount_pct_range: [], bundle_max_size: faker.number.int({min: 0}), bundle_top_k_partners: faker.number.int({min: 0}), bundle_top_n_per_focus: faker.number.int({min: 0}), halo_repeat_rate: faker.number.float({fractionDigits: 2}), max_price_change_pct_per_cycle: faker.number.float({fractionDigits: 2}), min_cooccurrences_for_bundle: faker.number.float({fractionDigits: 2}), min_gross_margin_pct: faker.number.float({fractionDigits: 2}), min_lift_for_bundle: faker.number.float({fractionDigits: 2}), min_units_for_classification: faker.number.float({fractionDigits: 2}), price_rounding_rule: faker.helpers.arrayElement([faker.helpers.arrayElement(Object.values(PriceRoundingRule)),]), promotion_lift_prior: faker.number.float({fractionDigits: 2}), recency_half_life_days: faker.number.float({fractionDigits: 2}), revenue_mode_max_raise_pct: faker.number.float({fractionDigits: 2}), target_food_cost_pct: faker.number.float({fractionDigits: 2})}, error_message: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), mode_summary: {items_cm_tracked: faker.number.int({min: 0}), items_insufficient: faker.number.int({min: 0}), items_revenue_only: faker.number.int({min: 0}), items_total: faker.number.int({min: 0})}, org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', status: faker.helpers.arrayElement(Object.values(RunStatus)), window_days: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getListBundleSuggestionsHandlerResponseTripletMock = (overrideResponse: Partial<Triplet> = {}): Triplet => ({...{hi: faker.number.float({fractionDigits: 2}), lo: faker.number.float({fractionDigits: 2}), mid: faker.number.float({fractionDigits: 2})}, ...overrideResponse});

export const getListBundleSuggestionsHandlerResponseDecisionRecordMock = (overrideResponse: Partial<DecisionRecord> = {}): DecisionRecord => ({...{branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))}, ...overrideResponse});

export const getListBundleSuggestionsHandlerResponseMock = (): BundleSuggestionRecord[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{association: {composite_score: faker.number.float({fractionDigits: 2}), pair_lifts: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({confidence_ab: faker.number.float({fractionDigits: 2}), item_a: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, item_b: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, lift: faker.number.float({fractionDigits: 2}), support: faker.number.float({fractionDigits: 2})}))}, bundle_cm: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), bundle_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), bundle_discount_pct: faker.number.float({fractionDigits: 2}), bundle_items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), bundle_list_price: faker.number.int(), bundle_margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), bundle_suggested_price: faker.number.int(), explanation: faker.string.alpha({length: {min: 10, max: 20}}), focus_item: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, forecast: {expected_velocity: {hi: faker.number.float({fractionDigits: 2}), lo: faker.number.float({fractionDigits: 2}), mid: faker.number.float({fractionDigits: 2})}, halo_units_x: faker.number.float({fractionDigits: 2}), incremental_cm: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getListBundleSuggestionsHandlerResponseTripletMock()},]), undefined]), inside_bundle_units_x: faker.number.float({fractionDigits: 2}), total_units_uplift_x: faker.number.float({fractionDigits: 2})}, guard_clips: faker.helpers.arrayElements(Object.values(GuardClip)), missing_costs: faker.datatype.boolean()},...{branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decision: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getListBundleSuggestionsHandlerResponseDecisionRecordMock()},]), undefined]), id: faker.string.uuid(), promoted_bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), run_id: faker.string.uuid()},})))

export const getListPriceSuggestionsHandlerResponsePeerComparisonMock = (overrideResponse: Partial<PeerComparison> = {}): PeerComparison => ({...{median_cm_per_unit_peers: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), median_effective_price_peers: faker.number.float({fractionDigits: 2}), median_margin_pct_peers: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), same_category_count: faker.number.int({min: 0}), your_position: faker.helpers.arrayElement(Object.values(PeerPosition))}, ...overrideResponse});

export const getListPriceSuggestionsHandlerResponseDecisionRecordMock = (overrideResponse: Partial<DecisionRecord> = {}): DecisionRecord => ({...{branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))}, ...overrideResponse});

export const getListPriceSuggestionsHandlerResponseMock = (): PriceSuggestionRecord[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{action: faker.helpers.arrayElement(Object.values(Action)), anchors: {cost_plus: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), peer_median: faker.number.float({fractionDigits: 2}), status_quo: faker.number.float({fractionDigits: 2})}, classification: faker.helpers.arrayElement([{mode: faker.helpers.arrayElement(['cm'] as const), quadrant: faker.helpers.arrayElement(Object.values(CmQuadrant))},{class: faker.helpers.arrayElement(Object.values(RevenueClass)), mode: faker.helpers.arrayElement(['revenue'] as const)},{mode: faker.helpers.arrayElement(['insufficient'] as const)},]), cm_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), confidence: faker.helpers.arrayElement(Object.values(Confidence)), cost_missing: faker.datatype.boolean(), cost_reduction_whatif_margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), current_price: faker.number.int(), effective_price: faker.number.float({fractionDigits: 2}), explanation: faker.string.alpha({length: {min: 10, max: 20}}), food_cost_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), guard_clips: faker.helpers.arrayElements(Object.values(GuardClip)), item_name: faker.string.alpha({length: {min: 10, max: 20}}), key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), peer_comparison: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getListPriceSuggestionsHandlerResponsePeerComparisonMock()},]), undefined]), popularity_share: faker.number.float({fractionDigits: 2}), price_changed_in_window: faker.datatype.boolean(), suggested_delta_abs: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), suggested_delta_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), suggested_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), units_sold_raw: faker.number.float({fractionDigits: 2})},...{branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decision: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getListPriceSuggestionsHandlerResponseDecisionRecordMock()},]), undefined]), id: faker.string.uuid(), run_id: faker.string.uuid()},})))

export const getListRemovalScenariosHandlerResponseDecisionRecordMock = (overrideResponse: Partial<DecisionRecord> = {}): DecisionRecord => ({...{branch_id: faker.string.uuid(), decided_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decided_by: faker.string.uuid(), decision: faker.helpers.arrayElement(Object.values(Decision)), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), suggestion_id: faker.string.uuid(), suggestion_kind: faker.helpers.arrayElement(Object.values(SuggestionKind))}, ...overrideResponse});

export const getListRemovalScenariosHandlerResponseMock = (): RemovalScenarioRecord[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{absorbed_by: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({absorbed_cm: faker.number.float({fractionDigits: 2}), absorbed_units: faker.number.float({fractionDigits: 2}), key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}})), baseline_cm: faker.number.float({fractionDigits: 2}), complementary_losses: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, lost_cm: faker.number.float({fractionDigits: 2}), lost_units: faker.number.float({fractionDigits: 2})})), explanation: faker.string.alpha({length: {min: 10, max: 20}}), item_name: faker.string.alpha({length: {min: 10, max: 20}}), key: {menu_item_id: faker.string.uuid(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}, net_cm_change: faker.number.float({fractionDigits: 2}), net_cm_change_hi: faker.number.float({fractionDigits: 2}), net_cm_change_lo: faker.number.float({fractionDigits: 2}), recommendation: faker.helpers.arrayElement(Object.values(RemovalRecommendation))},...{branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', decision: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getListRemovalScenariosHandlerResponseDecisionRecordMock()},]), undefined]), id: faker.string.uuid(), run_id: faker.string.uuid()},})))

export const getListMenuItemsResponseMock = (): MenuItemFull[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{addon_slots: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int()})), optional_fields: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})), recipes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({display_order: faker.number.int(), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), price_override: faker.number.int()}))},})))

export const getCreateMenuItemResponseMock = (): MenuItemFull => ({...{base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{addon_slots: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int()})), optional_fields: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})), recipes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({display_order: faker.number.int(), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), price_override: faker.number.int()}))},})

export const getGetMenuItemResponseMock = (): MenuItemFull => ({...{base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{addon_slots: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int()})), optional_fields: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})), recipes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({display_order: faker.number.int(), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), price_override: faker.number.int()}))},})

export const getUpdateMenuItemResponseMock = (overrideResponse: Partial<Extract<MenuItem, object>> = {}): MenuItem => ({base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListAddonSlotsResponseMock = (): AddonSlot[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int()})))

export const getCreateAddonSlotResponseMock = (overrideResponse: Partial<Extract<AddonSlot, object>> = {}): AddonSlot => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int(), ...overrideResponse})

export const getUpdateAddonSlotResponseMock = (overrideResponse: Partial<Extract<AddonSlot, object>> = {}): AddonSlot => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int(), ...overrideResponse})

export const getListOptionalFieldsResponseMock = (): OptionalField[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateOptionalFieldResponseMock = (overrideResponse: Partial<Extract<OptionalField, object>> = {}): OptionalField => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateOptionalFieldResponseMock = (overrideResponse: Partial<Extract<OptionalField, object>> = {}): OptionalField => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListAddonOverridesResponseMock = (): AddonOverride[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_item_name: faker.string.alpha({length: {min: 10, max: 20}}), combo_addon_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), combo_addon_item_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), replaces_ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), replaces_org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getUpsertAddonOverrideResponseMock = (overrideResponse: Partial<Extract<AddonOverride, object>> = {}): AddonOverride => ({addon_item_id: faker.string.uuid(), addon_item_name: faker.string.alpha({length: {min: 10, max: 20}}), combo_addon_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), combo_addon_item_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), replaces_ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), replaces_org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpsertSizeResponseMock = (overrideResponse: Partial<Extract<ItemSize, object>> = {}): ItemSize => ({display_order: faker.number.int(), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), price_override: faker.number.int(), ...overrideResponse})

export const getGetPublicMenuResponseMock = (overrideResponse: Partial<Extract<PublicMenuResponse, object>> = {}): PublicMenuResponse => ({categories: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_slots: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({default_price: faker.number.int(), id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}})), addon_type: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min_selections: faker.number.int()})), base_price: faker.number.int(), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, display_order: faker.number.int(), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), label: faker.string.alpha({length: {min: 10, max: 20}}), price_override: faker.number.int()}))})), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}})), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), org_name: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListOrdersResponseMock = (overrideResponse: Partial<Extract<PaginatedOrders, object>> = {}): PaginatedOrders => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])})), page: faker.number.int(), per_page: faker.number.int(), summary: {completed: faker.number.int(), discounts: faker.number.int(), revenue: faker.number.int(), tips: faker.number.int(), voided: faker.number.int()}, total: faker.number.int(), total_pages: faker.number.int(), ...overrideResponse})

export const getCreateOrderResponseMock = (): OrderFull => ({...{amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_unit_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), deductions_snapshot: {}, id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), name_translations: {}, notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.string.uuid(), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_price: faker.number.int()},...{addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), name_translations: {}, order_item_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), bundle_components: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), component_item_id: faker.string.uuid(), id: faker.string.uuid(), line_total: faker.number.int(), name_translations: {}, order_line_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({component_item_id: faker.string.uuid(), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_line_id: faker.string.uuid(), price: faker.number.int()})), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), undefined]), optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_deducted: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined])}))},}))},})

export const getExportOrdersResponseMock = (overrideResponse: Partial<Extract<ExportResponse, object>> = {}): ExportResponse => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_unit_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), deductions_snapshot: {}, id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), name_translations: {}, notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.string.uuid(), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_price: faker.number.int()},...{addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), name_translations: {}, order_item_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), bundle_components: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), component_item_id: faker.string.uuid(), id: faker.string.uuid(), line_total: faker.number.int(), name_translations: {}, order_line_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({component_item_id: faker.string.uuid(), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_line_id: faker.string.uuid(), price: faker.number.int()})), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), undefined]), optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_deducted: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined])}))},})), payments: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount: faker.number.int(), id: faker.string.uuid(), method: faker.string.alpha({length: {min: 10, max: 20}}), order_id: faker.string.uuid(), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}))},})), generated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ingredient_costs: {
        [faker.string.alphanumeric(5)]: faker.number.int()
      }, summary: {completed: faker.number.int(), discounts: faker.number.int(), revenue: faker.number.int(), tips: faker.number.int(), voided: faker.number.int()}, total: faker.number.int(), ...overrideResponse})

export const getPreviewRecipeResponseMock = (): PreviewIngredient[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity: faker.number.float({fractionDigits: 2}), source: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getGetOrderResponseMock = (): OrderFull => ({...{amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_unit_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), deductions_snapshot: {}, id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), name_translations: {}, notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.string.uuid(), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_price: faker.number.int()},...{addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), name_translations: {}, order_item_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), bundle_components: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), component_item_id: faker.string.uuid(), id: faker.string.uuid(), line_total: faker.number.int(), name_translations: {}, order_line_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({component_item_id: faker.string.uuid(), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_line_id: faker.string.uuid(), price: faker.number.int()})), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), undefined]), optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_deducted: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined])}))},}))},})

export const getVoidOrderResponseMock = (overrideResponse: Partial<Extract<Order, object>> = {}): Order => ({amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ...overrideResponse})

export const getListOrgsResponseMock = (): Org[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2})})))

export const getCreateOrgResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getGetOrgResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getUpdateOrgResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getUploadOrgLogoResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getGetOnboardingResponseMock = (overrideResponse: Partial<Extract<OnboardingStatus, object>> = {}): OnboardingStatus => ({can_complete: faker.datatype.boolean(), completed: faker.datatype.boolean(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), recipe_coverage: faker.number.float({fractionDigits: 2}), steps: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({count: faker.number.int(), done: faker.datatype.boolean(), key: faker.string.alpha({length: {min: 10, max: 20}}), required: faker.datatype.boolean()})), ...overrideResponse})

export const getCompleteOnboardingResponseMock = (overrideResponse: Partial<Extract<OnboardingStatus, object>> = {}): OnboardingStatus => ({can_complete: faker.datatype.boolean(), completed: faker.datatype.boolean(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), recipe_coverage: faker.number.float({fractionDigits: 2}), steps: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({count: faker.number.int(), done: faker.datatype.boolean(), key: faker.string.alpha({length: {min: 10, max: 20}}), required: faker.datatype.boolean()})), ...overrideResponse})

export const getListPaymentMethodsResponseMock = (): OrgPaymentMethod[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getActivatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getDeactivatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', display_order: faker.number.int(), icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getGetPermissionMatrixResponseMock = (): PermissionMatrix[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), effective: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}}), role_default: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), user_override: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])})))

export const getGetRolePermissionsResponseMock = (): RolePermission[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}}), role: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getUpsertRolePermissionResponseMock = (overrideResponse: Partial<Extract<RolePermission, object>> = {}): RolePermission => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}}), role: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getGetUserPermissionsResponseMock = (): Permission[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), id: faker.string.uuid(), resource: faker.string.alpha({length: {min: 10, max: 20}}), user_id: faker.string.uuid()})))

export const getUpsertUserPermissionResponseMock = (overrideResponse: Partial<Extract<Permission, object>> = {}): Permission => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), id: faker.string.uuid(), resource: faker.string.alpha({length: {min: 10, max: 20}}), user_id: faker.string.uuid(), ...overrideResponse})

export const getListPublicOrgsResponseMock = (): PublicOrg[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getListAddonIngredientsResponseMock = (): AddonIngredient[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getUpsertAddonIngredientResponseMock = (overrideResponse: Partial<Extract<AddonIngredient, object>> = {}): AddonIngredient => ({addon_item_id: faker.string.uuid(), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListDrinkRecipesResponseMock = (): DrinkRecipe[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getUpsertDrinkRecipeResponseMock = (overrideResponse: Partial<Extract<DrinkRecipe, object>> = {}): DrinkRecipe => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getBranchAddonSalesResponseMock = (): AddonSalesRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), addon_name_translations: {}, addon_type: faker.string.alpha({length: {min: 10, max: 20}}), quantity_sold: faker.number.int(), revenue: faker.number.int()})))

export const getBranchBundleSalesResponseMock = (): BundleSalesRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_name: faker.string.alpha({length: {min: 10, max: 20}}), quantity_sold: faker.number.int(), revenue: faker.number.int()})))

export const getBranchCombinedItemSalesResponseMock = (): CombinedItemSalesRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_qty: faker.number.int(), item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_name_translations: {}, standalone_qty: faker.number.int(), total_qty: faker.number.int()})))

export const getBranchMenuEngineeringResponseMock = (overrideResponse: Partial<Extract<MenuEngineeringReport, object>> = {}): MenuEngineeringReport => ({branch_id: faker.string.uuid(), cost_basis: faker.string.alpha({length: {min: 10, max: 20}}), excluded_sales: faker.number.int(), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rows: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), category_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), class: faker.string.alpha({length: {min: 10, max: 20}}), cost_missing_lines: faker.number.int(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_profit: faker.number.int(), menu_item_id: faker.string.uuid(), popularity_category: faker.string.alpha({length: {min: 10, max: 20}}), popularity_pct: faker.number.float({fractionDigits: 2}), profit_category: faker.string.alpha({length: {min: 10, max: 20}}), quantity_sold: faker.number.int(), sales: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}}), total_cost: faker.number.int(), total_profit: faker.number.int()})), rows_cost_missing: faker.number.int(), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), total_cost: faker.number.int(), total_profit: faker.number.int(), total_sales: faker.number.int(), ...overrideResponse})

export const getBranchSalesResponseMock = (overrideResponse: Partial<Extract<BranchSalesReport, object>> = {}): BranchSalesReport => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), by_category: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), category_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), category_name_translations: {}, item_count: faker.number.int(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_name_translations: {}, menu_item_id: faker.string.uuid(), quantity_sold: faker.number.int(), revenue: faker.number.int()})), quantity_sold: faker.number.int(), revenue: faker.number.int()})), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), revenue_by_method: {}, subtotal: faker.number.int(), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), top_items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_name_translations: {}, menu_item_id: faker.string.uuid(), quantity_sold: faker.number.int(), revenue: faker.number.int()})), total_discount: faker.number.int(), total_orders: faker.number.int(), total_revenue: faker.number.int(), total_tax: faker.number.int(), voided_orders: faker.number.int(), ...overrideResponse})

export const getBranchSalesTimeseriesResponseMock = (): TimeseriesPoint[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({discount: faker.number.int(), orders: faker.number.int(), period: faker.string.alpha({length: {min: 10, max: 20}}), revenue: faker.number.int(), revenue_by_method: {}, tax: faker.number.int(), voided: faker.number.int()})))

export const getBranchStockResponseMock = (overrideResponse: Partial<Extract<BranchStockReport, object>> = {}): BranchStockReport => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({below_reorder: faker.datatype.boolean(), branch_inventory_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), current_stock: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getBranchTellerStatsResponseMock = (): TellerStats[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({avg_order_value: faker.number.int(), orders: faker.number.int(), revenue: faker.number.int(), shifts: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), voided: faker.number.int()})))

export const getOrgBranchComparisonResponseMock = (overrideResponse: Partial<Extract<OrgComparisonReport, object>> = {}): OrgComparisonReport => ({branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({avg_order_value: faker.number.int(), branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), revenue_by_method: {}, total_orders: faker.number.int(), total_revenue: faker.number.int(), void_rate_pct: faker.number.float({fractionDigits: 2}), voided_orders: faker.number.int()})), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ...overrideResponse})

export const getShiftDeductionsResponseMock = (): DeductionLogRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), inventory_item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_deducted: faker.number.float({fractionDigits: 2}), source: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getShiftInventoryDiscrepanciesResponseMock = (): InventoryDiscrepancy[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({actual_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), branch_inventory_id: faker.string.uuid(), discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), expected_stock: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getShiftSummaryResponseMock = (overrideResponse: Partial<Extract<ShiftSummary, object>> = {}): ShiftSummary => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), revenue_by_method: {}, shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), total_discount: faker.number.int(), total_orders: faker.number.int(), total_revenue: faker.number.int(), total_tax: faker.number.int(), voided_orders: faker.number.int(), ...overrideResponse})

export const getListShiftsResponseMock = (): Shift[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getGetCurrentShiftResponseShiftMock = (overrideResponse: Partial<Shift> = {}): Shift => ({...{branch_id: faker.string.uuid(), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}})}, ...overrideResponse});

export const getGetCurrentShiftResponseMock = (overrideResponse: Partial<Extract<ShiftPreFill, object>> = {}): ShiftPreFill => ({has_open_shift: faker.datatype.boolean(), open_shift: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetCurrentShiftResponseShiftMock()},]), undefined]), suggested_opening_cash: faker.number.int(), ...overrideResponse})

export const getOpenShiftResponseMock = (overrideResponse: Partial<Extract<Shift, object>> = {}): Shift => ({branch_id: faker.string.uuid(), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getGetShiftResponseMock = (overrideResponse: Partial<Extract<Shift, object>> = {}): Shift => ({branch_id: faker.string.uuid(), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListCashMovementsResponseMock = (): CashMovement[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount: faker.number.int(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), moved_by: faker.string.uuid(), moved_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid()})))

export const getAddCashMovementResponseMock = (overrideResponse: Partial<Extract<CashMovement, object>> = {}): CashMovement => ({amount: faker.number.int(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), moved_by: faker.string.uuid(), moved_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), ...overrideResponse})

export const getCloseShiftResponseMock = (overrideResponse: Partial<Extract<CloseShiftResponse, object>> = {}): CloseShiftResponse => ({inventory_counts: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({actual_stock: faker.number.float({fractionDigits: 2}), branch_inventory_id: faker.string.uuid(), discrepancy: faker.number.float({fractionDigits: 2}), expected_stock: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), is_suspicious: faker.datatype.boolean(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}})})), shift: {branch_id: faker.string.uuid(), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}})}, ...overrideResponse})

export const getForceCloseShiftResponseMock = (overrideResponse: Partial<Extract<Shift, object>> = {}): Shift => ({branch_id: faker.string.uuid(), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getGetShiftReportResponseMock = (overrideResponse: Partial<Extract<ShiftReportResponse, object>> = {}): ShiftReportResponse => ({cash_movements: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount: faker.number.int(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', moved_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}})})), cash_movements_in: faker.number.int(), cash_movements_net: faker.number.int(), cash_movements_out: faker.number.int(), net_payments: faker.number.int(), payment_summary: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_cash: faker.datatype.boolean(), order_count: faker.number.int(), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), total: faker.number.int()})), printed_at: faker.date.past().toISOString().slice(0, 19) + 'Z', shift: {branch_id: faker.string.uuid(), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}})}, total_payments: faker.number.int(), voided_amount: faker.number.int(), ...overrideResponse})

export const getUploadMenuItemImageResponseMock = (overrideResponse: Partial<Extract<UploadResponse, object>> = {}): UploadResponse => ({image_url: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListUsersResponseMock = (): UserPublic[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))})))

export const getCreateUserResponseMock = (overrideResponse: Partial<Extract<CreateUserResponse, object>> = {}): CreateUserResponse => ({user: {branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))}, ...overrideResponse})

export const getGetUserResponseMock = (overrideResponse: Partial<Extract<UserPublic, object>> = {}): UserPublic => ({branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole)), ...overrideResponse})

export const getUpdateUserResponseMock = (overrideResponse: Partial<Extract<UserPublic, object>> = {}): UserPublic => ({branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole)), ...overrideResponse})

export const getListUserBranchesResponseMock = (): UserBranch[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}})})))


export const getListAddonItemsMockHandler = (overrideResponse?: AddonItem[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<AddonItem[]> | AddonItem[]), options?: RequestHandlerOptions) => {
  return http.get('*/addon-items', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListAddonItemsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateAddonItemMockHandler = (overrideResponse?: AddonItem | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<AddonItem> | AddonItem), options?: RequestHandlerOptions) => {
  return http.post('*/addon-items', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateAddonItemResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteAddonItemMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/addon-items/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateAddonItemMockHandler = (overrideResponse?: AddonItem | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<AddonItem> | AddonItem), options?: RequestHandlerOptions) => {
  return http.patch('*/addon-items/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateAddonItemResponseMock(),
      { status: 200
      })
  }, options)
}

export const getLoginMockHandler = (overrideResponse?: LoginResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<LoginResponse> | LoginResponse), options?: RequestHandlerOptions) => {
  return http.post('*/auth/login', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getLoginResponseMock(),
      { status: 200
      })
  }, options)
}

export const getMeMockHandler = (overrideResponse?: MeResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MeResponse> | MeResponse), options?: RequestHandlerOptions) => {
  return http.get('*/auth/me', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getMeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetMyPermissionsMockHandler = (overrideResponse?: AuthPermissionsResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<AuthPermissionsResponse> | AuthPermissionsResponse), options?: RequestHandlerOptions) => {
  return http.get('*/auth/permissions', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetMyPermissionsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getResolveBranchMockHandler = (overrideResponse?: ResolveBranchResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<ResolveBranchResponse> | ResolveBranchResponse), options?: RequestHandlerOptions) => {
  return http.post('*/auth/resolve-branch', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getResolveBranchResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListBranchesMockHandler = (overrideResponse?: Branch[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Branch[]> | Branch[]), options?: RequestHandlerOptions) => {
  return http.get('*/branches', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListBranchesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateBranchMockHandler = (overrideResponse?: Branch | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Branch> | Branch), options?: RequestHandlerOptions) => {
  return http.post('*/branches', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateBranchResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetBranchMockHandler = (overrideResponse?: Branch | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Branch> | Branch), options?: RequestHandlerOptions) => {
  return http.get('*/branches/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetBranchResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpdateBranchMockHandler = (overrideResponse?: Branch | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<Branch> | Branch), options?: RequestHandlerOptions) => {
  return http.put('*/branches/:id', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateBranchResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteBranchMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/branches/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getListBundlesMockHandler = (overrideResponse?: PaginatedBundles | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PaginatedBundles> | PaginatedBundles), options?: RequestHandlerOptions) => {
  return http.get('*/bundles', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListBundlesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateBundleMockHandler = (overrideResponse?: BundleWithComponents | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BundleWithComponents> | BundleWithComponents), options?: RequestHandlerOptions) => {
  return http.post('*/bundles', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateBundleResponseMock(),
      { status: 201
      })
  }, options)
}

export const getAvailableBundlesMockHandler = (overrideResponse?: BundleWithComponents[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BundleWithComponents[]> | BundleWithComponents[]), options?: RequestHandlerOptions) => {
  return http.get('*/bundles/available', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getAvailableBundlesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetBundleMockHandler = (overrideResponse?: BundleWithComponents | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BundleWithComponents> | BundleWithComponents), options?: RequestHandlerOptions) => {
  return http.get('*/bundles/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetBundleResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteBundleMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/bundles/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 200
      })
  }, options)
}

export const getUpdateBundleMockHandler = (overrideResponse?: BundleWithComponents | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<BundleWithComponents> | BundleWithComponents), options?: RequestHandlerOptions) => {
  return http.patch('*/bundles/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateBundleResponseMock(),
      { status: 200
      })
  }, options)
}

export const getActivateBundleMockHandler = (overrideResponse?: BundleWithComponents | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BundleWithComponents> | BundleWithComponents), options?: RequestHandlerOptions) => {
  return http.post('*/bundles/:id/activate', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getActivateBundleResponseMock(),
      { status: 200
      })
  }, options)
}

export const getArchiveBundleMockHandler = (overrideResponse?: BundleWithComponents | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BundleWithComponents> | BundleWithComponents), options?: RequestHandlerOptions) => {
  return http.post('*/bundles/:id/archive', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getArchiveBundleResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBundlePerformanceMockHandler = (overrideResponse?: BundlePerformanceResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BundlePerformanceResponse> | BundlePerformanceResponse), options?: RequestHandlerOptions) => {
  return http.get('*/bundles/:id/performance', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBundlePerformanceResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListCategoriesMockHandler = (overrideResponse?: Category[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Category[]> | Category[]), options?: RequestHandlerOptions) => {
  return http.get('*/categories', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListCategoriesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateCategoryMockHandler = (overrideResponse?: Category | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Category> | Category), options?: RequestHandlerOptions) => {
  return http.post('*/categories', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateCategoryResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteCategoryMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/categories/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateCategoryMockHandler = (overrideResponse?: Category | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<Category> | Category), options?: RequestHandlerOptions) => {
  return http.patch('*/categories/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateCategoryResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListAddonCostsMockHandler = (overrideResponse?: AddonCost[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<AddonCost[]> | AddonCost[]), options?: RequestHandlerOptions) => {
  return http.get('*/costing/addon-items', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListAddonCostsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListSkuCostsMockHandler = (overrideResponse?: SkuCost[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<SkuCost[]> | SkuCost[]), options?: RequestHandlerOptions) => {
  return http.get('*/costing/menu-items', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListSkuCostsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListDiscountsMockHandler = (overrideResponse?: Discount[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Discount[]> | Discount[]), options?: RequestHandlerOptions) => {
  return http.get('*/discounts', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListDiscountsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateDiscountMockHandler = (overrideResponse?: Discount | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Discount> | Discount), options?: RequestHandlerOptions) => {
  return http.post('*/discounts', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateDiscountResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteDiscountMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/discounts/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateDiscountMockHandler = (overrideResponse?: Discount | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<Discount> | Discount), options?: RequestHandlerOptions) => {
  return http.patch('*/discounts/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateDiscountResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListAdjustmentsMockHandler = (overrideResponse?: BranchInventoryAdjustment[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchInventoryAdjustment[]> | BranchInventoryAdjustment[]), options?: RequestHandlerOptions) => {
  return http.get('*/inventory/branches/:branchId/adjustments', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListAdjustmentsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateAdjustmentMockHandler = (overrideResponse?: BranchInventoryAdjustment | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BranchInventoryAdjustment> | BranchInventoryAdjustment), options?: RequestHandlerOptions) => {
  return http.post('*/inventory/branches/:branchId/adjustments', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateAdjustmentResponseMock(),
      { status: 201
      })
  }, options)
}

export const getListBranchStockMockHandler = (overrideResponse?: BranchInventoryItem[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchInventoryItem[]> | BranchInventoryItem[]), options?: RequestHandlerOptions) => {
  return http.get('*/inventory/branches/:branchId/stock', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListBranchStockResponseMock(),
      { status: 200
      })
  }, options)
}

export const getAddToBranchStockMockHandler = (overrideResponse?: BranchInventoryItem | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BranchInventoryItem> | BranchInventoryItem), options?: RequestHandlerOptions) => {
  return http.post('*/inventory/branches/:branchId/stock', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getAddToBranchStockResponseMock(),
      { status: 201
      })
  }, options)
}

export const getRemoveFromBranchStockMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/inventory/branches/:branchId/stock/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateBranchStockMockHandler = (overrideResponse?: BranchInventoryItem | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<BranchInventoryItem> | BranchInventoryItem), options?: RequestHandlerOptions) => {
  return http.patch('*/inventory/branches/:branchId/stock/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateBranchStockResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListTransfersMockHandler = (overrideResponse?: BranchInventoryTransfer[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchInventoryTransfer[]> | BranchInventoryTransfer[]), options?: RequestHandlerOptions) => {
  return http.get('*/inventory/branches/:branchId/transfers', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListTransfersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListCatalogMockHandler = (overrideResponse?: OrgIngredient[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OrgIngredient[]> | OrgIngredient[]), options?: RequestHandlerOptions) => {
  return http.get('*/inventory/orgs/:orgId/catalog', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListCatalogResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateCatalogItemMockHandler = (overrideResponse?: OrgIngredient | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OrgIngredient> | OrgIngredient), options?: RequestHandlerOptions) => {
  return http.post('*/inventory/orgs/:orgId/catalog', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateCatalogItemResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteCatalogItemMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/inventory/orgs/:orgId/catalog/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateCatalogItemMockHandler = (overrideResponse?: OrgIngredient | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<OrgIngredient> | OrgIngredient), options?: RequestHandlerOptions) => {
  return http.patch('*/inventory/orgs/:orgId/catalog/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateCatalogItemResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateTransferMockHandler = (overrideResponse?: BranchInventoryTransfer | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BranchInventoryTransfer> | BranchInventoryTransfer), options?: RequestHandlerOptions) => {
  return http.post('*/inventory/transfers', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateTransferResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteTransferMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/inventory/transfers/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateTransferMockHandler = (overrideResponse?: BranchInventoryTransfer | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<BranchInventoryTransfer> | BranchInventoryTransfer), options?: RequestHandlerOptions) => {
  return http.patch('*/inventory/transfers/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateTransferResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetCalibrationHandlerMockHandler = (overrideResponse?: CalibrationSummary | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<CalibrationSummary> | CalibrationSummary), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/branches/:branchId/calibration', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetCalibrationHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListDecisionsHandlerMockHandler = (overrideResponse?: DecisionRecord[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DecisionRecord[]> | DecisionRecord[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/branches/:branchId/decisions', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListDecisionsHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetLatestItemKpiHandlerMockHandler = (overrideResponse?: PriceSuggestionRecord | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PriceSuggestionRecord> | PriceSuggestionRecord), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/branches/:branchId/items/:menuItemId/sizes/:sizeLabel/latest-kpi', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetLatestItemKpiHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListRunsHandlerMockHandler = (overrideResponse?: PersistedRun[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PersistedRun[]> | PersistedRun[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/branches/:branchId/runs', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListRunsHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateRunHandlerMockHandler = (overrideResponse?: CreateRunResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<CreateRunResponse> | CreateRunResponse), options?: RequestHandlerOptions) => {
  return http.post('*/menu-advisor/branches/:branchId/runs', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateRunHandlerResponseMock(),
      { status: 202
      })
  }, options)
}

export const getGetActiveRunHandlerMockHandler = (overrideResponse?: PersistedRun | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PersistedRun> | PersistedRun), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/branches/:branchId/runs/active', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetActiveRunHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetLatestRunHandlerMockHandler = (overrideResponse?: PersistedRun | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PersistedRun> | PersistedRun), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/branches/:branchId/runs/latest', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetLatestRunHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetBundleSuggestionHandlerMockHandler = (overrideResponse?: BundleSuggestionRecord | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BundleSuggestionRecord> | BundleSuggestionRecord), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/bundle-suggestions/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetBundleSuggestionHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSetBundlePromotedHandlerMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.post('*/menu-advisor/bundle-suggestions/:id/promote', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 200
      })
  }, options)
}

export const getRecordDecisionHandlerMockHandler = (overrideResponse?: DecisionRecord | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DecisionRecord> | DecisionRecord), options?: RequestHandlerOptions) => {
  return http.post('*/menu-advisor/decisions', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getRecordDecisionHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetPriceSuggestionHandlerMockHandler = (overrideResponse?: PriceSuggestionRecord | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PriceSuggestionRecord> | PriceSuggestionRecord), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/price-suggestions/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetPriceSuggestionHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetRemovalScenarioHandlerMockHandler = (overrideResponse?: RemovalScenarioRecord | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<RemovalScenarioRecord> | RemovalScenarioRecord), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/removal-scenarios/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetRemovalScenarioHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetRunHandlerMockHandler = (overrideResponse?: PersistedRun | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PersistedRun> | PersistedRun), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/runs/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetRunHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListBundleSuggestionsHandlerMockHandler = (overrideResponse?: BundleSuggestionRecord[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BundleSuggestionRecord[]> | BundleSuggestionRecord[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/runs/:id/bundle-suggestions', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListBundleSuggestionsHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListPriceSuggestionsHandlerMockHandler = (overrideResponse?: PriceSuggestionRecord[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PriceSuggestionRecord[]> | PriceSuggestionRecord[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/runs/:id/price-suggestions', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListPriceSuggestionsHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListRemovalScenariosHandlerMockHandler = (overrideResponse?: RemovalScenarioRecord[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<RemovalScenarioRecord[]> | RemovalScenarioRecord[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-advisor/runs/:id/removal-scenarios', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListRemovalScenariosHandlerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListMenuItemsMockHandler = (overrideResponse?: MenuItemFull[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MenuItemFull[]> | MenuItemFull[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-items', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListMenuItemsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateMenuItemMockHandler = (overrideResponse?: MenuItemFull | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<MenuItemFull> | MenuItemFull), options?: RequestHandlerOptions) => {
  return http.post('*/menu-items', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateMenuItemResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetMenuItemMockHandler = (overrideResponse?: MenuItemFull | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MenuItemFull> | MenuItemFull), options?: RequestHandlerOptions) => {
  return http.get('*/menu-items/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetMenuItemResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteMenuItemMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/menu-items/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateMenuItemMockHandler = (overrideResponse?: MenuItem | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<MenuItem> | MenuItem), options?: RequestHandlerOptions) => {
  return http.patch('*/menu-items/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateMenuItemResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListAddonSlotsMockHandler = (overrideResponse?: AddonSlot[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<AddonSlot[]> | AddonSlot[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-items/:id/addon-slots', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListAddonSlotsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateAddonSlotMockHandler = (overrideResponse?: AddonSlot | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<AddonSlot> | AddonSlot), options?: RequestHandlerOptions) => {
  return http.post('*/menu-items/:id/addon-slots', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateAddonSlotResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteAddonSlotMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/menu-items/:id/addon-slots/:slotId', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateAddonSlotMockHandler = (overrideResponse?: AddonSlot | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<AddonSlot> | AddonSlot), options?: RequestHandlerOptions) => {
  return http.patch('*/menu-items/:id/addon-slots/:slotId', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateAddonSlotResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListOptionalFieldsMockHandler = (overrideResponse?: OptionalField[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OptionalField[]> | OptionalField[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-items/:id/optionals', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListOptionalFieldsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateOptionalFieldMockHandler = (overrideResponse?: OptionalField | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OptionalField> | OptionalField), options?: RequestHandlerOptions) => {
  return http.post('*/menu-items/:id/optionals', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateOptionalFieldResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteOptionalFieldMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/menu-items/:id/optionals/:fieldId', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateOptionalFieldMockHandler = (overrideResponse?: OptionalField | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<OptionalField> | OptionalField), options?: RequestHandlerOptions) => {
  return http.patch('*/menu-items/:id/optionals/:fieldId', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateOptionalFieldResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListAddonOverridesMockHandler = (overrideResponse?: AddonOverride[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<AddonOverride[]> | AddonOverride[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-items/:id/overrides', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListAddonOverridesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertAddonOverrideMockHandler = (overrideResponse?: AddonOverride | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<AddonOverride> | AddonOverride), options?: RequestHandlerOptions) => {
  return http.post('*/menu-items/:id/overrides', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertAddonOverrideResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteAddonOverrideMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/menu-items/:id/overrides/:overrideId', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpsertSizeMockHandler = (overrideResponse?: ItemSize | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<ItemSize> | ItemSize), options?: RequestHandlerOptions) => {
  return http.post('*/menu-items/:id/sizes', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertSizeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteSizeMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/menu-items/:id/sizes/:sid', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getGetPublicMenuMockHandler = (overrideResponse?: PublicMenuResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PublicMenuResponse> | PublicMenuResponse), options?: RequestHandlerOptions) => {
  return http.get('*/menu/public/:orgId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetPublicMenuResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListOrdersMockHandler = (overrideResponse?: PaginatedOrders | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PaginatedOrders> | PaginatedOrders), options?: RequestHandlerOptions) => {
  return http.get('*/orders', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListOrdersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateOrderMockHandler = (overrideResponse?: OrderFull | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OrderFull> | OrderFull), options?: RequestHandlerOptions) => {
  return http.post('*/orders', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateOrderResponseMock(),
      { status: 201
      })
  }, options)
}

export const getExportOrdersMockHandler = (overrideResponse?: ExportResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ExportResponse> | ExportResponse), options?: RequestHandlerOptions) => {
  return http.get('*/orders/export', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getExportOrdersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPreviewRecipeMockHandler = (overrideResponse?: PreviewIngredient[] | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<PreviewIngredient[]> | PreviewIngredient[]), options?: RequestHandlerOptions) => {
  return http.post('*/orders/preview-recipe', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPreviewRecipeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetOrderMockHandler = (overrideResponse?: OrderFull | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OrderFull> | OrderFull), options?: RequestHandlerOptions) => {
  return http.get('*/orders/:orderId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getVoidOrderMockHandler = (overrideResponse?: Order | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Order> | Order), options?: RequestHandlerOptions) => {
  return http.post('*/orders/:orderId/void', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getVoidOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListOrgsMockHandler = (overrideResponse?: Org[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Org[]> | Org[]), options?: RequestHandlerOptions) => {
  return http.get('*/orgs', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListOrgsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateOrgMockHandler = (overrideResponse?: Org | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Org> | Org), options?: RequestHandlerOptions) => {
  return http.post('*/orgs', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateOrgResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetOrgMockHandler = (overrideResponse?: Org | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Org> | Org), options?: RequestHandlerOptions) => {
  return http.get('*/orgs/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetOrgResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteOrgMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/orgs/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateOrgMockHandler = (overrideResponse?: Org | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<Org> | Org), options?: RequestHandlerOptions) => {
  return http.patch('*/orgs/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateOrgResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUploadOrgLogoMockHandler = (overrideResponse?: Org | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<Org> | Org), options?: RequestHandlerOptions) => {
  return http.put('*/orgs/:id/logo', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUploadOrgLogoResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetOnboardingMockHandler = (overrideResponse?: OnboardingStatus | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OnboardingStatus> | OnboardingStatus), options?: RequestHandlerOptions) => {
  return http.get('*/orgs/:id/onboarding', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetOnboardingResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCompleteOnboardingMockHandler = (overrideResponse?: OnboardingStatus | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OnboardingStatus> | OnboardingStatus), options?: RequestHandlerOptions) => {
  return http.post('*/orgs/:id/onboarding/complete', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCompleteOnboardingResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListPaymentMethodsMockHandler = (overrideResponse?: OrgPaymentMethod[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OrgPaymentMethod[]> | OrgPaymentMethod[]), options?: RequestHandlerOptions) => {
  return http.get('*/payment-methods', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListPaymentMethodsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreatePaymentMethodMockHandler = (overrideResponse?: OrgPaymentMethod | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OrgPaymentMethod> | OrgPaymentMethod), options?: RequestHandlerOptions) => {
  return http.post('*/payment-methods', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreatePaymentMethodResponseMock(),
      { status: 201
      })
  }, options)
}

export const getUpdatePaymentMethodMockHandler = (overrideResponse?: OrgPaymentMethod | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<OrgPaymentMethod> | OrgPaymentMethod), options?: RequestHandlerOptions) => {
  return http.put('*/payment-methods/:id', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdatePaymentMethodResponseMock(),
      { status: 200
      })
  }, options)
}

export const getActivatePaymentMethodMockHandler = (overrideResponse?: OrgPaymentMethod | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OrgPaymentMethod> | OrgPaymentMethod), options?: RequestHandlerOptions) => {
  return http.post('*/payment-methods/:id/activate', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getActivatePaymentMethodResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeactivatePaymentMethodMockHandler = (overrideResponse?: OrgPaymentMethod | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OrgPaymentMethod> | OrgPaymentMethod), options?: RequestHandlerOptions) => {
  return http.post('*/payment-methods/:id/deactivate', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getDeactivatePaymentMethodResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetPermissionMatrixMockHandler = (overrideResponse?: PermissionMatrix[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PermissionMatrix[]> | PermissionMatrix[]), options?: RequestHandlerOptions) => {
  return http.get('*/permissions/matrix/:userId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetPermissionMatrixResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetRolePermissionsMockHandler = (overrideResponse?: RolePermission[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<RolePermission[]> | RolePermission[]), options?: RequestHandlerOptions) => {
  return http.get('*/permissions/roles', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetRolePermissionsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertRolePermissionMockHandler = (overrideResponse?: RolePermission | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<RolePermission> | RolePermission), options?: RequestHandlerOptions) => {
  return http.put('*/permissions/roles', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertRolePermissionResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetUserPermissionsMockHandler = (overrideResponse?: Permission[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Permission[]> | Permission[]), options?: RequestHandlerOptions) => {
  return http.get('*/permissions/user/:userId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetUserPermissionsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertUserPermissionMockHandler = (overrideResponse?: Permission | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<Permission> | Permission), options?: RequestHandlerOptions) => {
  return http.put('*/permissions/user/:userId', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertUserPermissionResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteUserPermissionMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/permissions/user/:userId/:resource/:action', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getListPublicOrgsMockHandler = (overrideResponse?: PublicOrg[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PublicOrg[]> | PublicOrg[]), options?: RequestHandlerOptions) => {
  return http.get('*/public/orgs', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListPublicOrgsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListAddonIngredientsMockHandler = (overrideResponse?: AddonIngredient[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<AddonIngredient[]> | AddonIngredient[]), options?: RequestHandlerOptions) => {
  return http.get('*/recipes/addons/:addonItemId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListAddonIngredientsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertAddonIngredientMockHandler = (overrideResponse?: AddonIngredient | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<AddonIngredient> | AddonIngredient), options?: RequestHandlerOptions) => {
  return http.post('*/recipes/addons/:addonItemId', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertAddonIngredientResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteAddonIngredientMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/recipes/addons/:addonItemId', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getListDrinkRecipesMockHandler = (overrideResponse?: DrinkRecipe[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DrinkRecipe[]> | DrinkRecipe[]), options?: RequestHandlerOptions) => {
  return http.get('*/recipes/drinks/:menuItemId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListDrinkRecipesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertDrinkRecipeMockHandler = (overrideResponse?: DrinkRecipe | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DrinkRecipe> | DrinkRecipe), options?: RequestHandlerOptions) => {
  return http.post('*/recipes/drinks/:menuItemId', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertDrinkRecipeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteDrinkRecipeMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/recipes/drinks/:menuItemId/:size', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getBranchAddonSalesMockHandler = (overrideResponse?: AddonSalesRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<AddonSalesRow[]> | AddonSalesRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/addons', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchAddonSalesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchBundleSalesMockHandler = (overrideResponse?: BundleSalesRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BundleSalesRow[]> | BundleSalesRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/bundles', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchBundleSalesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchCombinedItemSalesMockHandler = (overrideResponse?: CombinedItemSalesRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<CombinedItemSalesRow[]> | CombinedItemSalesRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/items-combined', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchCombinedItemSalesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchMenuEngineeringMockHandler = (overrideResponse?: MenuEngineeringReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MenuEngineeringReport> | MenuEngineeringReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/menu-engineering', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchMenuEngineeringResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchSalesMockHandler = (overrideResponse?: BranchSalesReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchSalesReport> | BranchSalesReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/sales', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchSalesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchSalesTimeseriesMockHandler = (overrideResponse?: TimeseriesPoint[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<TimeseriesPoint[]> | TimeseriesPoint[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/sales/timeseries', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchSalesTimeseriesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchStockMockHandler = (overrideResponse?: BranchStockReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchStockReport> | BranchStockReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/stock', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchStockResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchTellerStatsMockHandler = (overrideResponse?: TellerStats[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<TellerStats[]> | TellerStats[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/tellers', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchTellerStatsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getOrgBranchComparisonMockHandler = (overrideResponse?: OrgComparisonReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OrgComparisonReport> | OrgComparisonReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/orgs/:orgId/comparison', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOrgBranchComparisonResponseMock(),
      { status: 200
      })
  }, options)
}

export const getShiftDeductionsMockHandler = (overrideResponse?: DeductionLogRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DeductionLogRow[]> | DeductionLogRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/shifts/:shiftId/deductions', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getShiftDeductionsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getShiftInventoryDiscrepanciesMockHandler = (overrideResponse?: InventoryDiscrepancy[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<InventoryDiscrepancy[]> | InventoryDiscrepancy[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/shifts/:shiftId/inventory', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getShiftInventoryDiscrepanciesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getShiftSummaryMockHandler = (overrideResponse?: ShiftSummary | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ShiftSummary> | ShiftSummary), options?: RequestHandlerOptions) => {
  return http.get('*/reports/shifts/:shiftId/summary', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getShiftSummaryResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListShiftsMockHandler = (overrideResponse?: Shift[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Shift[]> | Shift[]), options?: RequestHandlerOptions) => {
  return http.get('*/shifts/branches/:branchId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListShiftsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetCurrentShiftMockHandler = (overrideResponse?: ShiftPreFill | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ShiftPreFill> | ShiftPreFill), options?: RequestHandlerOptions) => {
  return http.get('*/shifts/branches/:branchId/current', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetCurrentShiftResponseMock(),
      { status: 200
      })
  }, options)
}

export const getOpenShiftMockHandler = (overrideResponse?: Shift | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Shift> | Shift), options?: RequestHandlerOptions) => {
  return http.post('*/shifts/branches/:branchId/open', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOpenShiftResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetShiftMockHandler = (overrideResponse?: Shift | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Shift> | Shift), options?: RequestHandlerOptions) => {
  return http.get('*/shifts/:shiftId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetShiftResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteShiftMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/shifts/:shiftId', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getListCashMovementsMockHandler = (overrideResponse?: CashMovement[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<CashMovement[]> | CashMovement[]), options?: RequestHandlerOptions) => {
  return http.get('*/shifts/:shiftId/cash-movements', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListCashMovementsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getAddCashMovementMockHandler = (overrideResponse?: CashMovement | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<CashMovement> | CashMovement), options?: RequestHandlerOptions) => {
  return http.post('*/shifts/:shiftId/cash-movements', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getAddCashMovementResponseMock(),
      { status: 201
      })
  }, options)
}

export const getCloseShiftMockHandler = (overrideResponse?: CloseShiftResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<CloseShiftResponse> | CloseShiftResponse), options?: RequestHandlerOptions) => {
  return http.post('*/shifts/:shiftId/close', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCloseShiftResponseMock(),
      { status: 200
      })
  }, options)
}

export const getForceCloseShiftMockHandler = (overrideResponse?: Shift | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Shift> | Shift), options?: RequestHandlerOptions) => {
  return http.post('*/shifts/:shiftId/force-close', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getForceCloseShiftResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetShiftReportMockHandler = (overrideResponse?: ShiftReportResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ShiftReportResponse> | ShiftReportResponse), options?: RequestHandlerOptions) => {
  return http.get('*/shifts/:shiftId/report', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetShiftReportResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUploadMenuItemImageMockHandler = (overrideResponse?: UploadResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<UploadResponse> | UploadResponse), options?: RequestHandlerOptions) => {
  return http.post('*/uploads/menu-items/:menuItemId', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUploadMenuItemImageResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListUsersMockHandler = (overrideResponse?: UserPublic[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<UserPublic[]> | UserPublic[]), options?: RequestHandlerOptions) => {
  return http.get('*/users', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListUsersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateUserMockHandler = (overrideResponse?: CreateUserResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<CreateUserResponse> | CreateUserResponse), options?: RequestHandlerOptions) => {
  return http.post('*/users', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateUserResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetUserMockHandler = (overrideResponse?: UserPublic | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<UserPublic> | UserPublic), options?: RequestHandlerOptions) => {
  return http.get('*/users/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetUserResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteUserMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/users/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateUserMockHandler = (overrideResponse?: UserPublic | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<UserPublic> | UserPublic), options?: RequestHandlerOptions) => {
  return http.patch('*/users/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateUserResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListUserBranchesMockHandler = (overrideResponse?: UserBranch[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<UserBranch[]> | UserBranch[]), options?: RequestHandlerOptions) => {
  return http.get('*/users/:id/branches', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListUserBranchesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getAssignBranchMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.post('*/users/:id/branches', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUnassignBranchMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/users/:id/branches/:branchId', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}
export const getSufrixAPIMock = () => [
  getListAddonItemsMockHandler(),
  getCreateAddonItemMockHandler(),
  getDeleteAddonItemMockHandler(),
  getUpdateAddonItemMockHandler(),
  getLoginMockHandler(),
  getMeMockHandler(),
  getGetMyPermissionsMockHandler(),
  getResolveBranchMockHandler(),
  getListBranchesMockHandler(),
  getCreateBranchMockHandler(),
  getGetBranchMockHandler(),
  getUpdateBranchMockHandler(),
  getDeleteBranchMockHandler(),
  getListBundlesMockHandler(),
  getCreateBundleMockHandler(),
  getAvailableBundlesMockHandler(),
  getGetBundleMockHandler(),
  getDeleteBundleMockHandler(),
  getUpdateBundleMockHandler(),
  getActivateBundleMockHandler(),
  getArchiveBundleMockHandler(),
  getBundlePerformanceMockHandler(),
  getListCategoriesMockHandler(),
  getCreateCategoryMockHandler(),
  getDeleteCategoryMockHandler(),
  getUpdateCategoryMockHandler(),
  getListAddonCostsMockHandler(),
  getListSkuCostsMockHandler(),
  getListDiscountsMockHandler(),
  getCreateDiscountMockHandler(),
  getDeleteDiscountMockHandler(),
  getUpdateDiscountMockHandler(),
  getListAdjustmentsMockHandler(),
  getCreateAdjustmentMockHandler(),
  getListBranchStockMockHandler(),
  getAddToBranchStockMockHandler(),
  getRemoveFromBranchStockMockHandler(),
  getUpdateBranchStockMockHandler(),
  getListTransfersMockHandler(),
  getListCatalogMockHandler(),
  getCreateCatalogItemMockHandler(),
  getDeleteCatalogItemMockHandler(),
  getUpdateCatalogItemMockHandler(),
  getCreateTransferMockHandler(),
  getDeleteTransferMockHandler(),
  getUpdateTransferMockHandler(),
  getGetCalibrationHandlerMockHandler(),
  getListDecisionsHandlerMockHandler(),
  getGetLatestItemKpiHandlerMockHandler(),
  getListRunsHandlerMockHandler(),
  getCreateRunHandlerMockHandler(),
  getGetActiveRunHandlerMockHandler(),
  getGetLatestRunHandlerMockHandler(),
  getGetBundleSuggestionHandlerMockHandler(),
  getSetBundlePromotedHandlerMockHandler(),
  getRecordDecisionHandlerMockHandler(),
  getGetPriceSuggestionHandlerMockHandler(),
  getGetRemovalScenarioHandlerMockHandler(),
  getGetRunHandlerMockHandler(),
  getListBundleSuggestionsHandlerMockHandler(),
  getListPriceSuggestionsHandlerMockHandler(),
  getListRemovalScenariosHandlerMockHandler(),
  getListMenuItemsMockHandler(),
  getCreateMenuItemMockHandler(),
  getGetMenuItemMockHandler(),
  getDeleteMenuItemMockHandler(),
  getUpdateMenuItemMockHandler(),
  getListAddonSlotsMockHandler(),
  getCreateAddonSlotMockHandler(),
  getDeleteAddonSlotMockHandler(),
  getUpdateAddonSlotMockHandler(),
  getListOptionalFieldsMockHandler(),
  getCreateOptionalFieldMockHandler(),
  getDeleteOptionalFieldMockHandler(),
  getUpdateOptionalFieldMockHandler(),
  getListAddonOverridesMockHandler(),
  getUpsertAddonOverrideMockHandler(),
  getDeleteAddonOverrideMockHandler(),
  getUpsertSizeMockHandler(),
  getDeleteSizeMockHandler(),
  getGetPublicMenuMockHandler(),
  getListOrdersMockHandler(),
  getCreateOrderMockHandler(),
  getExportOrdersMockHandler(),
  getPreviewRecipeMockHandler(),
  getGetOrderMockHandler(),
  getVoidOrderMockHandler(),
  getListOrgsMockHandler(),
  getCreateOrgMockHandler(),
  getGetOrgMockHandler(),
  getDeleteOrgMockHandler(),
  getUpdateOrgMockHandler(),
  getUploadOrgLogoMockHandler(),
  getGetOnboardingMockHandler(),
  getCompleteOnboardingMockHandler(),
  getListPaymentMethodsMockHandler(),
  getCreatePaymentMethodMockHandler(),
  getUpdatePaymentMethodMockHandler(),
  getActivatePaymentMethodMockHandler(),
  getDeactivatePaymentMethodMockHandler(),
  getGetPermissionMatrixMockHandler(),
  getGetRolePermissionsMockHandler(),
  getUpsertRolePermissionMockHandler(),
  getGetUserPermissionsMockHandler(),
  getUpsertUserPermissionMockHandler(),
  getDeleteUserPermissionMockHandler(),
  getListPublicOrgsMockHandler(),
  getListAddonIngredientsMockHandler(),
  getUpsertAddonIngredientMockHandler(),
  getDeleteAddonIngredientMockHandler(),
  getListDrinkRecipesMockHandler(),
  getUpsertDrinkRecipeMockHandler(),
  getDeleteDrinkRecipeMockHandler(),
  getBranchAddonSalesMockHandler(),
  getBranchBundleSalesMockHandler(),
  getBranchCombinedItemSalesMockHandler(),
  getBranchMenuEngineeringMockHandler(),
  getBranchSalesMockHandler(),
  getBranchSalesTimeseriesMockHandler(),
  getBranchStockMockHandler(),
  getBranchTellerStatsMockHandler(),
  getOrgBranchComparisonMockHandler(),
  getShiftDeductionsMockHandler(),
  getShiftInventoryDiscrepanciesMockHandler(),
  getShiftSummaryMockHandler(),
  getListShiftsMockHandler(),
  getGetCurrentShiftMockHandler(),
  getOpenShiftMockHandler(),
  getGetShiftMockHandler(),
  getDeleteShiftMockHandler(),
  getListCashMovementsMockHandler(),
  getAddCashMovementMockHandler(),
  getCloseShiftMockHandler(),
  getForceCloseShiftMockHandler(),
  getGetShiftReportMockHandler(),
  getUploadMenuItemImageMockHandler(),
  getListUsersMockHandler(),
  getCreateUserMockHandler(),
  getGetUserMockHandler(),
  getDeleteUserMockHandler(),
  getUpdateUserMockHandler(),
  getListUserBranchesMockHandler(),
  getAssignBranchMockHandler(),
  getUnassignBranchMockHandler()
]
