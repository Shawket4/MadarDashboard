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
  BundleStatus,
  ChartHint,
  ColumnKind,
  PrinterBrand,
  UserRole
} from './models';
import type {
  AddonCost,
  AddonIngredient,
  AddonItem,
  AddonOverride,
  AddonSalesRow,
  AddonSlot,
  AiChatResponse,
  AuthPermissionsResponse,
  BookingView,
  Branch,
  BranchAddonOverride,
  BranchDeliverySettings,
  BranchInventoryItem,
  BranchInventoryMovement,
  BranchInventoryTransfer,
  BranchMenuOverride,
  BranchSalesReport,
  BranchStockReport,
  BranchTable,
  BundlePerformanceResponse,
  BundleSalesRow,
  BundleWithComponents,
  CashMovement,
  CatalogSyncResponse,
  Category,
  ChannelAddonOverride,
  ChannelMenuOverride,
  CloseShiftResponse,
  CombinedItemSalesRow,
  ConsumptionRow,
  CreateUserResponse,
  DecisionOut,
  DeductionLogRow,
  DeliveryMenu,
  DeliveryMenuDiscount,
  DeliveryOrder,
  DeliverySalesReport,
  DeliveryTracking,
  DeliveryZone,
  Discount,
  DrinkRecipe,
  ExportResponse,
  FinalizeResponse,
  FloorSection,
  FloorTable,
  GoodsReceipt,
  GroupOptionOut,
  GroupOut,
  GuestSavedLocation,
  InventoryValuationReport,
  ItemOptionOut,
  ItemSize,
  KitchenStation,
  KitchenTicketView,
  LoginResponse,
  LowStockRow,
  MarginLedgerReport,
  MarginTargets,
  MarginWatch,
  MarketingLink,
  MeResponse,
  MenuItem,
  MenuItemFull,
  OfflineAuthBundle,
  OnboardingStatus,
  OpenTicketView,
  OptionRecipeLineInput,
  OptionalField,
  Order,
  OrderDeliveryInfo,
  OrderFull,
  OrderHistorySummary,
  Org,
  OrgComparisonReport,
  OrgIngredient,
  OrgInventorySettings,
  OrgPaymentMethod,
  OtpRequestResponse,
  OtpVerifyResponse,
  PaginatedAddonItems,
  PaginatedBundles,
  PaginatedMenuItems,
  PaginatedOrders,
  PaginatedShifts,
  PeakHourPoint,
  Permission,
  PermissionMatrix,
  PreviewIngredient,
  PriceOverrideOut,
  PublicBooking,
  PublicBranch,
  PublicOrg,
  PurchaseOrder,
  PurchaseOrderFull,
  QrResponse,
  QuoteResponse,
  RecipeCostResult,
  ReorderSuggestion,
  ReservationSettings,
  ResolveBranchResponse,
  RolePermission,
  RoutingModeResponse,
  Shift,
  ShiftPreFill,
  ShiftReportResponse,
  ShiftSummary,
  ShrinkageRow,
  SizeCostOut,
  SkuCost,
  StationRoutes,
  Stocktake,
  StocktakeFull,
  StudioAggregate,
  Supplier,
  TellerStats,
  Till,
  TimeseriesPoint,
  UploadResponse,
  UserBranch,
  UserPublic,
  VarianceReport,
  WaiterStatsReport,
  WasteReportRow,
  WhatsappStatus
} from './models';


export const getListAddonItemsResponseMock = (): AddonItem[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_price: faker.number.int(), id: faker.string.uuid(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2})})), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), primary_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateAddonItemResponseMock = (overrideResponse: Partial<Extract<AddonItem, object>> = {}): AddonItem => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_price: faker.number.int(), id: faker.string.uuid(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2})})), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), primary_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListAddonCatalogResponseMock = (overrideResponse: Partial<Extract<PaginatedAddonItems, object>> = {}): PaginatedAddonItems => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_price: faker.number.int(), id: faker.string.uuid(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2})})), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), primary_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})), page: faker.number.int(), per_page: faker.number.int(), total: faker.number.int(), total_pages: faker.number.int(), ...overrideResponse})

export const getUpdateAddonItemResponseMock = (overrideResponse: Partial<Extract<AddonItem, object>> = {}): AddonItem => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_price: faker.number.int(), id: faker.string.uuid(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2})})), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), primary_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getChatResponseMock = (overrideResponse: Partial<Extract<AiChatResponse, object>> = {}): AiChatResponse => ({chart: faker.helpers.arrayElement(Object.values(ChartHint)), columns: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({key: faker.string.alpha({length: {min: 10, max: 20}}), kind: faker.helpers.arrayElement(Object.values(ColumnKind)), label: faker.string.alpha({length: {min: 10, max: 20}})})), provider: faker.string.alpha({length: {min: 10, max: 20}}), report_id: faker.string.alpha({length: {min: 10, max: 20}}), row_count: faker.number.int({min: 0}), rows: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({
        [faker.string.alphanumeric(5)]: {}
      })), scope: {all_branches: faker.datatype.boolean(), branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.alpha({length: {min: 10, max: 20}}))), label: faker.string.alpha({length: {min: 10, max: 20}}), unmatched_branch: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}, summary: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), title: faker.string.alpha({length: {min: 10, max: 20}}), truncated: faker.datatype.boolean(), ...overrideResponse})

export const getLoginResponseMock = (overrideResponse: Partial<Extract<LoginResponse, object>> = {}): LoginResponse => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), token: faker.string.alpha({length: {min: 10, max: 20}}), user: {branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))}, ...overrideResponse})

export const getMeResponseMock = (overrideResponse: Partial<Extract<MeResponse, object>> = {}): MeResponse => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), user: {branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))}, ...overrideResponse})

export const getGetMyPermissionsResponseMock = (overrideResponse: Partial<Extract<AuthPermissionsResponse, object>> = {}): AuthPermissionsResponse => ({permissions: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getResolveBranchResponseMock = (overrideResponse: Partial<Extract<ResolveBranchResponse, object>> = {}): ResolveBranchResponse => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), distance_meters: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getListBranchAddonOverridesResponseMock = (): BranchAddonOverride[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), branch_id: faker.string.uuid(), is_available: faker.datatype.boolean(), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getUpsertBranchAddonOverrideResponseMock = (overrideResponse: Partial<Extract<BranchAddonOverride, object>> = {}): BranchAddonOverride => ({addon_item_id: faker.string.uuid(), branch_id: faker.string.uuid(), is_available: faker.datatype.boolean(), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListBranchMenuOverridesResponseMock = (): BranchMenuOverride[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), is_available: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), sizes: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({price_override: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getUpsertBranchMenuOverrideResponseMock = (overrideResponse: Partial<Extract<BranchMenuOverride, object>> = {}): BranchMenuOverride => ({branch_id: faker.string.uuid(), is_available: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), sizes: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({price_override: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListBranchesResponseMock = (): Branch[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), code: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateBranchResponseMock = (overrideResponse: Partial<Extract<Branch, object>> = {}): Branch => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), code: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getGetBranchResponseMock = (overrideResponse: Partial<Extract<Branch, object>> = {}): Branch => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), code: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateBranchResponseMock = (overrideResponse: Partial<Extract<Branch, object>> = {}): Branch => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), code: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', geo_radius_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), latitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), longitude: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), org_logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), timezone: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getBranchQrResponseMock = (overrideResponse: Partial<Extract<QrResponse, object>> = {}): QrResponse => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), long_url: faker.string.alpha({length: {min: 10, max: 20}}), qr_data_url: faker.string.alpha({length: {min: 10, max: 20}}), short_code: faker.string.alpha({length: {min: 10, max: 20}}), short_url: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListTablesResponseMock = (): BranchTable[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateTableResponseMock = (overrideResponse: Partial<Extract<BranchTable, object>> = {}): BranchTable => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getTableQrResponseMock = (overrideResponse: Partial<Extract<QrResponse, object>> = {}): QrResponse => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), long_url: faker.string.alpha({length: {min: 10, max: 20}}), qr_data_url: faker.string.alpha({length: {min: 10, max: 20}}), short_code: faker.string.alpha({length: {min: 10, max: 20}}), short_url: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListBundlesResponseMock = (overrideResponse: Partial<Extract<PaginatedBundles, object>> = {}): PaginatedBundles => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int(), cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])},})), page: faker.number.int(), per_page: faker.number.int(), total: faker.number.int(), total_pages: faker.number.int(), ...overrideResponse})

export const getCreateBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int(), cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])},})

export const getAvailableBundlesResponseMock = (): BundleWithComponents[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int(), cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])},})))

export const getGetBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int(), cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])},})

export const getUpdateBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int(), cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])},})

export const getActivateBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int(), cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])},})

export const getArchiveBundleResponseMock = (): BundleWithComponents => ({...{available_from_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_from_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), available_until_date: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 10), null]), undefined]), available_until_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), price: faker.number.int(), status: faker.helpers.arrayElement(Object.values(BundleStatus)), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{branch_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), components: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), id: faker.string.uuid(), item_cost: faker.number.int(), item_cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_price: faker.number.int(), position: faker.number.int(), quantity: faker.number.int()})), computed_cost: faker.number.int(), cost_missing: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])},})

export const getBundlePerformanceResponseMock = (overrideResponse: Partial<Extract<BundlePerformanceResponse, object>> = {}): BundlePerformanceResponse => ({component_popularity: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), quantity_sold: faker.number.int()})), gross_revenue: faker.number.int(), net_profit: faker.number.int(), sales_volume: faker.number.int(), ...overrideResponse})

export const getCatalogSyncResponseMock = (overrideResponse: Partial<Extract<CatalogSyncResponse, object>> = {}): CatalogSyncResponse => ({catalog_revision: faker.number.int(), changed: faker.datatype.boolean(), ingredients: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), undefined]), items: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), modifier_groups: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({group_id: faker.string.uuid(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_available: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_id: faker.string.uuid(), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])})), selection_type: faker.string.alpha({length: {min: 10, max: 20}})})), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_available: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int()}))})), undefined]), ...overrideResponse})

export const getListCategoriesResponseMock = (): Category[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateCategoryResponseMock = (overrideResponse: Partial<Extract<Category, object>> = {}): Category => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateCategoryResponseMock = (overrideResponse: Partial<Extract<Category, object>> = {}): Category => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListAddonCostsResponseMock = (): AddonCost[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_type: faker.string.alpha({length: {min: 10, max: 20}}), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int()})))

export const getListMenuCatalogResponseMock = (overrideResponse: Partial<Extract<PaginatedMenuItems, object>> = {}): PaginatedMenuItems => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{sku_costs: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), food_cost_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), item_name: faker.string.alpha({length: {min: 10, max: 20}}), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), menu_item_id: faker.string.uuid(), price: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})}))},})), page: faker.number.int(), per_page: faker.number.int(), total: faker.number.int(), total_pages: faker.number.int(), ...overrideResponse})

export const getListSkuCostsResponseMock = (): SkuCost[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), food_cost_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), item_name: faker.string.alpha({length: {min: 10, max: 20}}), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), menu_item_id: faker.string.uuid(), price: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getListDeliveryOrdersResponseMock = (): DeliveryOrder[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancel_restocked: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), cart: {}, channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.helpers.arrayElement([faker.number.int(), undefined]), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.helpers.arrayElement([faker.number.int(), undefined]), extra_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), receipt_printed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getGetDeliveryOrderResponseMock = (overrideResponse: Partial<Extract<DeliveryOrder, object>> = {}): DeliveryOrder => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancel_restocked: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), cart: {}, channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.helpers.arrayElement([faker.number.int(), undefined]), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.helpers.arrayElement([faker.number.int(), undefined]), extra_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), receipt_printed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getCancelDeliveryOrderResponseMock = (overrideResponse: Partial<Extract<DeliveryOrder, object>> = {}): DeliveryOrder => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancel_restocked: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), cart: {}, channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.helpers.arrayElement([faker.number.int(), undefined]), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.helpers.arrayElement([faker.number.int(), undefined]), extra_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), receipt_printed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getFinalizeDeliveryOrderResponseMock = (overrideResponse: Partial<Extract<FinalizeResponse, object>> = {}): FinalizeResponse => ({delivery_order: {address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancel_restocked: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), cart: {}, channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.helpers.arrayElement([faker.number.int(), undefined]), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.helpers.arrayElement([faker.number.int(), undefined]), extra_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), receipt_printed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'}, order_id: faker.string.uuid(), order_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), warnings: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.alpha({length: {min: 10, max: 20}}))), ...overrideResponse})

export const getSetPrepTimeResponseMock = (overrideResponse: Partial<Extract<DeliveryOrder, object>> = {}): DeliveryOrder => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancel_restocked: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), cart: {}, channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.helpers.arrayElement([faker.number.int(), undefined]), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.helpers.arrayElement([faker.number.int(), undefined]), extra_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), receipt_printed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getDeliveryOrderQrResponseMock = (overrideResponse: Partial<Extract<QrResponse, object>> = {}): QrResponse => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), long_url: faker.string.alpha({length: {min: 10, max: 20}}), qr_data_url: faker.string.alpha({length: {min: 10, max: 20}}), short_code: faker.string.alpha({length: {min: 10, max: 20}}), short_url: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getSetStatusResponseMock = (overrideResponse: Partial<Extract<DeliveryOrder, object>> = {}): DeliveryOrder => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancel_restocked: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), cart: {}, channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.helpers.arrayElement([faker.number.int(), undefined]), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.helpers.arrayElement([faker.number.int(), undefined]), extra_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), receipt_printed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getSetAcceptingResponseMock = (overrideResponse: Partial<Extract<BranchDeliverySettings, object>> = {}): BranchDeliverySettings => ({branch_id: faker.string.uuid(), in_mall_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), in_mall_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), in_mall_enabled: faker.datatype.boolean(), in_mall_fee: faker.number.int(), in_mall_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), in_mall_override: faker.string.alpha({length: {min: 10, max: 20}}), in_mall_require_location: faker.datatype.boolean(), max_road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), otp_required: faker.datatype.boolean(), outside_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), outside_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), outside_enabled: faker.datatype.boolean(), outside_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), outside_override: faker.string.alpha({length: {min: 10, max: 20}}), pickup_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), pickup_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), pickup_enabled: faker.datatype.boolean(), pickup_fee: faker.number.int(), pickup_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), pickup_override: faker.string.alpha({length: {min: 10, max: 20}}), prep_time_minutes: faker.number.int(), umbrella_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), umbrella_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), umbrella_enabled: faker.datatype.boolean(), umbrella_fee: faker.number.int(), umbrella_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), umbrella_override: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListChannelAddonOverridesResponseMock = (): ChannelAddonOverride[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), branch_id: faker.string.uuid(), channel: faker.string.alpha({length: {min: 10, max: 20}}), is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})))

export const getUpsertChannelAddonOverrideResponseMock = (overrideResponse: Partial<Extract<ChannelAddonOverride, object>> = {}): ChannelAddonOverride => ({addon_item_id: faker.string.uuid(), branch_id: faker.string.uuid(), channel: faker.string.alpha({length: {min: 10, max: 20}}), is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), ...overrideResponse})

export const getListChannelOverridesResponseMock = (): ChannelMenuOverride[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), channel: faker.string.alpha({length: {min: 10, max: 20}}), is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), menu_item_id: faker.string.uuid(), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})))

export const getUpsertChannelOverrideResponseMock = (overrideResponse: Partial<Extract<ChannelMenuOverride, object>> = {}): ChannelMenuOverride => ({branch_id: faker.string.uuid(), channel: faker.string.alpha({length: {min: 10, max: 20}}), is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), menu_item_id: faker.string.uuid(), price_override: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), ...overrideResponse})

export const getGetBranchSettingsResponseMock = (overrideResponse: Partial<Extract<BranchDeliverySettings, object>> = {}): BranchDeliverySettings => ({branch_id: faker.string.uuid(), in_mall_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), in_mall_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), in_mall_enabled: faker.datatype.boolean(), in_mall_fee: faker.number.int(), in_mall_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), in_mall_override: faker.string.alpha({length: {min: 10, max: 20}}), in_mall_require_location: faker.datatype.boolean(), max_road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), otp_required: faker.datatype.boolean(), outside_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), outside_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), outside_enabled: faker.datatype.boolean(), outside_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), outside_override: faker.string.alpha({length: {min: 10, max: 20}}), pickup_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), pickup_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), pickup_enabled: faker.datatype.boolean(), pickup_fee: faker.number.int(), pickup_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), pickup_override: faker.string.alpha({length: {min: 10, max: 20}}), prep_time_minutes: faker.number.int(), umbrella_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), umbrella_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), umbrella_enabled: faker.datatype.boolean(), umbrella_fee: faker.number.int(), umbrella_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), umbrella_override: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getPutBranchSettingsResponseMock = (overrideResponse: Partial<Extract<BranchDeliverySettings, object>> = {}): BranchDeliverySettings => ({branch_id: faker.string.uuid(), in_mall_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), in_mall_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), in_mall_enabled: faker.datatype.boolean(), in_mall_fee: faker.number.int(), in_mall_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), in_mall_override: faker.string.alpha({length: {min: 10, max: 20}}), in_mall_require_location: faker.datatype.boolean(), max_road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), otp_required: faker.datatype.boolean(), outside_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), outside_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), outside_enabled: faker.datatype.boolean(), outside_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), outside_override: faker.string.alpha({length: {min: 10, max: 20}}), pickup_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), pickup_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), pickup_enabled: faker.datatype.boolean(), pickup_fee: faker.number.int(), pickup_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), pickup_override: faker.string.alpha({length: {min: 10, max: 20}}), prep_time_minutes: faker.number.int(), umbrella_close_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), umbrella_discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), umbrella_enabled: faker.datatype.boolean(), umbrella_fee: faker.number.int(), umbrella_open_time: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), umbrella_override: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListZonesResponseMock = (): DeliveryZone[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), fee: faker.number.int(), id: faker.string.uuid(), is_active: faker.datatype.boolean(), max_road_distance_meters: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}})))

export const getCreateZoneResponseMock = (overrideResponse: Partial<Extract<DeliveryZone, object>> = {}): DeliveryZone => ({branch_id: faker.string.uuid(), fee: faker.number.int(), id: faker.string.uuid(), is_active: faker.datatype.boolean(), max_road_distance_meters: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, ...overrideResponse})

export const getUpdateZoneResponseMock = (overrideResponse: Partial<Extract<DeliveryZone, object>> = {}): DeliveryZone => ({branch_id: faker.string.uuid(), fee: faker.number.int(), id: faker.string.uuid(), is_active: faker.datatype.boolean(), max_road_distance_meters: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, ...overrideResponse})

export const getListDiscountsResponseMock = (): Discount[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', dtype: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', value: faker.number.int()})))

export const getCreateDiscountResponseMock = (overrideResponse: Partial<Extract<Discount, object>> = {}): Discount => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', dtype: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', value: faker.number.int(), ...overrideResponse})

export const getUpdateDiscountResponseMock = (overrideResponse: Partial<Extract<Discount, object>> = {}): Discount => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', dtype: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', value: faker.number.int(), ...overrideResponse})

export const getSaveLayoutResponseMock = (): FloorTable[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', height: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pos_x: faker.number.float({fractionDigits: 2}), pos_y: faker.number.float({fractionDigits: 2}), rotation: faker.number.float({fractionDigits: 2}), seats: faker.number.int(), section_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), shape: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', width: faker.number.float({fractionDigits: 2})})))

export const getGetReservationSettingsResponseMock = (overrideResponse: Partial<Extract<ReservationSettings, object>> = {}): ReservationSettings => ({accepting_reservations: faker.datatype.boolean(), accepting_waitlist: faker.datatype.boolean(), branch_id: faker.string.uuid(), grace_minutes: faker.number.int(), hold_lead_minutes: faker.number.int(), lead_minutes: faker.number.int(), max_party_size: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), slot_minutes: faker.number.int(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getPutReservationSettingsResponseMock = (overrideResponse: Partial<Extract<ReservationSettings, object>> = {}): ReservationSettings => ({accepting_reservations: faker.datatype.boolean(), accepting_waitlist: faker.datatype.boolean(), branch_id: faker.string.uuid(), grace_minutes: faker.number.int(), hold_lead_minutes: faker.number.int(), lead_minutes: faker.number.int(), max_party_size: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), slot_minutes: faker.number.int(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListSectionsResponseMock = (): FloorSection[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), canvas_h: faker.number.int(), canvas_w: faker.number.int(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), ordering: faker.number.int(), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateSectionResponseMock = (overrideResponse: Partial<Extract<FloorSection, object>> = {}): FloorSection => ({branch_id: faker.string.uuid(), canvas_h: faker.number.int(), canvas_w: faker.number.int(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), ordering: faker.number.int(), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateSectionResponseMock = (overrideResponse: Partial<Extract<FloorSection, object>> = {}): FloorSection => ({branch_id: faker.string.uuid(), canvas_h: faker.number.int(), canvas_w: faker.number.int(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), ordering: faker.number.int(), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListFloorTablesResponseMock = (): FloorTable[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', height: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pos_x: faker.number.float({fractionDigits: 2}), pos_y: faker.number.float({fractionDigits: 2}), rotation: faker.number.float({fractionDigits: 2}), seats: faker.number.int(), section_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), shape: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', width: faker.number.float({fractionDigits: 2})})))

export const getCreateFloorTableResponseMock = (overrideResponse: Partial<Extract<FloorTable, object>> = {}): FloorTable => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', height: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pos_x: faker.number.float({fractionDigits: 2}), pos_y: faker.number.float({fractionDigits: 2}), rotation: faker.number.float({fractionDigits: 2}), seats: faker.number.int(), section_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), shape: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', width: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getUpdateFloorTableResponseMock = (overrideResponse: Partial<Extract<FloorTable, object>> = {}): FloorTable => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', height: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pos_x: faker.number.float({fractionDigits: 2}), pos_y: faker.number.float({fractionDigits: 2}), rotation: faker.number.float({fractionDigits: 2}), seats: faker.number.int(), section_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), shape: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', width: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getSetTableStatusResponseMock = (overrideResponse: Partial<Extract<FloorTable, object>> = {}): FloorTable => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', height: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pos_x: faker.number.float({fractionDigits: 2}), pos_y: faker.number.float({fractionDigits: 2}), rotation: faker.number.float({fractionDigits: 2}), seats: faker.number.int(), section_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), shape: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', width: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getMarginWatchResponseMock = (overrideResponse: Partial<Extract<MarginWatch, object>> = {}): MarginWatch => ({bottom: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), category_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), class: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), flags: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), link: faker.string.alpha({length: {min: 10, max: 20}}), params: {}})), item_name: faker.string.alpha({length: {min: 10, max: 20}}), margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), margin_share_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), menu_item_id: faker.string.uuid(), on_menu: faker.datatype.boolean(), popularity_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), prev_margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), prev_quantity: faker.number.int(), quantity_sold: faker.number.int(), revenue: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), branch_id: faker.string.uuid(), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), open_signals: faker.number.int(), rows_cost_unknown: faker.number.int(), target_pct: faker.number.float({fractionDigits: 2}), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), top: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), category_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), class: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), flags: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), link: faker.string.alpha({length: {min: 10, max: 20}}), params: {}})), item_name: faker.string.alpha({length: {min: 10, max: 20}}), margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), margin_share_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), menu_item_id: faker.string.uuid(), on_menu: faker.datatype.boolean(), popularity_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), prev_margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), prev_quantity: faker.number.int(), quantity_sold: faker.number.int(), revenue: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), totals: {below_target_gap: faker.number.int(), cost_known: faker.number.int(), margin_known: faker.number.int(), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), prev_margin_known: faker.number.int(), prev_revenue: faker.number.int(), revenue: faker.number.int(), revenue_cost_unknown: faker.number.int()}, ...overrideResponse})

export const getMenuMarginLedgerResponseMock = (overrideResponse: Partial<Extract<MarginLedgerReport, object>> = {}): MarginLedgerReport => ({branch_id: faker.string.uuid(), cost_basis: faker.string.alpha({length: {min: 10, max: 20}}), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rows: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), category_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), class: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), flags: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), link: faker.string.alpha({length: {min: 10, max: 20}}), params: {}})), item_name: faker.string.alpha({length: {min: 10, max: 20}}), margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), margin_share_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), menu_item_id: faker.string.uuid(), on_menu: faker.datatype.boolean(), popularity_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), prev_margin: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), prev_quantity: faker.number.int(), quantity_sold: faker.number.int(), revenue: faker.number.int(), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), rows_cost_unknown: faker.number.int(), target_pct: faker.number.float({fractionDigits: 2}), target_source: faker.string.alpha({length: {min: 10, max: 20}}), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), totals: {below_target_gap: faker.number.int(), cost_known: faker.number.int(), margin_known: faker.number.int(), margin_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), prev_margin_known: faker.number.int(), prev_revenue: faker.number.int(), revenue: faker.number.int(), revenue_cost_unknown: faker.number.int()}, ...overrideResponse})

export const getListDecisionsResponseMock = (): DecisionOut[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), baseline: {}, branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), detail: {}, id: faker.string.uuid(), impact: {}, impact_complete: faker.datatype.boolean(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), signal_kind: faker.string.alpha({length: {min: 10, max: 20}}), size_label: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getCreateDecisionResponseMock = (overrideResponse: Partial<Extract<DecisionOut, object>> = {}): DecisionOut => ({action: faker.string.alpha({length: {min: 10, max: 20}}), baseline: {}, branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), detail: {}, id: faker.string.uuid(), impact: {}, impact_complete: faker.datatype.boolean(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), signal_kind: faker.string.alpha({length: {min: 10, max: 20}}), size_label: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getGetMarginTargetsResponseMock = (overrideResponse: Partial<Extract<MarginTargets, object>> = {}): MarginTargets => ({branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), target_pct: faker.number.float({fractionDigits: 2})})), builtin_default_pct: faker.number.float({fractionDigits: 2}), org_default_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), ...overrideResponse})

export const getPutMarginTargetResponseMock = (overrideResponse: Partial<Extract<MarginTargets, object>> = {}): MarginTargets => ({branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), target_pct: faker.number.float({fractionDigits: 2})})), builtin_default_pct: faker.number.float({fractionDigits: 2}), org_default_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), ...overrideResponse})

export const getListMovementsResponseMock = (): BranchInventoryMovement[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({balance_after: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), below_zero: faker.datatype.boolean(), branch_id: faker.string.uuid(), branch_inventory_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), movement_type: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), source_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), source_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})))

export const getListBranchStockResponseMock = (): BranchInventoryItem[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({below_reorder: faker.datatype.boolean(), branch_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', current_stock: faker.number.float({fractionDigits: 2}), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), last_counted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_ingredient_id: faker.string.uuid(), par_max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), par_min: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getAddToBranchStockResponseMock = (overrideResponse: Partial<Extract<BranchInventoryItem, object>> = {}): BranchInventoryItem => ({below_reorder: faker.datatype.boolean(), branch_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', current_stock: faker.number.float({fractionDigits: 2}), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), last_counted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_ingredient_id: faker.string.uuid(), par_max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), par_min: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateBranchStockResponseMock = (overrideResponse: Partial<Extract<BranchInventoryItem, object>> = {}): BranchInventoryItem => ({below_reorder: faker.datatype.boolean(), branch_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', current_stock: faker.number.float({fractionDigits: 2}), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), last_counted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_ingredient_id: faker.string.uuid(), par_max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), par_min: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListTransfersResponseMock = (): BranchInventoryTransfer[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({destination_branch_id: faker.string.uuid(), destination_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), initiated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', initiated_by: faker.string.uuid(), initiated_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), source_branch_id: faker.string.uuid(), source_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getListWasteResponseMock = (): BranchInventoryMovement[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({balance_after: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), below_zero: faker.datatype.boolean(), branch_id: faker.string.uuid(), branch_inventory_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), movement_type: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), source_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), source_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})))

export const getCreateWasteResponseMock = (overrideResponse: Partial<Extract<BranchInventoryMovement, object>> = {}): BranchInventoryMovement => ({balance_after: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), below_zero: faker.datatype.boolean(), branch_id: faker.string.uuid(), branch_inventory_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), movement_type: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), source_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), source_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), ...overrideResponse})

export const getListCatalogResponseMock = (): OrgIngredient[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', density_g_per_ml: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pack_size: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), pack_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', yield_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined])})))

export const getCreateCatalogItemResponseMock = (overrideResponse: Partial<Extract<OrgIngredient, object>> = {}): OrgIngredient => ({category: faker.string.alpha({length: {min: 10, max: 20}}), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', density_g_per_ml: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pack_size: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), pack_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', yield_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), ...overrideResponse})

export const getUpdateCatalogItemResponseMock = (overrideResponse: Partial<Extract<OrgIngredient, object>> = {}): OrgIngredient => ({category: faker.string.alpha({length: {min: 10, max: 20}}), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', density_g_per_ml: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), pack_size: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), pack_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}}), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', yield_pct: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), ...overrideResponse})

export const getGetInventorySettingsResponseMock = (overrideResponse: Partial<Extract<OrgInventorySettings, object>> = {}): OrgInventorySettings => ({stocktake_variance_threshold_pct: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getUpdateInventorySettingsResponseMock = (overrideResponse: Partial<Extract<OrgInventorySettings, object>> = {}): OrgInventorySettings => ({stocktake_variance_threshold_pct: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getCreateTransferResponseMock = (overrideResponse: Partial<Extract<BranchInventoryTransfer, object>> = {}): BranchInventoryTransfer => ({destination_branch_id: faker.string.uuid(), destination_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), initiated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', initiated_by: faker.string.uuid(), initiated_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), source_branch_id: faker.string.uuid(), source_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getUpdateTransferResponseMock = (overrideResponse: Partial<Extract<BranchInventoryTransfer, object>> = {}): BranchInventoryTransfer => ({destination_branch_id: faker.string.uuid(), destination_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), initiated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', initiated_by: faker.string.uuid(), initiated_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), org_ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), source_branch_id: faker.string.uuid(), source_branch_name: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getFeedResponseMock = (): KitchenTicketView[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bumped: faker.datatype.boolean(), id: faker.string.uuid(), line: {}, qty: faker.number.int(), station_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), station_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), kitchen_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), round_number: faker.number.int(), source_id: faker.string.uuid(), source_type: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), table_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})))

export const getListRoutesResponseMock = (overrideResponse: Partial<Extract<StationRoutes, object>> = {}): StationRoutes => ({categories: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.string.uuid(), station_id: faker.string.uuid()})), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({menu_item_id: faker.string.uuid(), station_id: faker.string.uuid()})), ...overrideResponse})

export const getGetRoutingModeResponseMock = (overrideResponse: Partial<Extract<RoutingModeResponse, object>> = {}): RoutingModeResponse => ({effective: faker.string.alpha({length: {min: 10, max: 20}}), mode: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getSetRoutingModeResponseMock = (overrideResponse: Partial<Extract<RoutingModeResponse, object>> = {}): RoutingModeResponse => ({effective: faker.string.alpha({length: {min: 10, max: 20}}), mode: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getListStationsResponseMock = (): KitchenStation[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), sort_order: faker.number.int(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateStationResponseMock = (overrideResponse: Partial<Extract<KitchenStation, object>> = {}): KitchenStation => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), sort_order: faker.number.int(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateStationResponseMock = (overrideResponse: Partial<Extract<KitchenStation, object>> = {}): KitchenStation => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), printer_brand: faker.helpers.arrayElement([faker.helpers.arrayElement([null,faker.helpers.arrayElement(Object.values(PrinterBrand)),]), undefined]), printer_ip: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), printer_port: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), sort_order: faker.number.int(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getPutSizeRecipeResponseMock = (overrideResponse: Partial<Extract<RecipeCostResult, object>> = {}): RecipeCostResult => ({catalog_revision: faker.number.int(), cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), size_id: faker.string.uuid(), ...overrideResponse})

export const getListMenuItemsResponseMock = (): MenuItem[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateMenuItemResponseMock = (): MenuItemFull => ({...{base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{addon_slots: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int()})), allowed_addon_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), optional_fields: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})), recipes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), price_override: faker.number.int()}))},})

export const getGetMenuItemResponseMock = (): MenuItemFull => ({...{base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{addon_slots: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int()})), allowed_addon_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), optional_fields: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})), recipes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}})})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), price_override: faker.number.int()}))},})

export const getUpdateMenuItemResponseMock = (overrideResponse: Partial<Extract<MenuItem, object>> = {}): MenuItem => ({base_price: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), deleted_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), description_translations: {}, id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListAddonSlotsResponseMock = (): AddonSlot[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int()})))

export const getCreateAddonSlotResponseMock = (overrideResponse: Partial<Extract<AddonSlot, object>> = {}): AddonSlot => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int(), ...overrideResponse})

export const getUpdateAddonSlotResponseMock = (overrideResponse: Partial<Extract<AddonSlot, object>> = {}): AddonSlot => ({addon_type: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_required: faker.datatype.boolean(), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), label_translations: {}, max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), menu_item_id: faker.string.uuid(), min_selections: faker.number.int(), ...overrideResponse})

export const getPutAllowedAddonsResponseMock = (): string[] => (Array.from({length: faker.number.int({min: 1, max: 10})}, () => faker.word.sample()))

export const getGetItemCostResponseMock = (): SizeCostOut[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), label: faker.string.alpha({length: {min: 10, max: 20}}), size_id: faker.string.uuid()})))

export const getDuplicateItemResponseMock = (overrideResponse: Partial<Extract<StudioAggregate, object>> = {}): StudioAggregate => ({availability: {branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), channels: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({channel: faker.string.alpha({length: {min: 10, max: 20}}), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), org_active: faker.datatype.boolean()}, catalog_revision: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), modifier_groups: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({attachment_id: faker.string.uuid(), group_id: faker.string.uuid(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), included: faker.datatype.boolean(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])})), selection_type: faker.string.alpha({length: {min: 10, max: 20}}), sort: faker.number.int()})), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})}))})), org_id: faker.string.uuid(), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), sort: faker.number.int()})), used_in_bundles: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getPutModifierGroupsResponseMock = (overrideResponse: Partial<Extract<StudioAggregate, object>> = {}): StudioAggregate => ({availability: {branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), channels: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({channel: faker.string.alpha({length: {min: 10, max: 20}}), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), org_active: faker.datatype.boolean()}, catalog_revision: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), modifier_groups: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({attachment_id: faker.string.uuid(), group_id: faker.string.uuid(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), included: faker.datatype.boolean(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])})), selection_type: faker.string.alpha({length: {min: 10, max: 20}}), sort: faker.number.int()})), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})}))})), org_id: faker.string.uuid(), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), sort: faker.number.int()})), used_in_bundles: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getListOptionalFieldsResponseMock = (): OptionalField[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateOptionalFieldResponseMock = (overrideResponse: Partial<Extract<OptionalField, object>> = {}): OptionalField => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateOptionalFieldResponseMock = (overrideResponse: Partial<Extract<OptionalField, object>> = {}): OptionalField => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), menu_item_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_used: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getPutItemOptionsResponseMock = (): ItemOptionOut[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})}))})))

export const getListAddonOverridesResponseMock = (): AddonOverride[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_item_name: faker.string.alpha({length: {min: 10, max: 20}}), combo_addon_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), combo_addon_item_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), replaces_ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), replaces_org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getUpsertAddonOverrideResponseMock = (overrideResponse: Partial<Extract<AddonOverride, object>> = {}): AddonOverride => ({addon_item_id: faker.string.uuid(), addon_item_name: faker.string.alpha({length: {min: 10, max: 20}}), combo_addon_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), combo_addon_item_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_unit: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), replaces_ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), replaces_org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getPutSizesResponseMock = (overrideResponse: Partial<Extract<StudioAggregate, object>> = {}): StudioAggregate => ({availability: {branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), channels: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({channel: faker.string.alpha({length: {min: 10, max: 20}}), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), org_active: faker.datatype.boolean()}, catalog_revision: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), modifier_groups: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({attachment_id: faker.string.uuid(), group_id: faker.string.uuid(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), included: faker.datatype.boolean(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])})), selection_type: faker.string.alpha({length: {min: 10, max: 20}}), sort: faker.number.int()})), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})}))})), org_id: faker.string.uuid(), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), sort: faker.number.int()})), used_in_bundles: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getUpsertSizeResponseMock = (overrideResponse: Partial<Extract<ItemSize, object>> = {}): ItemSize => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), price_override: faker.number.int(), ...overrideResponse})

export const getGetStudioResponseMock = (overrideResponse: Partial<Extract<StudioAggregate, object>> = {}): StudioAggregate => ({availability: {branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), channels: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({channel: faker.string.alpha({length: {min: 10, max: 20}}), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), size_id: faker.string.uuid()}))})), org_active: faker.datatype.boolean()}, catalog_revision: faker.number.int(), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), is_active: faker.datatype.boolean(), modifier_groups: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({attachment_id: faker.string.uuid(), group_id: faker.string.uuid(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), included: faker.datatype.boolean(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined])})), selection_type: faker.string.alpha({length: {min: 10, max: 20}}), sort: faker.number.int()})), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})}))})), org_id: faker.string.uuid(), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_incomplete: faker.datatype.boolean(), cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), label: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int(), recipe: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost_piastres: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), quantity: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), sort: faker.number.int()})), used_in_bundles: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getPutPriceOverrideResponseMock = (overrideResponse: Partial<Extract<PriceOverrideOut, object>> = {}): PriceOverrideOut => ({branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), channel: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_available: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), scope: faker.string.alpha({length: {min: 10, max: 20}}), target_id: faker.string.uuid(), target_type: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListGroupsResponseMock = (): GroupOut[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min_selections: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, price: faker.number.int(), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), sort: faker.number.int()})), org_id: faker.string.uuid(), selection_type: faker.string.alpha({length: {min: 10, max: 20}}), sort: faker.number.int()})))

export const getCreateGroupResponseMock = (overrideResponse: Partial<Extract<GroupOut, object>> = {}): GroupOut => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min_selections: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, price: faker.number.int(), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), sort: faker.number.int()})), org_id: faker.string.uuid(), selection_type: faker.string.alpha({length: {min: 10, max: 20}}), sort: faker.number.int(), ...overrideResponse})

export const getPatchGroupResponseMock = (overrideResponse: Partial<Extract<GroupOut, object>> = {}): GroupOut => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_required: faker.datatype.boolean(), legacy_addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min_selections: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, price: faker.number.int(), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), sort: faker.number.int()})), org_id: faker.string.uuid(), selection_type: faker.string.alpha({length: {min: 10, max: 20}}), sort: faker.number.int(), ...overrideResponse})

export const getCreateOptionResponseMock = (overrideResponse: Partial<Extract<GroupOptionOut, object>> = {}): GroupOptionOut => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, price: faker.number.int(), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), sort: faker.number.int(), ...overrideResponse})

export const getPatchOptionResponseMock = (overrideResponse: Partial<Extract<GroupOptionOut, object>> = {}): GroupOptionOut => ({id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, price: faker.number.int(), replaces_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), sort: faker.number.int(), ...overrideResponse})

export const getPutOptionRecipeResponseMock = (): OptionRecipeLineInput[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_id: faker.string.uuid(), quantity: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getListOpenTicketsResponseMock = (): OpenTicketView[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), guest_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), line: {}, line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), round_number: faker.number.int(), voided: faker.datatype.boolean()})), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opened_by: faker.string.uuid(), opened_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), settled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), table_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ticket_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})))

export const getCreateOpenTicketResponseMock = (overrideResponse: Partial<Extract<OpenTicketView, object>> = {}): OpenTicketView => ({branch_id: faker.string.uuid(), customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), guest_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), line: {}, line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), round_number: faker.number.int(), voided: faker.datatype.boolean()})), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opened_by: faker.string.uuid(), opened_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), settled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), table_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ticket_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getGetOpenTicketResponseMock = (overrideResponse: Partial<Extract<OpenTicketView, object>> = {}): OpenTicketView => ({branch_id: faker.string.uuid(), customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), guest_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), line: {}, line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), round_number: faker.number.int(), voided: faker.datatype.boolean()})), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opened_by: faker.string.uuid(), opened_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), settled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), table_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ticket_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getAddRoundResponseMock = (overrideResponse: Partial<Extract<OpenTicketView, object>> = {}): OpenTicketView => ({branch_id: faker.string.uuid(), customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), guest_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), line: {}, line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), round_number: faker.number.int(), voided: faker.datatype.boolean()})), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opened_by: faker.string.uuid(), opened_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), settled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), table_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ticket_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getSettleOpenTicketResponseMock = (overrideResponse: Partial<Extract<Order, object>> = {}): Order => ({amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_channel: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_fee: faker.number.int(), delivery_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), order_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_type: faker.string.alpha({length: {min: 10, max: 20}}), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getMoveTicketTableResponseMock = (overrideResponse: Partial<Extract<OpenTicketView, object>> = {}): OpenTicketView => ({branch_id: faker.string.uuid(), customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), guest_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), line: {}, line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), round_number: faker.number.int(), voided: faker.datatype.boolean()})), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opened_by: faker.string.uuid(), opened_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), settled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), table_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ticket_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getVoidOpenTicketResponseMock = (overrideResponse: Partial<Extract<OpenTicketView, object>> = {}): OpenTicketView => ({branch_id: faker.string.uuid(), customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), guest_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), line: {}, line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), round_number: faker.number.int(), voided: faker.datatype.boolean()})), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opened_by: faker.string.uuid(), opened_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), settled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), table_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), ticket_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getListOrdersResponseMock = (overrideResponse: Partial<Extract<PaginatedOrders, object>> = {}): PaginatedOrders => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_channel: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_fee: faker.number.int(), delivery_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), order_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_type: faker.string.alpha({length: {min: 10, max: 20}}), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), page: faker.number.int(), per_page: faker.number.int(), summary: {completed: faker.number.int(), delivery_fees: faker.helpers.arrayElement([faker.number.int(), undefined]), delivery_orders: faker.helpers.arrayElement([faker.number.int(), undefined]), delivery_revenue: faker.helpers.arrayElement([faker.number.int(), undefined]), discounts: faker.number.int(), in_mall_fees: faker.helpers.arrayElement([faker.number.int(), undefined]), in_mall_orders: faker.helpers.arrayElement([faker.number.int(), undefined]), in_mall_revenue: faker.helpers.arrayElement([faker.number.int(), undefined]), line_items: faker.helpers.arrayElement([faker.number.int(), undefined]), outside_fees: faker.helpers.arrayElement([faker.number.int(), undefined]), outside_orders: faker.helpers.arrayElement([faker.number.int(), undefined]), outside_revenue: faker.helpers.arrayElement([faker.number.int(), undefined]), revenue: faker.number.int(), tips: faker.number.int(), voided: faker.number.int()}, total: faker.number.int(), total_pages: faker.number.int(), ...overrideResponse})

export const getCreateOrderResponseOrderDeliveryInfoMock = (overrideResponse: Partial<OrderDeliveryInfo> = {}): OrderDeliveryInfo => ({...{address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), channel: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), zone_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}, ...overrideResponse});

export const getCreateOrderResponseMock = (): OrderFull => ({...{amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_channel: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_fee: faker.number.int(), delivery_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), order_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_type: faker.string.alpha({length: {min: 10, max: 20}}), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])},...{delivery: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getCreateOrderResponseOrderDeliveryInfoMock()},]), undefined]), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_unit_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), deductions_snapshot: {}, id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), name_translations: {}, notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.string.uuid(), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_price: faker.number.int()},...{addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), name_translations: {}, order_item_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), bundle_components: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), component_item_id: faker.string.uuid(), id: faker.string.uuid(), line_total: faker.number.int(), name_translations: {}, order_line_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({component_item_id: faker.string.uuid(), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_line_id: faker.string.uuid(), price: faker.number.int()})), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), undefined]), optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_deducted: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined])}))},})), warnings: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.alpha({length: {min: 10, max: 20}}))), undefined])},})

export const getExportOrdersResponseMock = (overrideResponse: Partial<Extract<ExportResponse, object>> = {}): ExportResponse => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_channel: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_fee: faker.number.int(), delivery_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), order_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_type: faker.string.alpha({length: {min: 10, max: 20}}), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_unit_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), deductions_snapshot: {}, id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), name_translations: {}, notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.string.uuid(), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_price: faker.number.int()},...{addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), name_translations: {}, order_item_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), bundle_components: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), component_item_id: faker.string.uuid(), id: faker.string.uuid(), line_total: faker.number.int(), name_translations: {}, order_line_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({component_item_id: faker.string.uuid(), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_line_id: faker.string.uuid(), price: faker.number.int()})), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), undefined]), optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_deducted: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined])}))},})), payments: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount: faker.number.int(), id: faker.string.uuid(), method: faker.string.alpha({length: {min: 10, max: 20}}), order_id: faker.string.uuid(), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}))},})), generated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ingredient_costs: {
        [faker.string.alphanumeric(5)]: faker.number.int()
      }, summary: {completed: faker.number.int(), delivery_fees: faker.helpers.arrayElement([faker.number.int(), undefined]), delivery_orders: faker.helpers.arrayElement([faker.number.int(), undefined]), delivery_revenue: faker.helpers.arrayElement([faker.number.int(), undefined]), discounts: faker.number.int(), in_mall_fees: faker.helpers.arrayElement([faker.number.int(), undefined]), in_mall_orders: faker.helpers.arrayElement([faker.number.int(), undefined]), in_mall_revenue: faker.helpers.arrayElement([faker.number.int(), undefined]), line_items: faker.helpers.arrayElement([faker.number.int(), undefined]), outside_fees: faker.helpers.arrayElement([faker.number.int(), undefined]), outside_orders: faker.helpers.arrayElement([faker.number.int(), undefined]), outside_revenue: faker.helpers.arrayElement([faker.number.int(), undefined]), revenue: faker.number.int(), tips: faker.number.int(), voided: faker.number.int()}, total: faker.number.int(), ...overrideResponse})

export const getPreviewRecipeResponseMock = (): PreviewIngredient[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category: faker.string.alpha({length: {min: 10, max: 20}}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity: faker.number.float({fractionDigits: 2}), source: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getGetOrderResponseOrderDeliveryInfoMock = (overrideResponse: Partial<OrderDeliveryInfo> = {}): OrderDeliveryInfo => ({...{address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), channel: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), zone_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}, ...overrideResponse});

export const getGetOrderResponseMock = (): OrderFull => ({...{amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_channel: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_fee: faker.number.int(), delivery_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), order_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_type: faker.string.alpha({length: {min: 10, max: 20}}), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])},...{delivery: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetOrderResponseOrderDeliveryInfoMock()},]), undefined]), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({...{bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_unit_price: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), cost_missing: faker.datatype.boolean(), deductions_snapshot: {}, id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), menu_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), name_translations: {}, notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.string.uuid(), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit_price: faker.number.int()},...{addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), line_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), line_total: faker.number.int(), name_translations: {}, order_item_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), bundle_components: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), component_item_id: faker.string.uuid(), id: faker.string.uuid(), line_total: faker.number.int(), name_translations: {}, order_line_id: faker.string.uuid(), quantity: faker.number.int(), unit_price: faker.number.int()})), item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({component_item_id: faker.string.uuid(), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_line_id: faker.string.uuid(), price: faker.number.int()})), quantity: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), undefined]), optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), field_name: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), ingredient_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ingredient_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name_translations: {}, optional_field_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), price: faker.number.int(), quantity_deducted: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined])}))},})), warnings: faker.helpers.arrayElement([Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.alpha({length: {min: 10, max: 20}}))), undefined])},})

export const getVoidOrderResponseMock = (overrideResponse: Partial<Extract<Order, object>> = {}): Order => ({amount_tendered: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), branch_id: faker.string.uuid(), change_given: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_channel: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_fee: faker.number.int(), delivery_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), delivery_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.number.int(), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.number.int(), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_number: faker.number.int(), order_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_type: faker.string.alpha({length: {min: 10, max: 20}}), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), tax_amount: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), tip_amount: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), tip_payment_method: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), total_amount: faker.number.int(), void_note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), void_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), voided_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), voided_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), waiter_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getListOrgsResponseMock = (): Org[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), timezone: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getCreateOrgResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), timezone: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getGetOrgResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), timezone: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getUpdateOrgResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), timezone: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getUploadOrgLogoResponseMock = (overrideResponse: Partial<Extract<Org, object>> = {}): Org => ({currency_code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), receipt_footer: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), slug: faker.string.alpha({length: {min: 10, max: 20}}), tax_rate: faker.number.float({fractionDigits: 2}), timezone: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getOfflineAuthBundleResponseMock = (overrideResponse: Partial<Extract<OfflineAuthBundle, object>> = {}): OfflineAuthBundle => ({generated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', lan_secret: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), tellers: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), offline_pin_hash: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.string.alpha({length: {min: 10, max: 20}}), user_id: faker.string.uuid()})), ...overrideResponse})

export const getGetOnboardingResponseMock = (overrideResponse: Partial<Extract<OnboardingStatus, object>> = {}): OnboardingStatus => ({can_complete: faker.datatype.boolean(), completed: faker.datatype.boolean(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), recipe_coverage: faker.number.float({fractionDigits: 2}), steps: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({count: faker.number.int(), done: faker.datatype.boolean(), key: faker.string.alpha({length: {min: 10, max: 20}}), required: faker.datatype.boolean()})), ...overrideResponse})

export const getCompleteOnboardingResponseMock = (overrideResponse: Partial<Extract<OnboardingStatus, object>> = {}): OnboardingStatus => ({can_complete: faker.datatype.boolean(), completed: faker.datatype.boolean(), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), recipe_coverage: faker.number.float({fractionDigits: 2}), steps: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({count: faker.number.int(), done: faker.datatype.boolean(), key: faker.string.alpha({length: {min: 10, max: 20}}), required: faker.datatype.boolean()})), ...overrideResponse})

export const getOrgQrResponseMock = (overrideResponse: Partial<Extract<QrResponse, object>> = {}): QrResponse => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), long_url: faker.string.alpha({length: {min: 10, max: 20}}), qr_data_url: faker.string.alpha({length: {min: 10, max: 20}}), short_code: faker.string.alpha({length: {min: 10, max: 20}}), short_url: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListPaymentMethodsResponseMock = (): OrgPaymentMethod[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getActivatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getDeactivatePaymentMethodResponseMock = (overrideResponse: Partial<Extract<OrgPaymentMethod, object>> = {}): OrgPaymentMethod => ({color: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', icon: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_cash: faker.datatype.boolean(), label_translations: {}, name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getGetPermissionMatrixResponseMock = (): PermissionMatrix[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), effective: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}}), role_default: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), user_override: faker.helpers.arrayElement([faker.datatype.boolean(), undefined])})))

export const getGetRolePermissionsResponseMock = (): RolePermission[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}}), role: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getUpsertRolePermissionResponseMock = (overrideResponse: Partial<Extract<RolePermission, object>> = {}): RolePermission => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), resource: faker.string.alpha({length: {min: 10, max: 20}}), role: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getGetUserPermissionsResponseMock = (): Permission[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), id: faker.string.uuid(), resource: faker.string.alpha({length: {min: 10, max: 20}}), user_id: faker.string.uuid()})))

export const getUpsertUserPermissionResponseMock = (overrideResponse: Partial<Extract<Permission, object>> = {}): Permission => ({action: faker.string.alpha({length: {min: 10, max: 20}}), granted: faker.datatype.boolean(), id: faker.string.uuid(), resource: faker.string.alpha({length: {min: 10, max: 20}}), user_id: faker.string.uuid(), ...overrideResponse})

export const getPublicBranchesResponseMock = (): PublicBranch[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), in_mall_enabled: faker.datatype.boolean(), in_mall_open_now: faker.datatype.boolean(), in_mall_require_location: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), otp_required: faker.datatype.boolean(), outside_enabled: faker.datatype.boolean(), outside_open_now: faker.datatype.boolean(), pickup_enabled: faker.datatype.boolean(), pickup_open_now: faker.datatype.boolean(), umbrella_enabled: faker.datatype.boolean(), umbrella_open_now: faker.datatype.boolean()})))

export const getDeliveryQuoteResponseMock = (overrideResponse: Partial<Extract<QuoteResponse, object>> = {}): QuoteResponse => ({distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), fee: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), zone_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getPublicMenuResponseDeliveryMenuDiscountMock = (overrideResponse: Partial<DeliveryMenuDiscount> = {}): DeliveryMenuDiscount => ({...{dtype: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, value: faker.number.int()}, ...overrideResponse});

export const getPublicMenuResponseMock = (overrideResponse: Partial<Extract<DeliveryMenu, object>> = {}): DeliveryMenu => ({addons: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), is_available: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, price: faker.number.int(), type: faker.string.alpha({length: {min: 10, max: 20}})})), categories: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}})), discount: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getPublicMenuResponseDeliveryMenuDiscountMock()},]), undefined]), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({allowed_addon_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), default_milk_addon_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), description: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), image_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), modifier_groups: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), group_id: faker.string.uuid(), is_required: faker.datatype.boolean(), max_selections: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), min_selections: faker.number.int(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, options: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, option_id: faker.string.uuid(), price: faker.number.int()})), selection_type: faker.string.alpha({length: {min: 10, max: 20}})})), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, optionals: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), name: faker.string.alpha({length: {min: 10, max: 20}}), name_translations: {}, price: faker.number.int(), size_label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), price: faker.number.int(), sizes: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({label: faker.string.alpha({length: {min: 10, max: 20}}), price: faker.number.int()}))})), ...overrideResponse})

export const getCreateDeliveryOrderResponseMock = (overrideResponse: Partial<Extract<DeliveryOrder, object>> = {}): DeliveryOrder => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancel_restocked: faker.helpers.arrayElement([faker.datatype.boolean(), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), cart: {}, channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), delivery_zone_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_amount: faker.helpers.arrayElement([faker.number.int(), undefined]), discount_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), discount_type: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_value: faker.helpers.arrayElement([faker.number.int(), undefined]), extra_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), receipt_printed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), road_distance_meters: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getGuestOrderHistoryResponseMock = (): OrderHistorySummary[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), channel: faker.string.alpha({length: {min: 10, max: 20}}), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), delivery_fee: faker.number.int(), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_amount: faker.number.int(), id: faker.string.uuid(), items: {}, place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int()})))

export const getGuestPastLocationsResponseMock = (): GuestSavedLocation[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_id: faker.string.uuid(), channel: faker.string.alpha({length: {min: 10, max: 20}}), customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), landmark: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), last_used_at: faker.date.past().toISOString().slice(0, 19) + 'Z', place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})))

export const getTrackDeliveryOrderResponseMock = (overrideResponse: Partial<Extract<DeliveryTracking, object>> = {}): DeliveryTracking => ({address_line: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), cancel_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), channel: faker.string.alpha({length: {min: 10, max: 20}}), confirmed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', customer_name: faker.string.alpha({length: {min: 10, max: 20}}), delivered_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), delivery_fee: faker.number.int(), delivery_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), discount_amount: faker.number.int(), estimated_prep_minutes: faker.number.int(), floor: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), org_id: faker.string.uuid(), out_for_delivery_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), payment_method_hint: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), place_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), preparing_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), rejected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), subtotal: faker.number.int(), total: faker.number.int(), unit_number: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getListPublicOrgsResponseMock = (): PublicOrg[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({address: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), branch_count: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', logo_url: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), name: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getOtpRequestResponseMock = (overrideResponse: Partial<Extract<OtpRequestResponse, object>> = {}): OtpRequestResponse => ({sent: faker.datatype.boolean(), ...overrideResponse})

export const getOtpVerifyResponseMock = (overrideResponse: Partial<Extract<OtpVerifyResponse, object>> = {}): OtpVerifyResponse => ({device_token: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getCreatePublicBookingResponseMock = (overrideResponse: Partial<Extract<PublicBooking, object>> = {}): PublicBooking => ({eta_minutes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), party_size: faker.number.int(), reserved_for: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), table_count: faker.number.int(), ...overrideResponse})

export const getListReservationPublicBranchesResponseMock = (): PublicBranch[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({code: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), in_mall_enabled: faker.datatype.boolean(), in_mall_open_now: faker.datatype.boolean(), in_mall_require_location: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), otp_required: faker.datatype.boolean(), outside_enabled: faker.datatype.boolean(), outside_open_now: faker.datatype.boolean(), pickup_enabled: faker.datatype.boolean(), pickup_open_now: faker.datatype.boolean(), umbrella_enabled: faker.datatype.boolean(), umbrella_open_now: faker.datatype.boolean()})))

export const getTrackPublicBookingResponseMock = (overrideResponse: Partial<Extract<PublicBooking, object>> = {}): PublicBooking => ({eta_minutes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), party_size: faker.number.int(), reserved_for: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), table_count: faker.number.int(), ...overrideResponse})

export const getListPurchaseOrdersResponseMock = (): PurchaseOrder[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.string.uuid(), expected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), received_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), received_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreatePurchaseOrderResponseMock = (): PurchaseOrderFull => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.string.uuid(), expected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), received_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), received_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{lines: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), purchase_order_id: faker.string.uuid(), purchase_unit: faker.string.alpha({length: {min: 10, max: 20}}), quantity_ordered: faker.number.float({fractionDigits: 2}), quantity_received: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.number.int(), units_per_purchase_unit: faker.number.float({fractionDigits: 2})}))},})

export const getReorderSuggestionsResponseMock = (): ReorderSuggestion[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({lines: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({current_stock: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), suggested_qty: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})))

export const getCreateReturnResponseMock = (overrideResponse: Partial<Extract<GoodsReceipt, object>> = {}): GoodsReceipt => ({branch_id: faker.string.uuid(), id: faker.string.uuid(), is_return: faker.datatype.boolean(), lines: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), purchase_order_line_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity: faker.number.float({fractionDigits: 2}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), purchase_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), received_at: faker.date.past().toISOString().slice(0, 19) + 'Z', received_by: faker.string.uuid(), received_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getGetPurchaseOrderResponseMock = (): PurchaseOrderFull => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.string.uuid(), expected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), received_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), received_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{lines: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), purchase_order_id: faker.string.uuid(), purchase_unit: faker.string.alpha({length: {min: 10, max: 20}}), quantity_ordered: faker.number.float({fractionDigits: 2}), quantity_received: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.number.int(), units_per_purchase_unit: faker.number.float({fractionDigits: 2})}))},})

export const getCancelPurchaseOrderResponseMock = (overrideResponse: Partial<Extract<PurchaseOrder, object>> = {}): PurchaseOrder => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.string.uuid(), expected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), received_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), received_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListPoReceiptsResponseMock = (): GoodsReceipt[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), id: faker.string.uuid(), is_return: faker.datatype.boolean(), lines: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), purchase_order_line_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity: faker.number.float({fractionDigits: 2}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), purchase_order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), received_at: faker.date.past().toISOString().slice(0, 19) + 'Z', received_by: faker.string.uuid(), received_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})))

export const getReceivePurchaseOrderResponseMock = (): PurchaseOrderFull => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.string.uuid(), expected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), received_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), received_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'},...{lines: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), purchase_order_id: faker.string.uuid(), purchase_unit: faker.string.alpha({length: {min: 10, max: 20}}), quantity_ordered: faker.number.float({fractionDigits: 2}), quantity_received: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.number.int(), units_per_purchase_unit: faker.number.float({fractionDigits: 2})}))},})

export const getSubmitPurchaseOrderResponseMock = (overrideResponse: Partial<Extract<PurchaseOrder, object>> = {}): PurchaseOrder => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.string.uuid(), expected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), received_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), received_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListOrgPurchaseOrdersResponseMock = (): PurchaseOrder[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.string.uuid(), expected_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), received_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), received_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), reference: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getListSuppliersResponseMock = (): Supplier[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({contact_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateSupplierResponseMock = (overrideResponse: Partial<Extract<Supplier, object>> = {}): Supplier => ({contact_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateSupplierResponseMock = (overrideResponse: Partial<Extract<Supplier, object>> = {}): Supplier => ({contact_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListMarketingLinksResponseMock = (): MarketingLink[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), label: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), long_url: faker.string.alpha({length: {min: 10, max: 20}}), short_code: faker.string.alpha({length: {min: 10, max: 20}}), short_url: faker.string.alpha({length: {min: 10, max: 20}}), target_ref: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getCreateMarketingLinkResponseMock = (overrideResponse: Partial<Extract<QrResponse, object>> = {}): QrResponse => ({kind: faker.string.alpha({length: {min: 10, max: 20}}), long_url: faker.string.alpha({length: {min: 10, max: 20}}), qr_data_url: faker.string.alpha({length: {min: 10, max: 20}}), short_code: faker.string.alpha({length: {min: 10, max: 20}}), short_url: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListAddonIngredientsResponseMock = (): AddonIngredient[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getUpsertAddonIngredientResponseMock = (overrideResponse: Partial<Extract<AddonIngredient, object>> = {}): AddonIngredient => ({addon_item_id: faker.string.uuid(), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListDrinkRecipesResponseMock = (): DrinkRecipe[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getUpsertDrinkRecipeResponseMock = (overrideResponse: Partial<Extract<DrinkRecipe, object>> = {}): DrinkRecipe => ({id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), menu_item_id: faker.string.uuid(), org_ingredient_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_used: faker.number.float({fractionDigits: 2}), size_label: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getBranchAddonSalesResponseMock = (): AddonSalesRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({addon_item_id: faker.string.uuid(), addon_name: faker.string.alpha({length: {min: 10, max: 20}}), addon_name_translations: {}, addon_type: faker.string.alpha({length: {min: 10, max: 20}}), quantity_sold: faker.number.int(), revenue: faker.number.int()})))

export const getBranchBundleSalesResponseMock = (): BundleSalesRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), bundle_name: faker.string.alpha({length: {min: 10, max: 20}}), quantity_sold: faker.number.int(), revenue: faker.number.int()})))

export const getBranchConsumptionResponseMock = (): ConsumptionRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({consumed_qty: faker.number.float({fractionDigits: 2}), consumed_value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getBranchDeliverySalesResponseMock = (overrideResponse: Partial<Extract<DeliverySalesReport, object>> = {}): DeliverySalesReport => ({avg_order_value: faker.number.int(), cancelled_orders: faker.number.int(), channels: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({avg_order_value: faker.number.int(), cancelled_orders: faker.number.int(), channel: faker.string.alpha({length: {min: 10, max: 20}}), delivery_fees: faker.number.int(), orders: faker.number.int(), revenue: faker.number.int()})), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), total_delivery_fees: faker.number.int(), total_orders: faker.number.int(), total_revenue: faker.number.int(), ...overrideResponse})

export const getBranchInventoryValuationResponseMock = (overrideResponse: Partial<Extract<InventoryValuationReport, object>> = {}): InventoryValuationReport => ({items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), current_stock: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})), total_value: faker.number.int(), unknown_cost_count: faker.number.int(), ...overrideResponse})

export const getBranchCombinedItemSalesResponseMock = (): CombinedItemSalesRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({bundle_qty: faker.number.int(), item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_name_translations: {}, standalone_qty: faker.number.int(), total_qty: faker.number.int()})))

export const getBranchLowStockResponseMock = (): LowStockRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), current_stock: faker.number.float({fractionDigits: 2}), deficit: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reorder_threshold: faker.number.float({fractionDigits: 2}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getBranchSalesResponseMock = (overrideResponse: Partial<Extract<BranchSalesReport, object>> = {}): BranchSalesReport => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), by_category: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({category_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), category_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), category_name_translations: {}, item_count: faker.number.int(), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_name_translations: {}, menu_item_id: faker.string.uuid(), quantity_sold: faker.number.int(), revenue: faker.number.int()})), quantity_sold: faker.number.int(), revenue: faker.number.int()})), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), revenue_by_method: {}, subtotal: faker.number.int(), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), top_items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({item_name: faker.string.alpha({length: {min: 10, max: 20}}), item_name_translations: {}, menu_item_id: faker.string.uuid(), quantity_sold: faker.number.int(), revenue: faker.number.int()})), total_discount: faker.number.int(), total_line_items: faker.helpers.arrayElement([faker.number.int(), undefined]), total_orders: faker.number.int(), total_revenue: faker.number.int(), total_tax: faker.number.int(), voided_orders: faker.number.int(), ...overrideResponse})

export const getBranchSalesPeakHoursResponseMock = (): PeakHourPoint[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({avg_orders_per_day: faker.number.float({fractionDigits: 2}), avg_revenue_per_day: faker.number.int(), discount: faker.number.int(), hour: faker.number.int(), orders: faker.number.int(), orders_pct: faker.number.float({fractionDigits: 2}), revenue: faker.number.int(), revenue_pct: faker.number.float({fractionDigits: 2}), tax: faker.number.int(), voided: faker.number.int()})))

export const getBranchSalesTimeseriesResponseMock = (): TimeseriesPoint[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({discount: faker.number.int(), orders: faker.number.int(), period: faker.string.alpha({length: {min: 10, max: 20}}), revenue: faker.number.int(), revenue_by_method: {}, tax: faker.number.int(), voided: faker.number.int()})))

export const getBranchShrinkageResponseMock = (): ShrinkageRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reason: faker.string.alpha({length: {min: 10, max: 20}}), shrinkage_qty: faker.number.float({fractionDigits: 2}), shrinkage_value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getBranchStockResponseMock = (overrideResponse: Partial<Extract<BranchStockReport, object>> = {}): BranchStockReport => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({below_reorder: faker.datatype.boolean(), branch_inventory_id: faker.string.uuid(), cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), current_stock: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), reorder_threshold: faker.number.float({fractionDigits: 2}), unit: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getBranchTellerStatsResponseMock = (): TellerStats[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({avg_order_value: faker.number.int(), orders: faker.number.int(), revenue: faker.number.int(), shifts: faker.number.int(), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), voided: faker.number.int()})))

export const getBranchWaiterStatsResponseMock = (overrideResponse: Partial<Extract<WaiterStatsReport, object>> = {}): WaiterStatsReport => ({attributed_orders: faker.number.int(), total_orders: faker.number.int(), waiters: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({avg_items_per_order: faker.number.float({fractionDigits: 2}), avg_order_value: faker.number.int(), line_items: faker.number.int(), orders: faker.number.int(), revenue: faker.number.int(), voided: faker.number.int(), waiter_id: faker.string.uuid(), waiter_name: faker.string.alpha({length: {min: 10, max: 20}})})), ...overrideResponse})

export const getBranchWasteReportResponseMock = (): WasteReportRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reason: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), waste_qty: faker.number.float({fractionDigits: 2}), waste_value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})))

export const getOrgBranchComparisonResponseMock = (overrideResponse: Partial<Extract<OrgComparisonReport, object>> = {}): OrgComparisonReport => ({branches: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({avg_order_value: faker.number.int(), branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), revenue_by_method: {}, total_orders: faker.number.int(), total_revenue: faker.number.int(), void_rate_pct: faker.number.float({fractionDigits: 2}), voided_orders: faker.number.int()})), from: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), to: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), ...overrideResponse})

export const getOrgConsumptionResponseMock = (): ConsumptionRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({consumed_qty: faker.number.float({fractionDigits: 2}), consumed_value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getOrgInventoryValuationResponseMock = (overrideResponse: Partial<Extract<InventoryValuationReport, object>> = {}): InventoryValuationReport => ({items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({cost_per_unit: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), current_stock: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})), total_value: faker.number.int(), unknown_cost_count: faker.number.int(), ...overrideResponse})

export const getOrgLowStockResponseMock = (): LowStockRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), current_stock: faker.number.float({fractionDigits: 2}), deficit: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reorder_threshold: faker.number.float({fractionDigits: 2}), supplier_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), supplier_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getOrgShrinkageResponseMock = (): ShrinkageRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reason: faker.string.alpha({length: {min: 10, max: 20}}), shrinkage_qty: faker.number.float({fractionDigits: 2}), shrinkage_value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getOrgWasteReportResponseMock = (): WasteReportRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), org_ingredient_id: faker.string.uuid(), reason: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}}), waste_qty: faker.number.float({fractionDigits: 2}), waste_value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})))

export const getShiftDeductionsResponseMock = (): DeductionLogRow[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), inventory_item_id: faker.string.uuid(), item_name: faker.string.alpha({length: {min: 10, max: 20}}), order_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), order_item_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), quantity_deducted: faker.number.float({fractionDigits: 2}), source: faker.string.alpha({length: {min: 10, max: 20}}), unit: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getShiftSummaryResponseMock = (overrideResponse: Partial<Extract<ShiftSummary, object>> = {}): ShiftSummary => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}}), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), revenue_by_method: {}, shift_id: faker.string.uuid(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), total_discount: faker.number.int(), total_orders: faker.number.int(), total_revenue: faker.number.int(), total_tax: faker.number.int(), voided_orders: faker.number.int(), ...overrideResponse})

export const getListBookingsResponseMock = (): BookingView[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({arrived_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), branch_id: faker.string.uuid(), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), no_show_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), notified_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), party_size: faker.number.int(), quoted_ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), reserved_for: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), seated_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), source: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), table_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateBookingResponseMock = (overrideResponse: Partial<Extract<BookingView, object>> = {}): BookingView => ({arrived_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), branch_id: faker.string.uuid(), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), no_show_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), notified_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), party_size: faker.number.int(), quoted_ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), reserved_for: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), seated_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), source: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), table_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateBookingResponseMock = (overrideResponse: Partial<Extract<BookingView, object>> = {}): BookingView => ({arrived_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), branch_id: faker.string.uuid(), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), no_show_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), notified_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), party_size: faker.number.int(), quoted_ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), reserved_for: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), seated_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), source: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), table_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getAssignTablesResponseMock = (overrideResponse: Partial<Extract<BookingView, object>> = {}): BookingView => ({arrived_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), branch_id: faker.string.uuid(), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), no_show_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), notified_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), party_size: faker.number.int(), quoted_ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), reserved_for: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), seated_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), source: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), table_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getNotifyBookingResponseMock = (overrideResponse: Partial<Extract<BookingView, object>> = {}): BookingView => ({arrived_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), branch_id: faker.string.uuid(), cancelled_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), completed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', created_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), customer_lat: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_lng: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), customer_name: faker.string.alpha({length: {min: 10, max: 20}}), customer_phone: faker.string.alpha({length: {min: 10, max: 20}}), id: faker.string.uuid(), kind: faker.string.alpha({length: {min: 10, max: 20}}), no_show_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), notified_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), org_id: faker.string.uuid(), otp_verified: faker.datatype.boolean(), party_size: faker.number.int(), quoted_ready_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), reserved_for: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), seated_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), source: faker.string.alpha({length: {min: 10, max: 20}}), status: faker.string.alpha({length: {min: 10, max: 20}}), table_ids: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => (faker.string.uuid())), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListShiftsResponseMock = (overrideResponse: Partial<Extract<PaginatedShifts, object>> = {}): PaginatedShifts => ({data: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), till_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), till_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), page: faker.number.int(), per_page: faker.number.int(), total: faker.number.int(), total_pages: faker.number.int(), ...overrideResponse})

export const getGetCurrentShiftResponseShiftMock = (overrideResponse: Partial<Shift> = {}): Shift => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), till_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), till_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}, ...overrideResponse});

export const getGetCurrentShiftResponseMock = (overrideResponse: Partial<Extract<ShiftPreFill, object>> = {}): ShiftPreFill => ({has_open_shift: faker.datatype.boolean(), open_shift: faker.helpers.arrayElement([faker.helpers.arrayElement([null,{...getGetCurrentShiftResponseShiftMock()},]), undefined]), suggested_opening_cash: faker.number.int(), ...overrideResponse})

export const getOpenShiftResponseMock = (overrideResponse: Partial<Extract<Shift, object>> = {}): Shift => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), till_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), till_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getGetShiftResponseMock = (overrideResponse: Partial<Extract<Shift, object>> = {}): Shift => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), till_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), till_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getListCashMovementsResponseMock = (): CashMovement[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount: faker.number.int(), client_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), moved_by: faker.string.uuid(), moved_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid()})))

export const getAddCashMovementResponseMock = (overrideResponse: Partial<Extract<CashMovement, object>> = {}): CashMovement => ({amount: faker.number.int(), client_ref: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), moved_by: faker.string.uuid(), moved_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}}), shift_id: faker.string.uuid(), ...overrideResponse})

export const getCloseShiftResponseMock = (overrideResponse: Partial<Extract<CloseShiftResponse, object>> = {}): CloseShiftResponse => ({shift: {branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), till_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), till_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}, ...overrideResponse})

export const getForceCloseShiftResponseMock = (overrideResponse: Partial<Extract<Shift, object>> = {}): Shift => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), till_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), till_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), ...overrideResponse})

export const getGetShiftReportResponseMock = (overrideResponse: Partial<Extract<ShiftReportResponse, object>> = {}): ShiftReportResponse => ({cash_movements: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({amount: faker.number.int(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', moved_by_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.string.alpha({length: {min: 10, max: 20}})})), cash_movements_in: faker.number.int(), cash_movements_net: faker.number.int(), cash_movements_out: faker.number.int(), expected_cash: faker.number.int(), net_payments: faker.number.int(), payment_summary: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({is_cash: faker.datatype.boolean(), order_count: faker.number.int(), payment_method: faker.string.alpha({length: {min: 10, max: 20}}), total: faker.number.int()})), printed_at: faker.date.past().toISOString().slice(0, 19) + 'Z', shift: {branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), cash_discrepancy: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), closing_cash_declared: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), closing_cash_system: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), force_close_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), force_closed_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), force_closed_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), notes: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opened_at: faker.date.past().toISOString().slice(0, 19) + 'Z', opening_cash: faker.number.int(), opening_cash_edit_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), opening_cash_original: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), opening_cash_was_edited: faker.datatype.boolean(), status: faker.string.alpha({length: {min: 10, max: 20}}), teller_id: faker.string.uuid(), teller_name: faker.string.alpha({length: {min: 10, max: 20}}), till_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), till_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])}, total_payments: faker.number.int(), voided_amount: faker.number.int(), ...overrideResponse})

export const getListStocktakesResponseMock = (): Stocktake[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', finalized_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), finalized_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', started_by: faker.string.uuid(), started_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getCreateStocktakeResponseMock = (): StocktakeFull => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', finalized_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), finalized_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', started_by: faker.string.uuid(), started_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}})},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_inventory_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_qty: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', expected_qty: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_ingredient_id: faker.string.uuid(), stocktake_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), variance: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), variance_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), variance_threshold_pct: faker.number.float({fractionDigits: 2})},})

export const getGetStocktakeResponseMock = (): StocktakeFull => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', finalized_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), finalized_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', started_by: faker.string.uuid(), started_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}})},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_inventory_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_qty: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', expected_qty: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_ingredient_id: faker.string.uuid(), stocktake_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), variance: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), variance_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), variance_threshold_pct: faker.number.float({fractionDigits: 2})},})

export const getCancelStocktakeResponseMock = (overrideResponse: Partial<Extract<Stocktake, object>> = {}): Stocktake => ({branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', finalized_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), finalized_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', started_by: faker.string.uuid(), started_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getFinalizeStocktakeResponseMock = (): StocktakeFull => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', finalized_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), finalized_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', started_by: faker.string.uuid(), started_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}})},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_inventory_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_qty: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', expected_qty: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_ingredient_id: faker.string.uuid(), stocktake_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), variance: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), variance_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), variance_threshold_pct: faker.number.float({fractionDigits: 2})},})

export const getUpsertItemsResponseMock = (): StocktakeFull => ({...{branch_id: faker.string.uuid(), branch_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', finalized_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), finalized_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), id: faker.string.uuid(), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_id: faker.string.uuid(), started_at: faker.date.past().toISOString().slice(0, 19) + 'Z', started_by: faker.string.uuid(), started_by_name: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), status: faker.string.alpha({length: {min: 10, max: 20}})},...{items: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_inventory_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_by: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), counted_qty: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', expected_qty: faker.number.float({fractionDigits: 2}), id: faker.string.uuid(), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), note: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), org_ingredient_id: faker.string.uuid(), stocktake_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), variance: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), variance_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined])})), variance_threshold_pct: faker.number.float({fractionDigits: 2})},})

export const getVarianceReportResponseMock = (overrideResponse: Partial<Extract<VarianceReport, object>> = {}): VarianceReport => ({net_variance_value: faker.number.int(), rows: Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({counted_qty: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), expected_qty: faker.number.float({fractionDigits: 2}), ingredient_name: faker.string.alpha({length: {min: 10, max: 20}}), is_flagged: faker.datatype.boolean(), org_ingredient_id: faker.string.uuid(), unit: faker.string.alpha({length: {min: 10, max: 20}}), unit_cost: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined]), variance: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.float({fractionDigits: 2}), null]), undefined]), variance_reason: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), variance_value: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.number.int(), null]), undefined])})), stocktake_id: faker.string.uuid(), total_overage_value: faker.number.int(), total_shrinkage_value: faker.number.int(), unknown_cost_count: faker.number.int(), variance_threshold_pct: faker.number.float({fractionDigits: 2}), ...overrideResponse})

export const getListTillsResponseMock = (): Till[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z'})))

export const getCreateTillResponseMock = (overrideResponse: Partial<Extract<Till, object>> = {}): Till => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getUpdateTillResponseMock = (overrideResponse: Partial<Extract<Till, object>> = {}): Till => ({branch_id: faker.string.uuid(), created_at: faker.date.past().toISOString().slice(0, 19) + 'Z', id: faker.string.uuid(), is_active: faker.datatype.boolean(), is_default: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.string.uuid(), updated_at: faker.date.past().toISOString().slice(0, 19) + 'Z', ...overrideResponse})

export const getListTimezonesResponseMock = (): string[] => (Array.from({length: faker.number.int({min: 1, max: 10})}, () => faker.word.sample()))

export const getUploadMenuItemImageResponseMock = (overrideResponse: Partial<Extract<UploadResponse, object>> = {}): UploadResponse => ({image_url: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getListUsersResponseMock = (): UserPublic[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))})))

export const getCreateUserResponseMock = (overrideResponse: Partial<Extract<CreateUserResponse, object>> = {}): CreateUserResponse => ({user: {branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole))}, ...overrideResponse})

export const getGetUserResponseMock = (overrideResponse: Partial<Extract<UserPublic, object>> = {}): UserPublic => ({branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole)), ...overrideResponse})

export const getUpdateUserResponseMock = (overrideResponse: Partial<Extract<UserPublic, object>> = {}): UserPublic => ({branch_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), email: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), id: faker.string.uuid(), is_active: faker.datatype.boolean(), name: faker.string.alpha({length: {min: 10, max: 20}}), org_id: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.uuid(), null]), undefined]), phone: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), role: faker.helpers.arrayElement(Object.values(UserRole)), ...overrideResponse})

export const getListUserBranchesResponseMock = (): UserBranch[] => (Array.from({ length: faker.number.int({min: 1, max: 10}) }, (_, i) => i + 1).map(() => ({branch_id: faker.string.uuid(), branch_name: faker.string.alpha({length: {min: 10, max: 20}})})))

export const getWhatsappLogoutResponseMock = (overrideResponse: Partial<Extract<WhatsappStatus, object>> = {}): WhatsappStatus => ({configured: faker.datatype.boolean(), connected: faker.datatype.boolean(), has_qr: faker.datatype.boolean(), logged_in: faker.datatype.boolean(), paused: faker.datatype.boolean(), paused_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), qr_image: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), reachable: faker.datatype.boolean(), session: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getWhatsappPairResponseMock = (overrideResponse: Partial<Extract<WhatsappStatus, object>> = {}): WhatsappStatus => ({configured: faker.datatype.boolean(), connected: faker.datatype.boolean(), has_qr: faker.datatype.boolean(), logged_in: faker.datatype.boolean(), paused: faker.datatype.boolean(), paused_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), qr_image: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), reachable: faker.datatype.boolean(), session: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getWhatsappPauseResponseMock = (overrideResponse: Partial<Extract<WhatsappStatus, object>> = {}): WhatsappStatus => ({configured: faker.datatype.boolean(), connected: faker.datatype.boolean(), has_qr: faker.datatype.boolean(), logged_in: faker.datatype.boolean(), paused: faker.datatype.boolean(), paused_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), qr_image: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), reachable: faker.datatype.boolean(), session: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})

export const getWhatsappStatusResponseMock = (overrideResponse: Partial<Extract<WhatsappStatus, object>> = {}): WhatsappStatus => ({configured: faker.datatype.boolean(), connected: faker.datatype.boolean(), has_qr: faker.datatype.boolean(), logged_in: faker.datatype.boolean(), paused: faker.datatype.boolean(), paused_at: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.date.past().toISOString().slice(0, 19) + 'Z', null]), undefined]), qr_image: faker.helpers.arrayElement([faker.helpers.arrayElement([faker.string.alpha({length: {min: 10, max: 20}}), null]), undefined]), reachable: faker.datatype.boolean(), session: faker.string.alpha({length: {min: 10, max: 20}}), ...overrideResponse})


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

export const getListAddonCatalogMockHandler = (overrideResponse?: PaginatedAddonItems | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PaginatedAddonItems> | PaginatedAddonItems), options?: RequestHandlerOptions) => {
  return http.get('*/addon-items/catalog', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListAddonCatalogResponseMock(),
      { status: 200
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

export const getChatMockHandler = (overrideResponse?: AiChatResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<AiChatResponse> | AiChatResponse), options?: RequestHandlerOptions) => {
  return http.post('*/ai/chat', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getChatResponseMock(),
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

export const getListBranchAddonOverridesMockHandler = (overrideResponse?: BranchAddonOverride[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchAddonOverride[]> | BranchAddonOverride[]), options?: RequestHandlerOptions) => {
  return http.get('*/branch-addon-overrides', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListBranchAddonOverridesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertBranchAddonOverrideMockHandler = (overrideResponse?: BranchAddonOverride | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<BranchAddonOverride> | BranchAddonOverride), options?: RequestHandlerOptions) => {
  return http.put('*/branch-addon-overrides', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertBranchAddonOverrideResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteBranchAddonOverrideMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/branch-addon-overrides', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getListBranchMenuOverridesMockHandler = (overrideResponse?: BranchMenuOverride[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchMenuOverride[]> | BranchMenuOverride[]), options?: RequestHandlerOptions) => {
  return http.get('*/branch-menu-overrides', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListBranchMenuOverridesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertBranchMenuOverrideMockHandler = (overrideResponse?: BranchMenuOverride | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<BranchMenuOverride> | BranchMenuOverride), options?: RequestHandlerOptions) => {
  return http.put('*/branch-menu-overrides', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertBranchMenuOverrideResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteBranchMenuOverrideMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/branch-menu-overrides', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
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

export const getBranchQrMockHandler = (overrideResponse?: QrResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<QrResponse> | QrResponse), options?: RequestHandlerOptions) => {
  return http.get('*/branches/:id/qr', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchQrResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListTablesMockHandler = (overrideResponse?: BranchTable[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchTable[]> | BranchTable[]), options?: RequestHandlerOptions) => {
  return http.get('*/branches/:id/tables', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListTablesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateTableMockHandler = (overrideResponse?: BranchTable | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BranchTable> | BranchTable), options?: RequestHandlerOptions) => {
  return http.post('*/branches/:id/tables', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateTableResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteTableMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/branches/:id/tables/:tid', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getTableQrMockHandler = (overrideResponse?: QrResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<QrResponse> | QrResponse), options?: RequestHandlerOptions) => {
  return http.get('*/branches/:id/tables/:tid/qr', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getTableQrResponseMock(),
      { status: 200
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

export const getCatalogSyncMockHandler = (overrideResponse?: CatalogSyncResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<CatalogSyncResponse> | CatalogSyncResponse), options?: RequestHandlerOptions) => {
  return http.get('*/catalog/sync', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCatalogSyncResponseMock(),
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

export const getListMenuCatalogMockHandler = (overrideResponse?: PaginatedMenuItems | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PaginatedMenuItems> | PaginatedMenuItems), options?: RequestHandlerOptions) => {
  return http.get('*/costing/catalog', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListMenuCatalogResponseMock(),
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

export const getListDeliveryOrdersMockHandler = (overrideResponse?: DeliveryOrder[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DeliveryOrder[]> | DeliveryOrder[]), options?: RequestHandlerOptions) => {
  return http.get('*/delivery-orders', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListDeliveryOrdersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getStreamDeliveryOrdersMockHandler = (overrideResponse?: unknown | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<unknown> | unknown), options?: RequestHandlerOptions) => {
  return http.get('*/delivery-orders/stream', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 200
      })
  }, options)
}

export const getGetDeliveryOrderMockHandler = (overrideResponse?: DeliveryOrder | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DeliveryOrder> | DeliveryOrder), options?: RequestHandlerOptions) => {
  return http.get('*/delivery-orders/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetDeliveryOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCancelDeliveryOrderMockHandler = (overrideResponse?: DeliveryOrder | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DeliveryOrder> | DeliveryOrder), options?: RequestHandlerOptions) => {
  return http.post('*/delivery-orders/:id/cancel', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCancelDeliveryOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getFinalizeDeliveryOrderMockHandler = (overrideResponse?: FinalizeResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<FinalizeResponse> | FinalizeResponse), options?: RequestHandlerOptions) => {
  return http.post('*/delivery-orders/:id/finalize', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getFinalizeDeliveryOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSetPrepTimeMockHandler = (overrideResponse?: DeliveryOrder | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DeliveryOrder> | DeliveryOrder), options?: RequestHandlerOptions) => {
  return http.post('*/delivery-orders/:id/prep-time', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSetPrepTimeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeliveryOrderQrMockHandler = (overrideResponse?: QrResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<QrResponse> | QrResponse), options?: RequestHandlerOptions) => {
  return http.get('*/delivery-orders/:id/qr', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getDeliveryOrderQrResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSetStatusMockHandler = (overrideResponse?: DeliveryOrder | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DeliveryOrder> | DeliveryOrder), options?: RequestHandlerOptions) => {
  return http.post('*/delivery-orders/:id/status', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSetStatusResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSetAcceptingMockHandler = (overrideResponse?: BranchDeliverySettings | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BranchDeliverySettings> | BranchDeliverySettings), options?: RequestHandlerOptions) => {
  return http.post('*/delivery/accepting', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSetAcceptingResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListChannelAddonOverridesMockHandler = (overrideResponse?: ChannelAddonOverride[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ChannelAddonOverride[]> | ChannelAddonOverride[]), options?: RequestHandlerOptions) => {
  return http.get('*/delivery/channel-addon-overrides', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListChannelAddonOverridesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertChannelAddonOverrideMockHandler = (overrideResponse?: ChannelAddonOverride | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<ChannelAddonOverride> | ChannelAddonOverride), options?: RequestHandlerOptions) => {
  return http.put('*/delivery/channel-addon-overrides', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertChannelAddonOverrideResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteChannelAddonOverrideMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/delivery/channel-addon-overrides', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getListChannelOverridesMockHandler = (overrideResponse?: ChannelMenuOverride[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ChannelMenuOverride[]> | ChannelMenuOverride[]), options?: RequestHandlerOptions) => {
  return http.get('*/delivery/channel-overrides', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListChannelOverridesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertChannelOverrideMockHandler = (overrideResponse?: ChannelMenuOverride | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<ChannelMenuOverride> | ChannelMenuOverride), options?: RequestHandlerOptions) => {
  return http.put('*/delivery/channel-overrides', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertChannelOverrideResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeleteChannelOverrideMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/delivery/channel-overrides', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getGetBranchSettingsMockHandler = (overrideResponse?: BranchDeliverySettings | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchDeliverySettings> | BranchDeliverySettings), options?: RequestHandlerOptions) => {
  return http.get('*/delivery/settings', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetBranchSettingsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPutBranchSettingsMockHandler = (overrideResponse?: BranchDeliverySettings | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<BranchDeliverySettings> | BranchDeliverySettings), options?: RequestHandlerOptions) => {
  return http.put('*/delivery/settings', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutBranchSettingsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListZonesMockHandler = (overrideResponse?: DeliveryZone[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DeliveryZone[]> | DeliveryZone[]), options?: RequestHandlerOptions) => {
  return http.get('*/delivery/zones', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListZonesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateZoneMockHandler = (overrideResponse?: DeliveryZone | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DeliveryZone> | DeliveryZone), options?: RequestHandlerOptions) => {
  return http.post('*/delivery/zones', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateZoneResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteZoneMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/delivery/zones/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateZoneMockHandler = (overrideResponse?: DeliveryZone | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<DeliveryZone> | DeliveryZone), options?: RequestHandlerOptions) => {
  return http.patch('*/delivery/zones/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateZoneResponseMock(),
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

export const getSaveLayoutMockHandler = (overrideResponse?: FloorTable[] | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<FloorTable[]> | FloorTable[]), options?: RequestHandlerOptions) => {
  return http.put('*/floor/layout', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSaveLayoutResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetReservationSettingsMockHandler = (overrideResponse?: ReservationSettings | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ReservationSettings> | ReservationSettings), options?: RequestHandlerOptions) => {
  return http.get('*/floor/reservation-settings', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetReservationSettingsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPutReservationSettingsMockHandler = (overrideResponse?: ReservationSettings | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<ReservationSettings> | ReservationSettings), options?: RequestHandlerOptions) => {
  return http.put('*/floor/reservation-settings', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutReservationSettingsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListSectionsMockHandler = (overrideResponse?: FloorSection[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<FloorSection[]> | FloorSection[]), options?: RequestHandlerOptions) => {
  return http.get('*/floor/sections', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListSectionsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateSectionMockHandler = (overrideResponse?: FloorSection | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<FloorSection> | FloorSection), options?: RequestHandlerOptions) => {
  return http.post('*/floor/sections', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateSectionResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteSectionMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/floor/sections/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateSectionMockHandler = (overrideResponse?: FloorSection | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<FloorSection> | FloorSection), options?: RequestHandlerOptions) => {
  return http.patch('*/floor/sections/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateSectionResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListFloorTablesMockHandler = (overrideResponse?: FloorTable[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<FloorTable[]> | FloorTable[]), options?: RequestHandlerOptions) => {
  return http.get('*/floor/tables', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListFloorTablesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateFloorTableMockHandler = (overrideResponse?: FloorTable | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<FloorTable> | FloorTable), options?: RequestHandlerOptions) => {
  return http.post('*/floor/tables', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateFloorTableResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteFloorTableMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/floor/tables/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateFloorTableMockHandler = (overrideResponse?: FloorTable | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<FloorTable> | FloorTable), options?: RequestHandlerOptions) => {
  return http.patch('*/floor/tables/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateFloorTableResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSetTableStatusMockHandler = (overrideResponse?: FloorTable | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<FloorTable> | FloorTable), options?: RequestHandlerOptions) => {
  return http.patch('*/floor/tables/:id/status', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSetTableStatusResponseMock(),
      { status: 200
      })
  }, options)
}

export const getMarginWatchMockHandler = (overrideResponse?: MarginWatch | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MarginWatch> | MarginWatch), options?: RequestHandlerOptions) => {
  return http.get('*/insights/branches/:branchId/margin-watch', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getMarginWatchResponseMock(),
      { status: 200
      })
  }, options)
}

export const getMenuMarginLedgerMockHandler = (overrideResponse?: MarginLedgerReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MarginLedgerReport> | MarginLedgerReport), options?: RequestHandlerOptions) => {
  return http.get('*/insights/branches/:branchId/menu-margin', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getMenuMarginLedgerResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListDecisionsMockHandler = (overrideResponse?: DecisionOut[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DecisionOut[]> | DecisionOut[]), options?: RequestHandlerOptions) => {
  return http.get('*/insights/decisions', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListDecisionsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateDecisionMockHandler = (overrideResponse?: DecisionOut | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DecisionOut> | DecisionOut), options?: RequestHandlerOptions) => {
  return http.post('*/insights/decisions', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateDecisionResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetMarginTargetsMockHandler = (overrideResponse?: MarginTargets | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MarginTargets> | MarginTargets), options?: RequestHandlerOptions) => {
  return http.get('*/insights/margin-target', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetMarginTargetsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPutMarginTargetMockHandler = (overrideResponse?: MarginTargets | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<MarginTargets> | MarginTargets), options?: RequestHandlerOptions) => {
  return http.put('*/insights/margin-target', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutMarginTargetResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListMovementsMockHandler = (overrideResponse?: BranchInventoryMovement[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchInventoryMovement[]> | BranchInventoryMovement[]), options?: RequestHandlerOptions) => {
  return http.get('*/inventory/branches/:branchId/movements', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListMovementsResponseMock(),
      { status: 200
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

export const getListWasteMockHandler = (overrideResponse?: BranchInventoryMovement[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BranchInventoryMovement[]> | BranchInventoryMovement[]), options?: RequestHandlerOptions) => {
  return http.get('*/inventory/branches/:branchId/waste', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListWasteResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateWasteMockHandler = (overrideResponse?: BranchInventoryMovement | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BranchInventoryMovement> | BranchInventoryMovement), options?: RequestHandlerOptions) => {
  return http.post('*/inventory/branches/:branchId/waste', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateWasteResponseMock(),
      { status: 201
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

export const getGetInventorySettingsMockHandler = (overrideResponse?: OrgInventorySettings | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OrgInventorySettings> | OrgInventorySettings), options?: RequestHandlerOptions) => {
  return http.get('*/inventory/orgs/:orgId/settings', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetInventorySettingsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpdateInventorySettingsMockHandler = (overrideResponse?: OrgInventorySettings | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<OrgInventorySettings> | OrgInventorySettings), options?: RequestHandlerOptions) => {
  return http.put('*/inventory/orgs/:orgId/settings', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateInventorySettingsResponseMock(),
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

export const getBumpMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.post('*/kitchen/items/:itemId/bump', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUnbumpMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.post('*/kitchen/items/:itemId/unbump', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getFeedMockHandler = (overrideResponse?: KitchenTicketView[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<KitchenTicketView[]> | KitchenTicketView[]), options?: RequestHandlerOptions) => {
  return http.get('*/kitchen/orders', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getFeedResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListRoutesMockHandler = (overrideResponse?: StationRoutes | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<StationRoutes> | StationRoutes), options?: RequestHandlerOptions) => {
  return http.get('*/kitchen/routes', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListRoutesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPutCategoryRouteMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.put('*/kitchen/routes/category', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getDeleteCategoryRouteMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/kitchen/routes/category', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getPutItemRouteMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.put('*/kitchen/routes/item', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getDeleteItemRouteMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/kitchen/routes/item', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getGetRoutingModeMockHandler = (overrideResponse?: RoutingModeResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<RoutingModeResponse> | RoutingModeResponse), options?: RequestHandlerOptions) => {
  return http.get('*/kitchen/routing-mode', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetRoutingModeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSetRoutingModeMockHandler = (overrideResponse?: RoutingModeResponse | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<RoutingModeResponse> | RoutingModeResponse), options?: RequestHandlerOptions) => {
  return http.put('*/kitchen/routing-mode', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSetRoutingModeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListStationsMockHandler = (overrideResponse?: KitchenStation[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<KitchenStation[]> | KitchenStation[]), options?: RequestHandlerOptions) => {
  return http.get('*/kitchen/stations', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListStationsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateStationMockHandler = (overrideResponse?: KitchenStation | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<KitchenStation> | KitchenStation), options?: RequestHandlerOptions) => {
  return http.post('*/kitchen/stations', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateStationResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteStationMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/kitchen/stations/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateStationMockHandler = (overrideResponse?: KitchenStation | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<KitchenStation> | KitchenStation), options?: RequestHandlerOptions) => {
  return http.patch('*/kitchen/stations/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateStationResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPutSizeRecipeMockHandler = (overrideResponse?: RecipeCostResult | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<RecipeCostResult> | RecipeCostResult), options?: RequestHandlerOptions) => {
  return http.put('*/menu-item-sizes/:sizeId/recipe', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutSizeRecipeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListMenuItemsMockHandler = (overrideResponse?: MenuItem[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MenuItem[]> | MenuItem[]), options?: RequestHandlerOptions) => {
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

export const getPutAllowedAddonsMockHandler = (overrideResponse?: string[] | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<string[]> | string[]), options?: RequestHandlerOptions) => {
  return http.put('*/menu-items/:id/allowed-addons', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutAllowedAddonsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGetItemCostMockHandler = (overrideResponse?: SizeCostOut[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<SizeCostOut[]> | SizeCostOut[]), options?: RequestHandlerOptions) => {
  return http.get('*/menu-items/:id/cost', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetItemCostResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDuplicateItemMockHandler = (overrideResponse?: StudioAggregate | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<StudioAggregate> | StudioAggregate), options?: RequestHandlerOptions) => {
  return http.post('*/menu-items/:id/duplicate', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getDuplicateItemResponseMock(),
      { status: 201
      })
  }, options)
}

export const getPutModifierGroupsMockHandler = (overrideResponse?: StudioAggregate | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<StudioAggregate> | StudioAggregate), options?: RequestHandlerOptions) => {
  return http.put('*/menu-items/:id/modifier-groups', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutModifierGroupsResponseMock(),
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

export const getPutItemOptionsMockHandler = (overrideResponse?: ItemOptionOut[] | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<ItemOptionOut[]> | ItemOptionOut[]), options?: RequestHandlerOptions) => {
  return http.put('*/menu-items/:id/options', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutItemOptionsResponseMock(),
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

export const getPutSizesMockHandler = (overrideResponse?: StudioAggregate | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<StudioAggregate> | StudioAggregate), options?: RequestHandlerOptions) => {
  return http.put('*/menu-items/:id/sizes', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutSizesResponseMock(),
      { status: 200
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

export const getGetStudioMockHandler = (overrideResponse?: StudioAggregate | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<StudioAggregate> | StudioAggregate), options?: RequestHandlerOptions) => {
  return http.get('*/menu-items/:id/studio', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetStudioResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPutPriceOverrideMockHandler = (overrideResponse?: PriceOverrideOut | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<PriceOverrideOut> | PriceOverrideOut), options?: RequestHandlerOptions) => {
  return http.put('*/menu-price-overrides', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutPriceOverrideResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeletePriceOverrideMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/menu-price-overrides', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getListGroupsMockHandler = (overrideResponse?: GroupOut[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<GroupOut[]> | GroupOut[]), options?: RequestHandlerOptions) => {
  return http.get('*/modifier-groups', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListGroupsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateGroupMockHandler = (overrideResponse?: GroupOut | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<GroupOut> | GroupOut), options?: RequestHandlerOptions) => {
  return http.post('*/modifier-groups', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateGroupResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteGroupMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/modifier-groups/:gid', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getPatchGroupMockHandler = (overrideResponse?: GroupOut | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<GroupOut> | GroupOut), options?: RequestHandlerOptions) => {
  return http.patch('*/modifier-groups/:gid', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPatchGroupResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateOptionMockHandler = (overrideResponse?: GroupOptionOut | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<GroupOptionOut> | GroupOptionOut), options?: RequestHandlerOptions) => {
  return http.post('*/modifier-groups/:gid/options', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateOptionResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteOptionMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/modifier-options/:oid', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getPatchOptionMockHandler = (overrideResponse?: GroupOptionOut | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<GroupOptionOut> | GroupOptionOut), options?: RequestHandlerOptions) => {
  return http.patch('*/modifier-options/:oid', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPatchOptionResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPutOptionRecipeMockHandler = (overrideResponse?: OptionRecipeLineInput[] | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<OptionRecipeLineInput[]> | OptionRecipeLineInput[]), options?: RequestHandlerOptions) => {
  return http.put('*/modifier-options/:oid/recipe', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPutOptionRecipeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListOpenTicketsMockHandler = (overrideResponse?: OpenTicketView[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OpenTicketView[]> | OpenTicketView[]), options?: RequestHandlerOptions) => {
  return http.get('*/open-tickets', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListOpenTicketsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateOpenTicketMockHandler = (overrideResponse?: OpenTicketView | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OpenTicketView> | OpenTicketView), options?: RequestHandlerOptions) => {
  return http.post('*/open-tickets', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateOpenTicketResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetOpenTicketMockHandler = (overrideResponse?: OpenTicketView | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OpenTicketView> | OpenTicketView), options?: RequestHandlerOptions) => {
  return http.get('*/open-tickets/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetOpenTicketResponseMock(),
      { status: 200
      })
  }, options)
}

export const getAddRoundMockHandler = (overrideResponse?: OpenTicketView | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OpenTicketView> | OpenTicketView), options?: RequestHandlerOptions) => {
  return http.post('*/open-tickets/:id/rounds', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getAddRoundResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSettleOpenTicketMockHandler = (overrideResponse?: Order | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Order> | Order), options?: RequestHandlerOptions) => {
  return http.post('*/open-tickets/:id/settle', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSettleOpenTicketResponseMock(),
      { status: 200
      })
  }, options)
}

export const getMoveTicketTableMockHandler = (overrideResponse?: OpenTicketView | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<OpenTicketView> | OpenTicketView), options?: RequestHandlerOptions) => {
  return http.patch('*/open-tickets/:id/table', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getMoveTicketTableResponseMock(),
      { status: 200
      })
  }, options)
}

export const getVoidOpenTicketMockHandler = (overrideResponse?: OpenTicketView | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OpenTicketView> | OpenTicketView), options?: RequestHandlerOptions) => {
  return http.post('*/open-tickets/:id/void', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getVoidOpenTicketResponseMock(),
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

export const getOfflineAuthBundleMockHandler = (overrideResponse?: OfflineAuthBundle | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OfflineAuthBundle> | OfflineAuthBundle), options?: RequestHandlerOptions) => {
  return http.get('*/orgs/:id/offline-auth-bundle', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOfflineAuthBundleResponseMock(),
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

export const getOrgQrMockHandler = (overrideResponse?: QrResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<QrResponse> | QrResponse), options?: RequestHandlerOptions) => {
  return http.get('*/orgs/:id/qr', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOrgQrResponseMock(),
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

export const getPublicBranchesMockHandler = (overrideResponse?: PublicBranch[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PublicBranch[]> | PublicBranch[]), options?: RequestHandlerOptions) => {
  return http.get('*/public/branches', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPublicBranchesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getDeliveryQuoteMockHandler = (overrideResponse?: QuoteResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<QuoteResponse> | QuoteResponse), options?: RequestHandlerOptions) => {
  return http.get('*/public/branches/:id/delivery-quote', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getDeliveryQuoteResponseMock(),
      { status: 200
      })
  }, options)
}

export const getPublicMenuMockHandler = (overrideResponse?: DeliveryMenu | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DeliveryMenu> | DeliveryMenu), options?: RequestHandlerOptions) => {
  return http.get('*/public/branches/:id/menu', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getPublicMenuResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateDeliveryOrderMockHandler = (overrideResponse?: DeliveryOrder | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<DeliveryOrder> | DeliveryOrder), options?: RequestHandlerOptions) => {
  return http.post('*/public/delivery-orders', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateDeliveryOrderResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGuestOrderHistoryMockHandler = (overrideResponse?: OrderHistorySummary[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<OrderHistorySummary[]> | OrderHistorySummary[]), options?: RequestHandlerOptions) => {
  return http.get('*/public/delivery-orders/history', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGuestOrderHistoryResponseMock(),
      { status: 200
      })
  }, options)
}

export const getGuestPastLocationsMockHandler = (overrideResponse?: GuestSavedLocation[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<GuestSavedLocation[]> | GuestSavedLocation[]), options?: RequestHandlerOptions) => {
  return http.get('*/public/delivery-orders/past-locations', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGuestPastLocationsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getTrackDeliveryOrderMockHandler = (overrideResponse?: DeliveryTracking | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DeliveryTracking> | DeliveryTracking), options?: RequestHandlerOptions) => {
  return http.get('*/public/delivery-orders/:id/track', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getTrackDeliveryOrderResponseMock(),
      { status: 200
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

export const getOtpRequestMockHandler = (overrideResponse?: OtpRequestResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OtpRequestResponse> | OtpRequestResponse), options?: RequestHandlerOptions) => {
  return http.post('*/public/otp/request', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOtpRequestResponseMock(),
      { status: 200
      })
  }, options)
}

export const getOtpVerifyMockHandler = (overrideResponse?: OtpVerifyResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<OtpVerifyResponse> | OtpVerifyResponse), options?: RequestHandlerOptions) => {
  return http.post('*/public/otp/verify', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOtpVerifyResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreatePublicBookingMockHandler = (overrideResponse?: PublicBooking | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<PublicBooking> | PublicBooking), options?: RequestHandlerOptions) => {
  return http.post('*/public/reservations', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreatePublicBookingResponseMock(),
      { status: 201
      })
  }, options)
}

export const getListReservationPublicBranchesMockHandler = (overrideResponse?: PublicBranch[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PublicBranch[]> | PublicBranch[]), options?: RequestHandlerOptions) => {
  return http.get('*/public/reservations/branches', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListReservationPublicBranchesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getTrackPublicBookingMockHandler = (overrideResponse?: PublicBooking | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PublicBooking> | PublicBooking), options?: RequestHandlerOptions) => {
  return http.get('*/public/reservations/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getTrackPublicBookingResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListPurchaseOrdersMockHandler = (overrideResponse?: PurchaseOrder[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PurchaseOrder[]> | PurchaseOrder[]), options?: RequestHandlerOptions) => {
  return http.get('*/purchasing/branches/:branchId/orders', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListPurchaseOrdersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreatePurchaseOrderMockHandler = (overrideResponse?: PurchaseOrderFull | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<PurchaseOrderFull> | PurchaseOrderFull), options?: RequestHandlerOptions) => {
  return http.post('*/purchasing/branches/:branchId/orders', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreatePurchaseOrderResponseMock(),
      { status: 201
      })
  }, options)
}

export const getReorderSuggestionsMockHandler = (overrideResponse?: ReorderSuggestion[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ReorderSuggestion[]> | ReorderSuggestion[]), options?: RequestHandlerOptions) => {
  return http.get('*/purchasing/branches/:branchId/reorder-suggestions', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getReorderSuggestionsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateReturnMockHandler = (overrideResponse?: GoodsReceipt | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<GoodsReceipt> | GoodsReceipt), options?: RequestHandlerOptions) => {
  return http.post('*/purchasing/branches/:branchId/returns', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateReturnResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetPurchaseOrderMockHandler = (overrideResponse?: PurchaseOrderFull | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PurchaseOrderFull> | PurchaseOrderFull), options?: RequestHandlerOptions) => {
  return http.get('*/purchasing/orders/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetPurchaseOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCancelPurchaseOrderMockHandler = (overrideResponse?: PurchaseOrder | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<PurchaseOrder> | PurchaseOrder), options?: RequestHandlerOptions) => {
  return http.post('*/purchasing/orders/:id/cancel', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCancelPurchaseOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListPoReceiptsMockHandler = (overrideResponse?: GoodsReceipt[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<GoodsReceipt[]> | GoodsReceipt[]), options?: RequestHandlerOptions) => {
  return http.get('*/purchasing/orders/:id/receipts', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListPoReceiptsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getReceivePurchaseOrderMockHandler = (overrideResponse?: PurchaseOrderFull | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<PurchaseOrderFull> | PurchaseOrderFull), options?: RequestHandlerOptions) => {
  return http.post('*/purchasing/orders/:id/receive', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getReceivePurchaseOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getSubmitPurchaseOrderMockHandler = (overrideResponse?: PurchaseOrder | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<PurchaseOrder> | PurchaseOrder), options?: RequestHandlerOptions) => {
  return http.post('*/purchasing/orders/:id/submit', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getSubmitPurchaseOrderResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListOrgPurchaseOrdersMockHandler = (overrideResponse?: PurchaseOrder[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PurchaseOrder[]> | PurchaseOrder[]), options?: RequestHandlerOptions) => {
  return http.get('*/purchasing/orgs/:orgId/orders', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListOrgPurchaseOrdersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListSuppliersMockHandler = (overrideResponse?: Supplier[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Supplier[]> | Supplier[]), options?: RequestHandlerOptions) => {
  return http.get('*/purchasing/orgs/:orgId/suppliers', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListSuppliersResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateSupplierMockHandler = (overrideResponse?: Supplier | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Supplier> | Supplier), options?: RequestHandlerOptions) => {
  return http.post('*/purchasing/orgs/:orgId/suppliers', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateSupplierResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteSupplierMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/purchasing/suppliers/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateSupplierMockHandler = (overrideResponse?: Supplier | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<Supplier> | Supplier), options?: RequestHandlerOptions) => {
  return http.patch('*/purchasing/suppliers/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateSupplierResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListMarketingLinksMockHandler = (overrideResponse?: MarketingLink[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<MarketingLink[]> | MarketingLink[]), options?: RequestHandlerOptions) => {
  return http.get('*/qr/links', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListMarketingLinksResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateMarketingLinkMockHandler = (overrideResponse?: QrResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<QrResponse> | QrResponse), options?: RequestHandlerOptions) => {
  return http.post('*/qr/links', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateMarketingLinkResponseMock(),
      { status: 201
      })
  }, options)
}

export const getStreamMockHandler = (overrideResponse?: unknown | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<unknown> | unknown), options?: RequestHandlerOptions) => {
  return http.get('*/realtime/stream', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
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

export const getBranchConsumptionMockHandler = (overrideResponse?: ConsumptionRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ConsumptionRow[]> | ConsumptionRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/consumption', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchConsumptionResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchDeliverySalesMockHandler = (overrideResponse?: DeliverySalesReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<DeliverySalesReport> | DeliverySalesReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/delivery-sales', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchDeliverySalesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchInventoryValuationMockHandler = (overrideResponse?: InventoryValuationReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<InventoryValuationReport> | InventoryValuationReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/inventory-valuation', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchInventoryValuationResponseMock(),
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

export const getBranchLowStockMockHandler = (overrideResponse?: LowStockRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<LowStockRow[]> | LowStockRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/low-stock', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchLowStockResponseMock(),
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

export const getBranchSalesPeakHoursMockHandler = (overrideResponse?: PeakHourPoint[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PeakHourPoint[]> | PeakHourPoint[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/sales/peak-hours', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchSalesPeakHoursResponseMock(),
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

export const getBranchShrinkageMockHandler = (overrideResponse?: ShrinkageRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ShrinkageRow[]> | ShrinkageRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/shrinkage', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchShrinkageResponseMock(),
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

export const getBranchWaiterStatsMockHandler = (overrideResponse?: WaiterStatsReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<WaiterStatsReport> | WaiterStatsReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/waiters', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchWaiterStatsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getBranchWasteReportMockHandler = (overrideResponse?: WasteReportRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<WasteReportRow[]> | WasteReportRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/branches/:branchId/waste-report', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getBranchWasteReportResponseMock(),
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

export const getOrgConsumptionMockHandler = (overrideResponse?: ConsumptionRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ConsumptionRow[]> | ConsumptionRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/orgs/:orgId/consumption', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOrgConsumptionResponseMock(),
      { status: 200
      })
  }, options)
}

export const getOrgInventoryValuationMockHandler = (overrideResponse?: InventoryValuationReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<InventoryValuationReport> | InventoryValuationReport), options?: RequestHandlerOptions) => {
  return http.get('*/reports/orgs/:orgId/inventory-valuation', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOrgInventoryValuationResponseMock(),
      { status: 200
      })
  }, options)
}

export const getOrgLowStockMockHandler = (overrideResponse?: LowStockRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<LowStockRow[]> | LowStockRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/orgs/:orgId/low-stock', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOrgLowStockResponseMock(),
      { status: 200
      })
  }, options)
}

export const getOrgShrinkageMockHandler = (overrideResponse?: ShrinkageRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ShrinkageRow[]> | ShrinkageRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/orgs/:orgId/shrinkage', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOrgShrinkageResponseMock(),
      { status: 200
      })
  }, options)
}

export const getOrgWasteReportMockHandler = (overrideResponse?: WasteReportRow[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<WasteReportRow[]> | WasteReportRow[]), options?: RequestHandlerOptions) => {
  return http.get('*/reports/orgs/:orgId/waste-report', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getOrgWasteReportResponseMock(),
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

export const getShiftSummaryMockHandler = (overrideResponse?: ShiftSummary | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<ShiftSummary> | ShiftSummary), options?: RequestHandlerOptions) => {
  return http.get('*/reports/shifts/:shiftId/summary', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getShiftSummaryResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListBookingsMockHandler = (overrideResponse?: BookingView[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<BookingView[]> | BookingView[]), options?: RequestHandlerOptions) => {
  return http.get('*/reservations', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListBookingsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateBookingMockHandler = (overrideResponse?: BookingView | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BookingView> | BookingView), options?: RequestHandlerOptions) => {
  return http.post('*/reservations', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateBookingResponseMock(),
      { status: 201
      })
  }, options)
}

export const getUpdateBookingMockHandler = (overrideResponse?: BookingView | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<BookingView> | BookingView), options?: RequestHandlerOptions) => {
  return http.patch('*/reservations/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateBookingResponseMock(),
      { status: 200
      })
  }, options)
}

export const getAssignTablesMockHandler = (overrideResponse?: BookingView | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BookingView> | BookingView), options?: RequestHandlerOptions) => {
  return http.post('*/reservations/:id/assign', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getAssignTablesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getNotifyBookingMockHandler = (overrideResponse?: BookingView | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<BookingView> | BookingView), options?: RequestHandlerOptions) => {
  return http.post('*/reservations/:id/notify', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getNotifyBookingResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListShiftsMockHandler = (overrideResponse?: PaginatedShifts | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<PaginatedShifts> | PaginatedShifts), options?: RequestHandlerOptions) => {
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

export const getListStocktakesMockHandler = (overrideResponse?: Stocktake[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Stocktake[]> | Stocktake[]), options?: RequestHandlerOptions) => {
  return http.get('*/stocktakes/branches/:branchId', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListStocktakesResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateStocktakeMockHandler = (overrideResponse?: StocktakeFull | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<StocktakeFull> | StocktakeFull), options?: RequestHandlerOptions) => {
  return http.post('*/stocktakes/branches/:branchId', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateStocktakeResponseMock(),
      { status: 201
      })
  }, options)
}

export const getGetStocktakeMockHandler = (overrideResponse?: StocktakeFull | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<StocktakeFull> | StocktakeFull), options?: RequestHandlerOptions) => {
  return http.get('*/stocktakes/:id', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getGetStocktakeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCancelStocktakeMockHandler = (overrideResponse?: Stocktake | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Stocktake> | Stocktake), options?: RequestHandlerOptions) => {
  return http.post('*/stocktakes/:id/cancel', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCancelStocktakeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getFinalizeStocktakeMockHandler = (overrideResponse?: StocktakeFull | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<StocktakeFull> | StocktakeFull), options?: RequestHandlerOptions) => {
  return http.post('*/stocktakes/:id/finalize', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getFinalizeStocktakeResponseMock(),
      { status: 200
      })
  }, options)
}

export const getUpsertItemsMockHandler = (overrideResponse?: StocktakeFull | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Promise<StocktakeFull> | StocktakeFull), options?: RequestHandlerOptions) => {
  return http.put('*/stocktakes/:id/items', async (info: Parameters<Parameters<typeof http.put>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpsertItemsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getVarianceReportMockHandler = (overrideResponse?: VarianceReport | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<VarianceReport> | VarianceReport), options?: RequestHandlerOptions) => {
  return http.get('*/stocktakes/:id/variance-report', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getVarianceReportResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListTillsMockHandler = (overrideResponse?: Till[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<Till[]> | Till[]), options?: RequestHandlerOptions) => {
  return http.get('*/tills', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListTillsResponseMock(),
      { status: 200
      })
  }, options)
}

export const getCreateTillMockHandler = (overrideResponse?: Till | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<Till> | Till), options?: RequestHandlerOptions) => {
  return http.post('*/tills', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getCreateTillResponseMock(),
      { status: 201
      })
  }, options)
}

export const getDeleteTillMockHandler = (overrideResponse?: void | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Promise<void> | void), options?: RequestHandlerOptions) => {
  return http.delete('*/tills/:id', async (info: Parameters<Parameters<typeof http.delete>[1]>[0]) => {
  if (typeof overrideResponse === 'function') {await overrideResponse(info); }

    return new HttpResponse(null,
      { status: 204
      })
  }, options)
}

export const getUpdateTillMockHandler = (overrideResponse?: Till | ((info: Parameters<Parameters<typeof http.patch>[1]>[0]) => Promise<Till> | Till), options?: RequestHandlerOptions) => {
  return http.patch('*/tills/:id', async (info: Parameters<Parameters<typeof http.patch>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getUpdateTillResponseMock(),
      { status: 200
      })
  }, options)
}

export const getListTimezonesMockHandler = (overrideResponse?: string[] | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<string[]> | string[]), options?: RequestHandlerOptions) => {
  return http.get('*/timezones', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getListTimezonesResponseMock(),
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

export const getWhatsappLogoutMockHandler = (overrideResponse?: WhatsappStatus | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<WhatsappStatus> | WhatsappStatus), options?: RequestHandlerOptions) => {
  return http.post('*/whatsapp/logout', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getWhatsappLogoutResponseMock(),
      { status: 200
      })
  }, options)
}

export const getWhatsappPairMockHandler = (overrideResponse?: WhatsappStatus | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<WhatsappStatus> | WhatsappStatus), options?: RequestHandlerOptions) => {
  return http.post('*/whatsapp/pair', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getWhatsappPairResponseMock(),
      { status: 200
      })
  }, options)
}

export const getWhatsappPauseMockHandler = (overrideResponse?: WhatsappStatus | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Promise<WhatsappStatus> | WhatsappStatus), options?: RequestHandlerOptions) => {
  return http.post('*/whatsapp/pause', async (info: Parameters<Parameters<typeof http.post>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getWhatsappPauseResponseMock(),
      { status: 200
      })
  }, options)
}

export const getWhatsappStatusMockHandler = (overrideResponse?: WhatsappStatus | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Promise<WhatsappStatus> | WhatsappStatus), options?: RequestHandlerOptions) => {
  return http.get('*/whatsapp/status', async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {


    return HttpResponse.json(overrideResponse !== undefined
    ? (typeof overrideResponse === "function" ? await overrideResponse(info) : overrideResponse)
    : getWhatsappStatusResponseMock(),
      { status: 200
      })
  }, options)
}
export const getMadarAPIMock = () => [
  getListAddonItemsMockHandler(),
  getCreateAddonItemMockHandler(),
  getListAddonCatalogMockHandler(),
  getDeleteAddonItemMockHandler(),
  getUpdateAddonItemMockHandler(),
  getChatMockHandler(),
  getLoginMockHandler(),
  getMeMockHandler(),
  getGetMyPermissionsMockHandler(),
  getResolveBranchMockHandler(),
  getListBranchAddonOverridesMockHandler(),
  getUpsertBranchAddonOverrideMockHandler(),
  getDeleteBranchAddonOverrideMockHandler(),
  getListBranchMenuOverridesMockHandler(),
  getUpsertBranchMenuOverrideMockHandler(),
  getDeleteBranchMenuOverrideMockHandler(),
  getListBranchesMockHandler(),
  getCreateBranchMockHandler(),
  getGetBranchMockHandler(),
  getUpdateBranchMockHandler(),
  getDeleteBranchMockHandler(),
  getBranchQrMockHandler(),
  getListTablesMockHandler(),
  getCreateTableMockHandler(),
  getDeleteTableMockHandler(),
  getTableQrMockHandler(),
  getListBundlesMockHandler(),
  getCreateBundleMockHandler(),
  getAvailableBundlesMockHandler(),
  getGetBundleMockHandler(),
  getDeleteBundleMockHandler(),
  getUpdateBundleMockHandler(),
  getActivateBundleMockHandler(),
  getArchiveBundleMockHandler(),
  getBundlePerformanceMockHandler(),
  getCatalogSyncMockHandler(),
  getListCategoriesMockHandler(),
  getCreateCategoryMockHandler(),
  getDeleteCategoryMockHandler(),
  getUpdateCategoryMockHandler(),
  getListAddonCostsMockHandler(),
  getListMenuCatalogMockHandler(),
  getListSkuCostsMockHandler(),
  getListDeliveryOrdersMockHandler(),
  getStreamDeliveryOrdersMockHandler(),
  getGetDeliveryOrderMockHandler(),
  getCancelDeliveryOrderMockHandler(),
  getFinalizeDeliveryOrderMockHandler(),
  getSetPrepTimeMockHandler(),
  getDeliveryOrderQrMockHandler(),
  getSetStatusMockHandler(),
  getSetAcceptingMockHandler(),
  getListChannelAddonOverridesMockHandler(),
  getUpsertChannelAddonOverrideMockHandler(),
  getDeleteChannelAddonOverrideMockHandler(),
  getListChannelOverridesMockHandler(),
  getUpsertChannelOverrideMockHandler(),
  getDeleteChannelOverrideMockHandler(),
  getGetBranchSettingsMockHandler(),
  getPutBranchSettingsMockHandler(),
  getListZonesMockHandler(),
  getCreateZoneMockHandler(),
  getDeleteZoneMockHandler(),
  getUpdateZoneMockHandler(),
  getListDiscountsMockHandler(),
  getCreateDiscountMockHandler(),
  getDeleteDiscountMockHandler(),
  getUpdateDiscountMockHandler(),
  getSaveLayoutMockHandler(),
  getGetReservationSettingsMockHandler(),
  getPutReservationSettingsMockHandler(),
  getListSectionsMockHandler(),
  getCreateSectionMockHandler(),
  getDeleteSectionMockHandler(),
  getUpdateSectionMockHandler(),
  getListFloorTablesMockHandler(),
  getCreateFloorTableMockHandler(),
  getDeleteFloorTableMockHandler(),
  getUpdateFloorTableMockHandler(),
  getSetTableStatusMockHandler(),
  getMarginWatchMockHandler(),
  getMenuMarginLedgerMockHandler(),
  getListDecisionsMockHandler(),
  getCreateDecisionMockHandler(),
  getGetMarginTargetsMockHandler(),
  getPutMarginTargetMockHandler(),
  getListMovementsMockHandler(),
  getListBranchStockMockHandler(),
  getAddToBranchStockMockHandler(),
  getRemoveFromBranchStockMockHandler(),
  getUpdateBranchStockMockHandler(),
  getListTransfersMockHandler(),
  getListWasteMockHandler(),
  getCreateWasteMockHandler(),
  getListCatalogMockHandler(),
  getCreateCatalogItemMockHandler(),
  getDeleteCatalogItemMockHandler(),
  getUpdateCatalogItemMockHandler(),
  getGetInventorySettingsMockHandler(),
  getUpdateInventorySettingsMockHandler(),
  getCreateTransferMockHandler(),
  getDeleteTransferMockHandler(),
  getUpdateTransferMockHandler(),
  getBumpMockHandler(),
  getUnbumpMockHandler(),
  getFeedMockHandler(),
  getListRoutesMockHandler(),
  getPutCategoryRouteMockHandler(),
  getDeleteCategoryRouteMockHandler(),
  getPutItemRouteMockHandler(),
  getDeleteItemRouteMockHandler(),
  getGetRoutingModeMockHandler(),
  getSetRoutingModeMockHandler(),
  getListStationsMockHandler(),
  getCreateStationMockHandler(),
  getDeleteStationMockHandler(),
  getUpdateStationMockHandler(),
  getPutSizeRecipeMockHandler(),
  getListMenuItemsMockHandler(),
  getCreateMenuItemMockHandler(),
  getGetMenuItemMockHandler(),
  getDeleteMenuItemMockHandler(),
  getUpdateMenuItemMockHandler(),
  getListAddonSlotsMockHandler(),
  getCreateAddonSlotMockHandler(),
  getDeleteAddonSlotMockHandler(),
  getUpdateAddonSlotMockHandler(),
  getPutAllowedAddonsMockHandler(),
  getGetItemCostMockHandler(),
  getDuplicateItemMockHandler(),
  getPutModifierGroupsMockHandler(),
  getListOptionalFieldsMockHandler(),
  getCreateOptionalFieldMockHandler(),
  getDeleteOptionalFieldMockHandler(),
  getUpdateOptionalFieldMockHandler(),
  getPutItemOptionsMockHandler(),
  getListAddonOverridesMockHandler(),
  getUpsertAddonOverrideMockHandler(),
  getDeleteAddonOverrideMockHandler(),
  getPutSizesMockHandler(),
  getUpsertSizeMockHandler(),
  getDeleteSizeMockHandler(),
  getGetStudioMockHandler(),
  getPutPriceOverrideMockHandler(),
  getDeletePriceOverrideMockHandler(),
  getListGroupsMockHandler(),
  getCreateGroupMockHandler(),
  getDeleteGroupMockHandler(),
  getPatchGroupMockHandler(),
  getCreateOptionMockHandler(),
  getDeleteOptionMockHandler(),
  getPatchOptionMockHandler(),
  getPutOptionRecipeMockHandler(),
  getListOpenTicketsMockHandler(),
  getCreateOpenTicketMockHandler(),
  getGetOpenTicketMockHandler(),
  getAddRoundMockHandler(),
  getSettleOpenTicketMockHandler(),
  getMoveTicketTableMockHandler(),
  getVoidOpenTicketMockHandler(),
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
  getOfflineAuthBundleMockHandler(),
  getGetOnboardingMockHandler(),
  getCompleteOnboardingMockHandler(),
  getOrgQrMockHandler(),
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
  getPublicBranchesMockHandler(),
  getDeliveryQuoteMockHandler(),
  getPublicMenuMockHandler(),
  getCreateDeliveryOrderMockHandler(),
  getGuestOrderHistoryMockHandler(),
  getGuestPastLocationsMockHandler(),
  getTrackDeliveryOrderMockHandler(),
  getListPublicOrgsMockHandler(),
  getOtpRequestMockHandler(),
  getOtpVerifyMockHandler(),
  getCreatePublicBookingMockHandler(),
  getListReservationPublicBranchesMockHandler(),
  getTrackPublicBookingMockHandler(),
  getListPurchaseOrdersMockHandler(),
  getCreatePurchaseOrderMockHandler(),
  getReorderSuggestionsMockHandler(),
  getCreateReturnMockHandler(),
  getGetPurchaseOrderMockHandler(),
  getCancelPurchaseOrderMockHandler(),
  getListPoReceiptsMockHandler(),
  getReceivePurchaseOrderMockHandler(),
  getSubmitPurchaseOrderMockHandler(),
  getListOrgPurchaseOrdersMockHandler(),
  getListSuppliersMockHandler(),
  getCreateSupplierMockHandler(),
  getDeleteSupplierMockHandler(),
  getUpdateSupplierMockHandler(),
  getListMarketingLinksMockHandler(),
  getCreateMarketingLinkMockHandler(),
  getStreamMockHandler(),
  getListAddonIngredientsMockHandler(),
  getUpsertAddonIngredientMockHandler(),
  getDeleteAddonIngredientMockHandler(),
  getListDrinkRecipesMockHandler(),
  getUpsertDrinkRecipeMockHandler(),
  getDeleteDrinkRecipeMockHandler(),
  getBranchAddonSalesMockHandler(),
  getBranchBundleSalesMockHandler(),
  getBranchConsumptionMockHandler(),
  getBranchDeliverySalesMockHandler(),
  getBranchInventoryValuationMockHandler(),
  getBranchCombinedItemSalesMockHandler(),
  getBranchLowStockMockHandler(),
  getBranchSalesMockHandler(),
  getBranchSalesPeakHoursMockHandler(),
  getBranchSalesTimeseriesMockHandler(),
  getBranchShrinkageMockHandler(),
  getBranchStockMockHandler(),
  getBranchTellerStatsMockHandler(),
  getBranchWaiterStatsMockHandler(),
  getBranchWasteReportMockHandler(),
  getOrgBranchComparisonMockHandler(),
  getOrgConsumptionMockHandler(),
  getOrgInventoryValuationMockHandler(),
  getOrgLowStockMockHandler(),
  getOrgShrinkageMockHandler(),
  getOrgWasteReportMockHandler(),
  getShiftDeductionsMockHandler(),
  getShiftSummaryMockHandler(),
  getListBookingsMockHandler(),
  getCreateBookingMockHandler(),
  getUpdateBookingMockHandler(),
  getAssignTablesMockHandler(),
  getNotifyBookingMockHandler(),
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
  getListStocktakesMockHandler(),
  getCreateStocktakeMockHandler(),
  getGetStocktakeMockHandler(),
  getCancelStocktakeMockHandler(),
  getFinalizeStocktakeMockHandler(),
  getUpsertItemsMockHandler(),
  getVarianceReportMockHandler(),
  getListTillsMockHandler(),
  getCreateTillMockHandler(),
  getDeleteTillMockHandler(),
  getUpdateTillMockHandler(),
  getListTimezonesMockHandler(),
  getUploadMenuItemImageMockHandler(),
  getListUsersMockHandler(),
  getCreateUserMockHandler(),
  getGetUserMockHandler(),
  getDeleteUserMockHandler(),
  getUpdateUserMockHandler(),
  getListUserBranchesMockHandler(),
  getAssignBranchMockHandler(),
  getUnassignBranchMockHandler(),
  getWhatsappLogoutMockHandler(),
  getWhatsappPairMockHandler(),
  getWhatsappPauseMockHandler(),
  getWhatsappStatusMockHandler()
]
