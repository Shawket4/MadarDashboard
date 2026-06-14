/* eslint-disable */
// @ts-nocheck
import {
  useMutation,
  useQuery
} from '@tanstack/react-query';
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  MutationFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query';

import type {
  AddToStockRequest,
  AddonCost,
  AddonIngredient,
  AddonItem,
  AddonOverride,
  AddonSalesRow,
  AddonSlot,
  AssignBranchRequest,
  AuthPermissionsResponse,
  AvailableBundlesParams,
  Branch,
  BranchAddonSalesParams,
  BranchBundleSalesParams,
  BranchCombinedItemSalesParams,
  BranchConsumptionParams,
  BranchInventoryAdjustment,
  BranchInventoryItem,
  BranchInventoryMovement,
  BranchInventoryTransfer,
  BranchMenuEngineeringParams,
  BranchSalesParams,
  BranchSalesReport,
  BranchSalesTimeseriesParams,
  BranchShrinkageParams,
  BranchStockReport,
  BranchTellerStatsParams,
  BranchWasteReportParams,
  BundlePerformanceParams,
  BundlePerformanceResponse,
  BundleSalesRow,
  BundleSuggestionRecord,
  BundleWithComponents,
  CalibrationSummary,
  CashMovement,
  CashMovementRequest,
  Category,
  CloseShiftRequest,
  CloseShiftResponse,
  CombinedItemSalesRow,
  ConsumptionRow,
  CreateAddonItemRequest,
  CreateAddonSlotRequest,
  CreateAdjustmentRequest,
  CreateBranchRequest,
  CreateBundleRequest,
  CreateCatalogItemRequest,
  CreateCategoryRequest,
  CreateDiscountRequest,
  CreateMenuItemRequest,
  CreateOptionalFieldRequest,
  CreateOrderRequest,
  CreateOrgMultipart,
  CreatePaymentMethodRequest,
  CreatePurchaseOrderRequest,
  CreateRunBody,
  CreateRunResponse,
  CreateStocktakeRequest,
  CreateSupplierRequest,
  CreateTransferRequest,
  CreateUserRequest,
  CreateUserResponse,
  CreateWasteRequest,
  DecisionRecord,
  DeductionLogRow,
  DeleteAddonIngredientParams,
  DeleteDrinkRecipeParams,
  Discount,
  DrinkRecipe,
  ErrorBody,
  ExportOrdersParams,
  ExportResponse,
  ForceCloseRequest,
  GetCalibrationHandlerParams,
  GetLatestRunHandlerParams,
  InventoryValuationReport,
  ItemSize,
  ListAddonCostsParams,
  ListAddonItemsParams,
  ListBranchesParams,
  ListBundleSuggestionsHandlerParams,
  ListBundlesParams,
  ListCategoriesParams,
  ListDecisionsHandlerParams,
  ListDiscountsParams,
  ListMenuCatalogParams,
  ListMenuItemsParams,
  ListMovementsParams,
  ListOrdersParams,
  ListOrgPurchaseOrdersParams,
  ListPriceSuggestionsHandlerParams,
  ListPurchaseOrdersParams,
  ListRemovalScenariosHandlerParams,
  ListRunsHandlerParams,
  ListSkuCostsParams,
  ListTransfersParams,
  ListUsersParams,
  LoginRequest,
  LoginResponse,
  LowStockRow,
  MeResponse,
  MenuEngineeringReport,
  MenuItem,
  MenuItemFull,
  OnboardingStatus,
  OpenShiftRequest,
  OptionalField,
  Order,
  OrderFull,
  Org,
  OrgBranchComparisonParams,
  OrgComparisonReport,
  OrgConsumptionParams,
  OrgIngredient,
  OrgInventorySettings,
  OrgPaymentMethod,
  OrgShrinkageParams,
  OrgWasteReportParams,
  PaginatedBundles,
  PaginatedMenuItems,
  PaginatedOrders,
  Permission,
  PermissionMatrix,
  PersistedRun,
  PreviewIngredient,
  PreviewRecipeRequest,
  PriceSuggestionRecord,
  PromoteBundleBody,
  PublicMenuResponse,
  PublicOrg,
  PurchaseOrder,
  PurchaseOrderFull,
  ReceivePurchaseOrderRequest,
  RecordDecisionBody,
  RemovalScenarioRecord,
  ResolveBranchRequest,
  ResolveBranchResponse,
  RolePermission,
  Shift,
  ShiftPreFill,
  ShiftReportResponse,
  ShiftSummary,
  ShrinkageRow,
  SkuCost,
  Stocktake,
  StocktakeFull,
  Supplier,
  TellerStats,
  TimeseriesPoint,
  UpdateAddonItemRequest,
  UpdateAddonSlotRequest,
  UpdateBranchRequest,
  UpdateBundleRequest,
  UpdateCatalogItemRequest,
  UpdateCategoryRequest,
  UpdateDiscountRequest,
  UpdateInventorySettingsRequest,
  UpdateMenuItemRequest,
  UpdateOptionalFieldRequest,
  UpdateOrgRequest,
  UpdatePaymentMethodRequest,
  UpdateStockRequest,
  UpdateSupplierRequest,
  UpdateTransferRequest,
  UpdateUserRequest,
  UploadImageMultipart,
  UploadLogoMultipart,
  UploadResponse,
  UpsertAddonIngredientRequest,
  UpsertAddonOverrideRequest,
  UpsertDrinkRecipeRequest,
  UpsertItemsRequest,
  UpsertPermissionRequest,
  UpsertRolePermissionRequest,
  UpsertSizeRequest,
  UserBranch,
  UserPublic,
  VarianceReport,
  VoidOrderRequest,
  WasteReportRow
} from './models';

import { customInstance } from '../custom-instance';


type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];



export const listAddonItems = (
    params: ListAddonItemsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonItem[]>(
      {url: `/addon-items`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListAddonItemsQueryKey = (params?: ListAddonItemsParams,) => {
    return [
    `/addon-items`, ...(params ? [params] : [])
    ] as const;
    }


export const getListAddonItemsQueryOptions = <TData = Awaited<ReturnType<typeof listAddonItems>>, TError = ErrorBody>(params: ListAddonItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonItems>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAddonItemsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAddonItems>>> = ({ signal }) => listAddonItems(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAddonItems>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListAddonItemsQueryResult = NonNullable<Awaited<ReturnType<typeof listAddonItems>>>
export type ListAddonItemsQueryError = ErrorBody


export function useListAddonItems<TData = Awaited<ReturnType<typeof listAddonItems>>, TError = ErrorBody>(
 params: ListAddonItemsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonItems>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonItems>>,
          TError,
          Awaited<ReturnType<typeof listAddonItems>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonItems<TData = Awaited<ReturnType<typeof listAddonItems>>, TError = ErrorBody>(
 params: ListAddonItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonItems>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonItems>>,
          TError,
          Awaited<ReturnType<typeof listAddonItems>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonItems<TData = Awaited<ReturnType<typeof listAddonItems>>, TError = ErrorBody>(
 params: ListAddonItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonItems>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListAddonItems<TData = Awaited<ReturnType<typeof listAddonItems>>, TError = ErrorBody>(
 params: ListAddonItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonItems>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListAddonItemsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createAddonItem = (
    createAddonItemRequest: CreateAddonItemRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonItem>(
      {url: `/addon-items`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createAddonItemRequest, signal
    },
      options);
    }



export const getCreateAddonItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAddonItem>>, TError,{data: CreateAddonItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createAddonItem>>, TError,{data: CreateAddonItemRequest}, TContext> => {

const mutationKey = ['createAddonItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createAddonItem>>, {data: CreateAddonItemRequest}> = (props) => {
          const {data} = props ?? {};

          return  createAddonItem(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateAddonItemMutationResult = NonNullable<Awaited<ReturnType<typeof createAddonItem>>>
    export type CreateAddonItemMutationBody = CreateAddonItemRequest
    export type CreateAddonItemMutationError = ErrorBody

    export const useCreateAddonItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAddonItem>>, TError,{data: CreateAddonItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createAddonItem>>,
        TError,
        {data: CreateAddonItemRequest},
        TContext
      > => {
      return useMutation(getCreateAddonItemMutationOptions(options), queryClient);
    }

export const deleteAddonItem = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/addon-items/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteAddonItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonItem>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteAddonItem>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteAddonItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteAddonItem>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteAddonItem(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteAddonItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAddonItem>>>

    export type DeleteAddonItemMutationError = ErrorBody

    export const useDeleteAddonItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonItem>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteAddonItem>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteAddonItemMutationOptions(options), queryClient);
    }

export const updateAddonItem = (
    id: string,
    updateAddonItemRequest: UpdateAddonItemRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonItem>(
      {url: `/addon-items/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateAddonItemRequest, signal
    },
      options);
    }



export const getUpdateAddonItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateAddonItem>>, TError,{id: string;data: UpdateAddonItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateAddonItem>>, TError,{id: string;data: UpdateAddonItemRequest}, TContext> => {

const mutationKey = ['updateAddonItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateAddonItem>>, {id: string;data: UpdateAddonItemRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateAddonItem(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateAddonItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateAddonItem>>>
    export type UpdateAddonItemMutationBody = UpdateAddonItemRequest
    export type UpdateAddonItemMutationError = ErrorBody

    export const useUpdateAddonItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateAddonItem>>, TError,{id: string;data: UpdateAddonItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateAddonItem>>,
        TError,
        {id: string;data: UpdateAddonItemRequest},
        TContext
      > => {
      return useMutation(getUpdateAddonItemMutationOptions(options), queryClient);
    }

export const login = (
    loginRequest: LoginRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<LoginResponse>(
      {url: `/auth/login`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: loginRequest, signal
    },
      options);
    }



export const getLoginMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof login>>, TError,{data: LoginRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof login>>, TError,{data: LoginRequest}, TContext> => {

const mutationKey = ['login'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof login>>, {data: LoginRequest}> = (props) => {
          const {data} = props ?? {};

          return  login(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>
    export type LoginMutationBody = LoginRequest
    export type LoginMutationError = ErrorBody

    export const useLogin = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof login>>, TError,{data: LoginRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof login>>,
        TError,
        {data: LoginRequest},
        TContext
      > => {
      return useMutation(getLoginMutationOptions(options), queryClient);
    }

export const me = (

 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<MeResponse>(
      {url: `/auth/me`, method: 'GET', signal
    },
      options);
    }




export const getMeQueryKey = () => {
    return [
    `/auth/me`
    ] as const;
    }


export const getMeQueryOptions = <TData = Awaited<ReturnType<typeof me>>, TError = ErrorBody>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof me>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getMeQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof me>>> = ({ signal }) => me(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof me>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type MeQueryResult = NonNullable<Awaited<ReturnType<typeof me>>>
export type MeQueryError = ErrorBody


export function useMe<TData = Awaited<ReturnType<typeof me>>, TError = ErrorBody>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof me>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof me>>,
          TError,
          Awaited<ReturnType<typeof me>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useMe<TData = Awaited<ReturnType<typeof me>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof me>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof me>>,
          TError,
          Awaited<ReturnType<typeof me>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useMe<TData = Awaited<ReturnType<typeof me>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof me>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useMe<TData = Awaited<ReturnType<typeof me>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof me>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getMeQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getMyPermissions = (

 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AuthPermissionsResponse>(
      {url: `/auth/permissions`, method: 'GET', signal
    },
      options);
    }




export const getGetMyPermissionsQueryKey = () => {
    return [
    `/auth/permissions`
    ] as const;
    }


export const getGetMyPermissionsQueryOptions = <TData = Awaited<ReturnType<typeof getMyPermissions>>, TError = ErrorBody>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMyPermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetMyPermissionsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getMyPermissions>>> = ({ signal }) => getMyPermissions(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getMyPermissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetMyPermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getMyPermissions>>>
export type GetMyPermissionsQueryError = ErrorBody


export function useGetMyPermissions<TData = Awaited<ReturnType<typeof getMyPermissions>>, TError = ErrorBody>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMyPermissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getMyPermissions>>,
          TError,
          Awaited<ReturnType<typeof getMyPermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetMyPermissions<TData = Awaited<ReturnType<typeof getMyPermissions>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMyPermissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getMyPermissions>>,
          TError,
          Awaited<ReturnType<typeof getMyPermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetMyPermissions<TData = Awaited<ReturnType<typeof getMyPermissions>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMyPermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetMyPermissions<TData = Awaited<ReturnType<typeof getMyPermissions>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMyPermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetMyPermissionsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const resolveBranch = (
    resolveBranchRequest: ResolveBranchRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ResolveBranchResponse>(
      {url: `/auth/resolve-branch`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: resolveBranchRequest, signal
    },
      options);
    }



export const getResolveBranchMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof resolveBranch>>, TError,{data: ResolveBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof resolveBranch>>, TError,{data: ResolveBranchRequest}, TContext> => {

const mutationKey = ['resolveBranch'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof resolveBranch>>, {data: ResolveBranchRequest}> = (props) => {
          const {data} = props ?? {};

          return  resolveBranch(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type ResolveBranchMutationResult = NonNullable<Awaited<ReturnType<typeof resolveBranch>>>
    export type ResolveBranchMutationBody = ResolveBranchRequest
    export type ResolveBranchMutationError = ErrorBody

    export const useResolveBranch = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof resolveBranch>>, TError,{data: ResolveBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof resolveBranch>>,
        TError,
        {data: ResolveBranchRequest},
        TContext
      > => {
      return useMutation(getResolveBranchMutationOptions(options), queryClient);
    }

export const listBranches = (
    params: ListBranchesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Branch[]>(
      {url: `/branches`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListBranchesQueryKey = (params?: ListBranchesParams,) => {
    return [
    `/branches`, ...(params ? [params] : [])
    ] as const;
    }


export const getListBranchesQueryOptions = <TData = Awaited<ReturnType<typeof listBranches>>, TError = ErrorBody>(params: ListBranchesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranches>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListBranchesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listBranches>>> = ({ signal }) => listBranches(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listBranches>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListBranchesQueryResult = NonNullable<Awaited<ReturnType<typeof listBranches>>>
export type ListBranchesQueryError = ErrorBody


export function useListBranches<TData = Awaited<ReturnType<typeof listBranches>>, TError = ErrorBody>(
 params: ListBranchesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranches>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBranches>>,
          TError,
          Awaited<ReturnType<typeof listBranches>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBranches<TData = Awaited<ReturnType<typeof listBranches>>, TError = ErrorBody>(
 params: ListBranchesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranches>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBranches>>,
          TError,
          Awaited<ReturnType<typeof listBranches>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBranches<TData = Awaited<ReturnType<typeof listBranches>>, TError = ErrorBody>(
 params: ListBranchesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranches>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListBranches<TData = Awaited<ReturnType<typeof listBranches>>, TError = ErrorBody>(
 params: ListBranchesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranches>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListBranchesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createBranch = (
    createBranchRequest: CreateBranchRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Branch>(
      {url: `/branches`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createBranchRequest, signal
    },
      options);
    }



export const getCreateBranchMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createBranch>>, TError,{data: CreateBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createBranch>>, TError,{data: CreateBranchRequest}, TContext> => {

const mutationKey = ['createBranch'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createBranch>>, {data: CreateBranchRequest}> = (props) => {
          const {data} = props ?? {};

          return  createBranch(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateBranchMutationResult = NonNullable<Awaited<ReturnType<typeof createBranch>>>
    export type CreateBranchMutationBody = CreateBranchRequest
    export type CreateBranchMutationError = ErrorBody

    export const useCreateBranch = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createBranch>>, TError,{data: CreateBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createBranch>>,
        TError,
        {data: CreateBranchRequest},
        TContext
      > => {
      return useMutation(getCreateBranchMutationOptions(options), queryClient);
    }

export const getBranch = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Branch>(
      {url: `/branches/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetBranchQueryKey = (id: string,) => {
    return [
    `/branches/${id}`
    ] as const;
    }


export const getGetBranchQueryOptions = <TData = Awaited<ReturnType<typeof getBranch>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBranch>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetBranchQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getBranch>>> = ({ signal }) => getBranch(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getBranch>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetBranchQueryResult = NonNullable<Awaited<ReturnType<typeof getBranch>>>
export type GetBranchQueryError = ErrorBody


export function useGetBranch<TData = Awaited<ReturnType<typeof getBranch>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBranch>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getBranch>>,
          TError,
          Awaited<ReturnType<typeof getBranch>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetBranch<TData = Awaited<ReturnType<typeof getBranch>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBranch>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getBranch>>,
          TError,
          Awaited<ReturnType<typeof getBranch>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetBranch<TData = Awaited<ReturnType<typeof getBranch>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBranch>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetBranch<TData = Awaited<ReturnType<typeof getBranch>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBranch>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetBranchQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const updateBranch = (
    id: string,
    updateBranchRequest: UpdateBranchRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Branch>(
      {url: `/branches/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateBranchRequest, signal
    },
      options);
    }



export const getUpdateBranchMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateBranch>>, TError,{id: string;data: UpdateBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateBranch>>, TError,{id: string;data: UpdateBranchRequest}, TContext> => {

const mutationKey = ['updateBranch'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateBranch>>, {id: string;data: UpdateBranchRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateBranch(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateBranchMutationResult = NonNullable<Awaited<ReturnType<typeof updateBranch>>>
    export type UpdateBranchMutationBody = UpdateBranchRequest
    export type UpdateBranchMutationError = ErrorBody

    export const useUpdateBranch = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateBranch>>, TError,{id: string;data: UpdateBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateBranch>>,
        TError,
        {id: string;data: UpdateBranchRequest},
        TContext
      > => {
      return useMutation(getUpdateBranchMutationOptions(options), queryClient);
    }

export const deleteBranch = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/branches/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteBranchMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteBranch>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteBranch>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteBranch'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteBranch>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteBranch(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteBranchMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBranch>>>

    export type DeleteBranchMutationError = ErrorBody

    export const useDeleteBranch = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteBranch>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteBranch>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteBranchMutationOptions(options), queryClient);
    }

export const listBundles = (
    params?: ListBundlesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PaginatedBundles>(
      {url: `/bundles`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListBundlesQueryKey = (params?: ListBundlesParams,) => {
    return [
    `/bundles`, ...(params ? [params] : [])
    ] as const;
    }


export const getListBundlesQueryOptions = <TData = Awaited<ReturnType<typeof listBundles>>, TError = ErrorBody>(params?: ListBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundles>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListBundlesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listBundles>>> = ({ signal }) => listBundles(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listBundles>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListBundlesQueryResult = NonNullable<Awaited<ReturnType<typeof listBundles>>>
export type ListBundlesQueryError = ErrorBody


export function useListBundles<TData = Awaited<ReturnType<typeof listBundles>>, TError = ErrorBody>(
 params: undefined |  ListBundlesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundles>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBundles>>,
          TError,
          Awaited<ReturnType<typeof listBundles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBundles<TData = Awaited<ReturnType<typeof listBundles>>, TError = ErrorBody>(
 params?: ListBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundles>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBundles>>,
          TError,
          Awaited<ReturnType<typeof listBundles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBundles<TData = Awaited<ReturnType<typeof listBundles>>, TError = ErrorBody>(
 params?: ListBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundles>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListBundles<TData = Awaited<ReturnType<typeof listBundles>>, TError = ErrorBody>(
 params?: ListBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundles>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListBundlesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createBundle = (
    createBundleRequest: CreateBundleRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleWithComponents>(
      {url: `/bundles`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createBundleRequest, signal
    },
      options);
    }



export const getCreateBundleMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createBundle>>, TError,{data: CreateBundleRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createBundle>>, TError,{data: CreateBundleRequest}, TContext> => {

const mutationKey = ['createBundle'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createBundle>>, {data: CreateBundleRequest}> = (props) => {
          const {data} = props ?? {};

          return  createBundle(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateBundleMutationResult = NonNullable<Awaited<ReturnType<typeof createBundle>>>
    export type CreateBundleMutationBody = CreateBundleRequest
    export type CreateBundleMutationError = ErrorBody

    export const useCreateBundle = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createBundle>>, TError,{data: CreateBundleRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createBundle>>,
        TError,
        {data: CreateBundleRequest},
        TContext
      > => {
      return useMutation(getCreateBundleMutationOptions(options), queryClient);
    }

export const availableBundles = (
    params: AvailableBundlesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleWithComponents[]>(
      {url: `/bundles/available`, method: 'GET',
        params, signal
    },
      options);
    }




export const getAvailableBundlesQueryKey = (params?: AvailableBundlesParams,) => {
    return [
    `/bundles/available`, ...(params ? [params] : [])
    ] as const;
    }


export const getAvailableBundlesQueryOptions = <TData = Awaited<ReturnType<typeof availableBundles>>, TError = ErrorBody>(params: AvailableBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof availableBundles>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getAvailableBundlesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof availableBundles>>> = ({ signal }) => availableBundles(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof availableBundles>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type AvailableBundlesQueryResult = NonNullable<Awaited<ReturnType<typeof availableBundles>>>
export type AvailableBundlesQueryError = ErrorBody


export function useAvailableBundles<TData = Awaited<ReturnType<typeof availableBundles>>, TError = ErrorBody>(
 params: AvailableBundlesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof availableBundles>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof availableBundles>>,
          TError,
          Awaited<ReturnType<typeof availableBundles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAvailableBundles<TData = Awaited<ReturnType<typeof availableBundles>>, TError = ErrorBody>(
 params: AvailableBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof availableBundles>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof availableBundles>>,
          TError,
          Awaited<ReturnType<typeof availableBundles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAvailableBundles<TData = Awaited<ReturnType<typeof availableBundles>>, TError = ErrorBody>(
 params: AvailableBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof availableBundles>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useAvailableBundles<TData = Awaited<ReturnType<typeof availableBundles>>, TError = ErrorBody>(
 params: AvailableBundlesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof availableBundles>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getAvailableBundlesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getBundle = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleWithComponents>(
      {url: `/bundles/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetBundleQueryKey = (id: string,) => {
    return [
    `/bundles/${id}`
    ] as const;
    }


export const getGetBundleQueryOptions = <TData = Awaited<ReturnType<typeof getBundle>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundle>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetBundleQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getBundle>>> = ({ signal }) => getBundle(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getBundle>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetBundleQueryResult = NonNullable<Awaited<ReturnType<typeof getBundle>>>
export type GetBundleQueryError = ErrorBody


export function useGetBundle<TData = Awaited<ReturnType<typeof getBundle>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundle>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getBundle>>,
          TError,
          Awaited<ReturnType<typeof getBundle>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetBundle<TData = Awaited<ReturnType<typeof getBundle>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundle>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getBundle>>,
          TError,
          Awaited<ReturnType<typeof getBundle>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetBundle<TData = Awaited<ReturnType<typeof getBundle>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundle>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetBundle<TData = Awaited<ReturnType<typeof getBundle>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundle>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetBundleQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const deleteBundle = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/bundles/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteBundleMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteBundle>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteBundle>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteBundle'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteBundle>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteBundle(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteBundleMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBundle>>>

    export type DeleteBundleMutationError = ErrorBody

    export const useDeleteBundle = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteBundle>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteBundle>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteBundleMutationOptions(options), queryClient);
    }

export const updateBundle = (
    id: string,
    updateBundleRequest: UpdateBundleRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleWithComponents>(
      {url: `/bundles/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateBundleRequest, signal
    },
      options);
    }



export const getUpdateBundleMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateBundle>>, TError,{id: string;data: UpdateBundleRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateBundle>>, TError,{id: string;data: UpdateBundleRequest}, TContext> => {

const mutationKey = ['updateBundle'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateBundle>>, {id: string;data: UpdateBundleRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateBundle(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateBundleMutationResult = NonNullable<Awaited<ReturnType<typeof updateBundle>>>
    export type UpdateBundleMutationBody = UpdateBundleRequest
    export type UpdateBundleMutationError = ErrorBody

    export const useUpdateBundle = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateBundle>>, TError,{id: string;data: UpdateBundleRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateBundle>>,
        TError,
        {id: string;data: UpdateBundleRequest},
        TContext
      > => {
      return useMutation(getUpdateBundleMutationOptions(options), queryClient);
    }

export const activateBundle = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleWithComponents>(
      {url: `/bundles/${id}/activate`, method: 'POST', signal
    },
      options);
    }



export const getActivateBundleMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof activateBundle>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof activateBundle>>, TError,{id: string}, TContext> => {

const mutationKey = ['activateBundle'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof activateBundle>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  activateBundle(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type ActivateBundleMutationResult = NonNullable<Awaited<ReturnType<typeof activateBundle>>>

    export type ActivateBundleMutationError = ErrorBody

    export const useActivateBundle = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof activateBundle>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof activateBundle>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getActivateBundleMutationOptions(options), queryClient);
    }

export const archiveBundle = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleWithComponents>(
      {url: `/bundles/${id}/archive`, method: 'POST', signal
    },
      options);
    }



export const getArchiveBundleMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof archiveBundle>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof archiveBundle>>, TError,{id: string}, TContext> => {

const mutationKey = ['archiveBundle'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof archiveBundle>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  archiveBundle(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type ArchiveBundleMutationResult = NonNullable<Awaited<ReturnType<typeof archiveBundle>>>

    export type ArchiveBundleMutationError = ErrorBody

    export const useArchiveBundle = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof archiveBundle>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof archiveBundle>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getArchiveBundleMutationOptions(options), queryClient);
    }

export const bundlePerformance = (
    id: string,
    params?: BundlePerformanceParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundlePerformanceResponse>(
      {url: `/bundles/${id}/performance`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBundlePerformanceQueryKey = (id: string,
    params?: BundlePerformanceParams,) => {
    return [
    `/bundles/${id}/performance`, ...(params ? [params] : [])
    ] as const;
    }


export const getBundlePerformanceQueryOptions = <TData = Awaited<ReturnType<typeof bundlePerformance>>, TError = ErrorBody>(id: string,
    params?: BundlePerformanceParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof bundlePerformance>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBundlePerformanceQueryKey(id,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof bundlePerformance>>> = ({ signal }) => bundlePerformance(id,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof bundlePerformance>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BundlePerformanceQueryResult = NonNullable<Awaited<ReturnType<typeof bundlePerformance>>>
export type BundlePerformanceQueryError = ErrorBody


export function useBundlePerformance<TData = Awaited<ReturnType<typeof bundlePerformance>>, TError = ErrorBody>(
 id: string,
    params: undefined |  BundlePerformanceParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof bundlePerformance>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof bundlePerformance>>,
          TError,
          Awaited<ReturnType<typeof bundlePerformance>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBundlePerformance<TData = Awaited<ReturnType<typeof bundlePerformance>>, TError = ErrorBody>(
 id: string,
    params?: BundlePerformanceParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof bundlePerformance>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof bundlePerformance>>,
          TError,
          Awaited<ReturnType<typeof bundlePerformance>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBundlePerformance<TData = Awaited<ReturnType<typeof bundlePerformance>>, TError = ErrorBody>(
 id: string,
    params?: BundlePerformanceParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof bundlePerformance>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBundlePerformance<TData = Awaited<ReturnType<typeof bundlePerformance>>, TError = ErrorBody>(
 id: string,
    params?: BundlePerformanceParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof bundlePerformance>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBundlePerformanceQueryOptions(id,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listCategories = (
    params: ListCategoriesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Category[]>(
      {url: `/categories`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListCategoriesQueryKey = (params?: ListCategoriesParams,) => {
    return [
    `/categories`, ...(params ? [params] : [])
    ] as const;
    }


export const getListCategoriesQueryOptions = <TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorBody>(params: ListCategoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListCategoriesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listCategories>>> = ({ signal }) => listCategories(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCategories>>>
export type ListCategoriesQueryError = ErrorBody


export function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorBody>(
 params: ListCategoriesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listCategories>>,
          TError,
          Awaited<ReturnType<typeof listCategories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorBody>(
 params: ListCategoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listCategories>>,
          TError,
          Awaited<ReturnType<typeof listCategories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorBody>(
 params: ListCategoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorBody>(
 params: ListCategoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListCategoriesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createCategory = (
    createCategoryRequest: CreateCategoryRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Category>(
      {url: `/categories`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createCategoryRequest, signal
    },
      options);
    }



export const getCreateCategoryMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError,{data: CreateCategoryRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError,{data: CreateCategoryRequest}, TContext> => {

const mutationKey = ['createCategory'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createCategory>>, {data: CreateCategoryRequest}> = (props) => {
          const {data} = props ?? {};

          return  createCategory(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof createCategory>>>
    export type CreateCategoryMutationBody = CreateCategoryRequest
    export type CreateCategoryMutationError = ErrorBody

    export const useCreateCategory = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError,{data: CreateCategoryRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createCategory>>,
        TError,
        {data: CreateCategoryRequest},
        TContext
      > => {
      return useMutation(getCreateCategoryMutationOptions(options), queryClient);
    }

export const deleteCategory = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/categories/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteCategoryMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteCategory'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteCategory>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteCategory(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCategory>>>

    export type DeleteCategoryMutationError = ErrorBody

    export const useDeleteCategory = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteCategory>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteCategoryMutationOptions(options), queryClient);
    }

export const updateCategory = (
    id: string,
    updateCategoryRequest: UpdateCategoryRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Category>(
      {url: `/categories/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateCategoryRequest, signal
    },
      options);
    }



export const getUpdateCategoryMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError,{id: string;data: UpdateCategoryRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError,{id: string;data: UpdateCategoryRequest}, TContext> => {

const mutationKey = ['updateCategory'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateCategory>>, {id: string;data: UpdateCategoryRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateCategory(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof updateCategory>>>
    export type UpdateCategoryMutationBody = UpdateCategoryRequest
    export type UpdateCategoryMutationError = ErrorBody

    export const useUpdateCategory = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError,{id: string;data: UpdateCategoryRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateCategory>>,
        TError,
        {id: string;data: UpdateCategoryRequest},
        TContext
      > => {
      return useMutation(getUpdateCategoryMutationOptions(options), queryClient);
    }

export const listAddonCosts = (
    params: ListAddonCostsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonCost[]>(
      {url: `/costing/addon-items`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListAddonCostsQueryKey = (params?: ListAddonCostsParams,) => {
    return [
    `/costing/addon-items`, ...(params ? [params] : [])
    ] as const;
    }


export const getListAddonCostsQueryOptions = <TData = Awaited<ReturnType<typeof listAddonCosts>>, TError = ErrorBody>(params: ListAddonCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonCosts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAddonCostsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAddonCosts>>> = ({ signal }) => listAddonCosts(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAddonCosts>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListAddonCostsQueryResult = NonNullable<Awaited<ReturnType<typeof listAddonCosts>>>
export type ListAddonCostsQueryError = ErrorBody


export function useListAddonCosts<TData = Awaited<ReturnType<typeof listAddonCosts>>, TError = ErrorBody>(
 params: ListAddonCostsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonCosts>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonCosts>>,
          TError,
          Awaited<ReturnType<typeof listAddonCosts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonCosts<TData = Awaited<ReturnType<typeof listAddonCosts>>, TError = ErrorBody>(
 params: ListAddonCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonCosts>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonCosts>>,
          TError,
          Awaited<ReturnType<typeof listAddonCosts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonCosts<TData = Awaited<ReturnType<typeof listAddonCosts>>, TError = ErrorBody>(
 params: ListAddonCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonCosts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListAddonCosts<TData = Awaited<ReturnType<typeof listAddonCosts>>, TError = ErrorBody>(
 params: ListAddonCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonCosts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListAddonCostsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listMenuCatalog = (
    params: ListMenuCatalogParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PaginatedMenuItems>(
      {url: `/costing/catalog`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListMenuCatalogQueryKey = (params?: ListMenuCatalogParams,) => {
    return [
    `/costing/catalog`, ...(params ? [params] : [])
    ] as const;
    }


export const getListMenuCatalogQueryOptions = <TData = Awaited<ReturnType<typeof listMenuCatalog>>, TError = ErrorBody>(params: ListMenuCatalogParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuCatalog>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMenuCatalogQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMenuCatalog>>> = ({ signal }) => listMenuCatalog(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMenuCatalog>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListMenuCatalogQueryResult = NonNullable<Awaited<ReturnType<typeof listMenuCatalog>>>
export type ListMenuCatalogQueryError = ErrorBody


export function useListMenuCatalog<TData = Awaited<ReturnType<typeof listMenuCatalog>>, TError = ErrorBody>(
 params: ListMenuCatalogParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuCatalog>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listMenuCatalog>>,
          TError,
          Awaited<ReturnType<typeof listMenuCatalog>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListMenuCatalog<TData = Awaited<ReturnType<typeof listMenuCatalog>>, TError = ErrorBody>(
 params: ListMenuCatalogParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuCatalog>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listMenuCatalog>>,
          TError,
          Awaited<ReturnType<typeof listMenuCatalog>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListMenuCatalog<TData = Awaited<ReturnType<typeof listMenuCatalog>>, TError = ErrorBody>(
 params: ListMenuCatalogParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuCatalog>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListMenuCatalog<TData = Awaited<ReturnType<typeof listMenuCatalog>>, TError = ErrorBody>(
 params: ListMenuCatalogParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuCatalog>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListMenuCatalogQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listSkuCosts = (
    params: ListSkuCostsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<SkuCost[]>(
      {url: `/costing/menu-items`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListSkuCostsQueryKey = (params?: ListSkuCostsParams,) => {
    return [
    `/costing/menu-items`, ...(params ? [params] : [])
    ] as const;
    }


export const getListSkuCostsQueryOptions = <TData = Awaited<ReturnType<typeof listSkuCosts>>, TError = ErrorBody>(params: ListSkuCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSkuCosts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListSkuCostsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listSkuCosts>>> = ({ signal }) => listSkuCosts(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listSkuCosts>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListSkuCostsQueryResult = NonNullable<Awaited<ReturnType<typeof listSkuCosts>>>
export type ListSkuCostsQueryError = ErrorBody


export function useListSkuCosts<TData = Awaited<ReturnType<typeof listSkuCosts>>, TError = ErrorBody>(
 params: ListSkuCostsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSkuCosts>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSkuCosts>>,
          TError,
          Awaited<ReturnType<typeof listSkuCosts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSkuCosts<TData = Awaited<ReturnType<typeof listSkuCosts>>, TError = ErrorBody>(
 params: ListSkuCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSkuCosts>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSkuCosts>>,
          TError,
          Awaited<ReturnType<typeof listSkuCosts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSkuCosts<TData = Awaited<ReturnType<typeof listSkuCosts>>, TError = ErrorBody>(
 params: ListSkuCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSkuCosts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListSkuCosts<TData = Awaited<ReturnType<typeof listSkuCosts>>, TError = ErrorBody>(
 params: ListSkuCostsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSkuCosts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListSkuCostsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listDiscounts = (
    params: ListDiscountsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Discount[]>(
      {url: `/discounts`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListDiscountsQueryKey = (params?: ListDiscountsParams,) => {
    return [
    `/discounts`, ...(params ? [params] : [])
    ] as const;
    }


export const getListDiscountsQueryOptions = <TData = Awaited<ReturnType<typeof listDiscounts>>, TError = ErrorBody>(params: ListDiscountsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDiscounts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListDiscountsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listDiscounts>>> = ({ signal }) => listDiscounts(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listDiscounts>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListDiscountsQueryResult = NonNullable<Awaited<ReturnType<typeof listDiscounts>>>
export type ListDiscountsQueryError = ErrorBody


export function useListDiscounts<TData = Awaited<ReturnType<typeof listDiscounts>>, TError = ErrorBody>(
 params: ListDiscountsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDiscounts>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listDiscounts>>,
          TError,
          Awaited<ReturnType<typeof listDiscounts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListDiscounts<TData = Awaited<ReturnType<typeof listDiscounts>>, TError = ErrorBody>(
 params: ListDiscountsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDiscounts>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listDiscounts>>,
          TError,
          Awaited<ReturnType<typeof listDiscounts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListDiscounts<TData = Awaited<ReturnType<typeof listDiscounts>>, TError = ErrorBody>(
 params: ListDiscountsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDiscounts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListDiscounts<TData = Awaited<ReturnType<typeof listDiscounts>>, TError = ErrorBody>(
 params: ListDiscountsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDiscounts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListDiscountsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createDiscount = (
    createDiscountRequest: CreateDiscountRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Discount>(
      {url: `/discounts`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createDiscountRequest, signal
    },
      options);
    }



export const getCreateDiscountMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createDiscount>>, TError,{data: CreateDiscountRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createDiscount>>, TError,{data: CreateDiscountRequest}, TContext> => {

const mutationKey = ['createDiscount'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createDiscount>>, {data: CreateDiscountRequest}> = (props) => {
          const {data} = props ?? {};

          return  createDiscount(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateDiscountMutationResult = NonNullable<Awaited<ReturnType<typeof createDiscount>>>
    export type CreateDiscountMutationBody = CreateDiscountRequest
    export type CreateDiscountMutationError = ErrorBody

    export const useCreateDiscount = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createDiscount>>, TError,{data: CreateDiscountRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createDiscount>>,
        TError,
        {data: CreateDiscountRequest},
        TContext
      > => {
      return useMutation(getCreateDiscountMutationOptions(options), queryClient);
    }

export const deleteDiscount = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/discounts/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteDiscountMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteDiscount>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteDiscount>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteDiscount'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteDiscount>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteDiscount(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteDiscountMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDiscount>>>

    export type DeleteDiscountMutationError = ErrorBody

    export const useDeleteDiscount = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteDiscount>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteDiscount>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteDiscountMutationOptions(options), queryClient);
    }

export const updateDiscount = (
    id: string,
    updateDiscountRequest: UpdateDiscountRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Discount>(
      {url: `/discounts/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateDiscountRequest, signal
    },
      options);
    }



export const getUpdateDiscountMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateDiscount>>, TError,{id: string;data: UpdateDiscountRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateDiscount>>, TError,{id: string;data: UpdateDiscountRequest}, TContext> => {

const mutationKey = ['updateDiscount'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateDiscount>>, {id: string;data: UpdateDiscountRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateDiscount(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateDiscountMutationResult = NonNullable<Awaited<ReturnType<typeof updateDiscount>>>
    export type UpdateDiscountMutationBody = UpdateDiscountRequest
    export type UpdateDiscountMutationError = ErrorBody

    export const useUpdateDiscount = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateDiscount>>, TError,{id: string;data: UpdateDiscountRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateDiscount>>,
        TError,
        {id: string;data: UpdateDiscountRequest},
        TContext
      > => {
      return useMutation(getUpdateDiscountMutationOptions(options), queryClient);
    }

export const listAdjustments = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryAdjustment[]>(
      {url: `/inventory/branches/${branchId}/adjustments`, method: 'GET', signal
    },
      options);
    }




export const getListAdjustmentsQueryKey = (branchId: string,) => {
    return [
    `/inventory/branches/${branchId}/adjustments`
    ] as const;
    }


export const getListAdjustmentsQueryOptions = <TData = Awaited<ReturnType<typeof listAdjustments>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdjustments>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAdjustmentsQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAdjustments>>> = ({ signal }) => listAdjustments(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAdjustments>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListAdjustmentsQueryResult = NonNullable<Awaited<ReturnType<typeof listAdjustments>>>
export type ListAdjustmentsQueryError = ErrorBody


export function useListAdjustments<TData = Awaited<ReturnType<typeof listAdjustments>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdjustments>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAdjustments>>,
          TError,
          Awaited<ReturnType<typeof listAdjustments>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAdjustments<TData = Awaited<ReturnType<typeof listAdjustments>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdjustments>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAdjustments>>,
          TError,
          Awaited<ReturnType<typeof listAdjustments>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAdjustments<TData = Awaited<ReturnType<typeof listAdjustments>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdjustments>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListAdjustments<TData = Awaited<ReturnType<typeof listAdjustments>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdjustments>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListAdjustmentsQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createAdjustment = (
    branchId: string,
    createAdjustmentRequest: CreateAdjustmentRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryAdjustment>(
      {url: `/inventory/branches/${branchId}/adjustments`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createAdjustmentRequest, signal
    },
      options);
    }



export const getCreateAdjustmentMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAdjustment>>, TError,{branchId: string;data: CreateAdjustmentRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createAdjustment>>, TError,{branchId: string;data: CreateAdjustmentRequest}, TContext> => {

const mutationKey = ['createAdjustment'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createAdjustment>>, {branchId: string;data: CreateAdjustmentRequest}> = (props) => {
          const {branchId,data} = props ?? {};

          return  createAdjustment(branchId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateAdjustmentMutationResult = NonNullable<Awaited<ReturnType<typeof createAdjustment>>>
    export type CreateAdjustmentMutationBody = CreateAdjustmentRequest
    export type CreateAdjustmentMutationError = ErrorBody

    export const useCreateAdjustment = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAdjustment>>, TError,{branchId: string;data: CreateAdjustmentRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createAdjustment>>,
        TError,
        {branchId: string;data: CreateAdjustmentRequest},
        TContext
      > => {
      return useMutation(getCreateAdjustmentMutationOptions(options), queryClient);
    }

export const listMovements = (
    branchId: string,
    params?: ListMovementsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryMovement[]>(
      {url: `/inventory/branches/${branchId}/movements`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListMovementsQueryKey = (branchId: string,
    params?: ListMovementsParams,) => {
    return [
    `/inventory/branches/${branchId}/movements`, ...(params ? [params] : [])
    ] as const;
    }


export const getListMovementsQueryOptions = <TData = Awaited<ReturnType<typeof listMovements>>, TError = ErrorBody>(branchId: string,
    params?: ListMovementsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMovements>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMovementsQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMovements>>> = ({ signal }) => listMovements(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMovements>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListMovementsQueryResult = NonNullable<Awaited<ReturnType<typeof listMovements>>>
export type ListMovementsQueryError = ErrorBody


export function useListMovements<TData = Awaited<ReturnType<typeof listMovements>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  ListMovementsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMovements>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listMovements>>,
          TError,
          Awaited<ReturnType<typeof listMovements>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListMovements<TData = Awaited<ReturnType<typeof listMovements>>, TError = ErrorBody>(
 branchId: string,
    params?: ListMovementsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMovements>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listMovements>>,
          TError,
          Awaited<ReturnType<typeof listMovements>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListMovements<TData = Awaited<ReturnType<typeof listMovements>>, TError = ErrorBody>(
 branchId: string,
    params?: ListMovementsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMovements>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListMovements<TData = Awaited<ReturnType<typeof listMovements>>, TError = ErrorBody>(
 branchId: string,
    params?: ListMovementsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMovements>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListMovementsQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listBranchStock = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryItem[]>(
      {url: `/inventory/branches/${branchId}/stock`, method: 'GET', signal
    },
      options);
    }




export const getListBranchStockQueryKey = (branchId: string,) => {
    return [
    `/inventory/branches/${branchId}/stock`
    ] as const;
    }


export const getListBranchStockQueryOptions = <TData = Awaited<ReturnType<typeof listBranchStock>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranchStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListBranchStockQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listBranchStock>>> = ({ signal }) => listBranchStock(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listBranchStock>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListBranchStockQueryResult = NonNullable<Awaited<ReturnType<typeof listBranchStock>>>
export type ListBranchStockQueryError = ErrorBody


export function useListBranchStock<TData = Awaited<ReturnType<typeof listBranchStock>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranchStock>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBranchStock>>,
          TError,
          Awaited<ReturnType<typeof listBranchStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBranchStock<TData = Awaited<ReturnType<typeof listBranchStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranchStock>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBranchStock>>,
          TError,
          Awaited<ReturnType<typeof listBranchStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBranchStock<TData = Awaited<ReturnType<typeof listBranchStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranchStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListBranchStock<TData = Awaited<ReturnType<typeof listBranchStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBranchStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListBranchStockQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const addToBranchStock = (
    branchId: string,
    addToStockRequest: AddToStockRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryItem>(
      {url: `/inventory/branches/${branchId}/stock`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: addToStockRequest, signal
    },
      options);
    }



export const getAddToBranchStockMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof addToBranchStock>>, TError,{branchId: string;data: AddToStockRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof addToBranchStock>>, TError,{branchId: string;data: AddToStockRequest}, TContext> => {

const mutationKey = ['addToBranchStock'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof addToBranchStock>>, {branchId: string;data: AddToStockRequest}> = (props) => {
          const {branchId,data} = props ?? {};

          return  addToBranchStock(branchId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type AddToBranchStockMutationResult = NonNullable<Awaited<ReturnType<typeof addToBranchStock>>>
    export type AddToBranchStockMutationBody = AddToStockRequest
    export type AddToBranchStockMutationError = ErrorBody

    export const useAddToBranchStock = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof addToBranchStock>>, TError,{branchId: string;data: AddToStockRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof addToBranchStock>>,
        TError,
        {branchId: string;data: AddToStockRequest},
        TContext
      > => {
      return useMutation(getAddToBranchStockMutationOptions(options), queryClient);
    }

export const removeFromBranchStock = (
    branchId: string,
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/inventory/branches/${branchId}/stock/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getRemoveFromBranchStockMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof removeFromBranchStock>>, TError,{branchId: string;id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof removeFromBranchStock>>, TError,{branchId: string;id: string}, TContext> => {

const mutationKey = ['removeFromBranchStock'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof removeFromBranchStock>>, {branchId: string;id: string}> = (props) => {
          const {branchId,id} = props ?? {};

          return  removeFromBranchStock(branchId,id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type RemoveFromBranchStockMutationResult = NonNullable<Awaited<ReturnType<typeof removeFromBranchStock>>>

    export type RemoveFromBranchStockMutationError = ErrorBody

    export const useRemoveFromBranchStock = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof removeFromBranchStock>>, TError,{branchId: string;id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof removeFromBranchStock>>,
        TError,
        {branchId: string;id: string},
        TContext
      > => {
      return useMutation(getRemoveFromBranchStockMutationOptions(options), queryClient);
    }

export const updateBranchStock = (
    branchId: string,
    id: string,
    updateStockRequest: UpdateStockRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryItem>(
      {url: `/inventory/branches/${branchId}/stock/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateStockRequest, signal
    },
      options);
    }



export const getUpdateBranchStockMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateBranchStock>>, TError,{branchId: string;id: string;data: UpdateStockRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateBranchStock>>, TError,{branchId: string;id: string;data: UpdateStockRequest}, TContext> => {

const mutationKey = ['updateBranchStock'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateBranchStock>>, {branchId: string;id: string;data: UpdateStockRequest}> = (props) => {
          const {branchId,id,data} = props ?? {};

          return  updateBranchStock(branchId,id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateBranchStockMutationResult = NonNullable<Awaited<ReturnType<typeof updateBranchStock>>>
    export type UpdateBranchStockMutationBody = UpdateStockRequest
    export type UpdateBranchStockMutationError = ErrorBody

    export const useUpdateBranchStock = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateBranchStock>>, TError,{branchId: string;id: string;data: UpdateStockRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateBranchStock>>,
        TError,
        {branchId: string;id: string;data: UpdateStockRequest},
        TContext
      > => {
      return useMutation(getUpdateBranchStockMutationOptions(options), queryClient);
    }

export const listTransfers = (
    branchId: string,
    params?: ListTransfersParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryTransfer[]>(
      {url: `/inventory/branches/${branchId}/transfers`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListTransfersQueryKey = (branchId: string,
    params?: ListTransfersParams,) => {
    return [
    `/inventory/branches/${branchId}/transfers`, ...(params ? [params] : [])
    ] as const;
    }


export const getListTransfersQueryOptions = <TData = Awaited<ReturnType<typeof listTransfers>>, TError = ErrorBody>(branchId: string,
    params?: ListTransfersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listTransfers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListTransfersQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listTransfers>>> = ({ signal }) => listTransfers(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listTransfers>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListTransfersQueryResult = NonNullable<Awaited<ReturnType<typeof listTransfers>>>
export type ListTransfersQueryError = ErrorBody


export function useListTransfers<TData = Awaited<ReturnType<typeof listTransfers>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  ListTransfersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listTransfers>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listTransfers>>,
          TError,
          Awaited<ReturnType<typeof listTransfers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListTransfers<TData = Awaited<ReturnType<typeof listTransfers>>, TError = ErrorBody>(
 branchId: string,
    params?: ListTransfersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listTransfers>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listTransfers>>,
          TError,
          Awaited<ReturnType<typeof listTransfers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListTransfers<TData = Awaited<ReturnType<typeof listTransfers>>, TError = ErrorBody>(
 branchId: string,
    params?: ListTransfersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listTransfers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListTransfers<TData = Awaited<ReturnType<typeof listTransfers>>, TError = ErrorBody>(
 branchId: string,
    params?: ListTransfersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listTransfers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListTransfersQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listWaste = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryMovement[]>(
      {url: `/inventory/branches/${branchId}/waste`, method: 'GET', signal
    },
      options);
    }




export const getListWasteQueryKey = (branchId: string,) => {
    return [
    `/inventory/branches/${branchId}/waste`
    ] as const;
    }


export const getListWasteQueryOptions = <TData = Awaited<ReturnType<typeof listWaste>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listWaste>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListWasteQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listWaste>>> = ({ signal }) => listWaste(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listWaste>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListWasteQueryResult = NonNullable<Awaited<ReturnType<typeof listWaste>>>
export type ListWasteQueryError = ErrorBody


export function useListWaste<TData = Awaited<ReturnType<typeof listWaste>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listWaste>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listWaste>>,
          TError,
          Awaited<ReturnType<typeof listWaste>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListWaste<TData = Awaited<ReturnType<typeof listWaste>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listWaste>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listWaste>>,
          TError,
          Awaited<ReturnType<typeof listWaste>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListWaste<TData = Awaited<ReturnType<typeof listWaste>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listWaste>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListWaste<TData = Awaited<ReturnType<typeof listWaste>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listWaste>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListWasteQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createWaste = (
    branchId: string,
    createWasteRequest: CreateWasteRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryMovement>(
      {url: `/inventory/branches/${branchId}/waste`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createWasteRequest, signal
    },
      options);
    }



export const getCreateWasteMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createWaste>>, TError,{branchId: string;data: CreateWasteRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createWaste>>, TError,{branchId: string;data: CreateWasteRequest}, TContext> => {

const mutationKey = ['createWaste'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createWaste>>, {branchId: string;data: CreateWasteRequest}> = (props) => {
          const {branchId,data} = props ?? {};

          return  createWaste(branchId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateWasteMutationResult = NonNullable<Awaited<ReturnType<typeof createWaste>>>
    export type CreateWasteMutationBody = CreateWasteRequest
    export type CreateWasteMutationError = ErrorBody

    export const useCreateWaste = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createWaste>>, TError,{branchId: string;data: CreateWasteRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createWaste>>,
        TError,
        {branchId: string;data: CreateWasteRequest},
        TContext
      > => {
      return useMutation(getCreateWasteMutationOptions(options), queryClient);
    }

export const listCatalog = (
    orgId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgIngredient[]>(
      {url: `/inventory/orgs/${orgId}/catalog`, method: 'GET', signal
    },
      options);
    }




export const getListCatalogQueryKey = (orgId: string,) => {
    return [
    `/inventory/orgs/${orgId}/catalog`
    ] as const;
    }


export const getListCatalogQueryOptions = <TData = Awaited<ReturnType<typeof listCatalog>>, TError = ErrorBody>(orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCatalog>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListCatalogQueryKey(orgId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listCatalog>>> = ({ signal }) => listCatalog(orgId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listCatalog>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListCatalogQueryResult = NonNullable<Awaited<ReturnType<typeof listCatalog>>>
export type ListCatalogQueryError = ErrorBody


export function useListCatalog<TData = Awaited<ReturnType<typeof listCatalog>>, TError = ErrorBody>(
 orgId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCatalog>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listCatalog>>,
          TError,
          Awaited<ReturnType<typeof listCatalog>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListCatalog<TData = Awaited<ReturnType<typeof listCatalog>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCatalog>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listCatalog>>,
          TError,
          Awaited<ReturnType<typeof listCatalog>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListCatalog<TData = Awaited<ReturnType<typeof listCatalog>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCatalog>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListCatalog<TData = Awaited<ReturnType<typeof listCatalog>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCatalog>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListCatalogQueryOptions(orgId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createCatalogItem = (
    orgId: string,
    createCatalogItemRequest: CreateCatalogItemRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgIngredient>(
      {url: `/inventory/orgs/${orgId}/catalog`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createCatalogItemRequest, signal
    },
      options);
    }



export const getCreateCatalogItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createCatalogItem>>, TError,{orgId: string;data: CreateCatalogItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createCatalogItem>>, TError,{orgId: string;data: CreateCatalogItemRequest}, TContext> => {

const mutationKey = ['createCatalogItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createCatalogItem>>, {orgId: string;data: CreateCatalogItemRequest}> = (props) => {
          const {orgId,data} = props ?? {};

          return  createCatalogItem(orgId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateCatalogItemMutationResult = NonNullable<Awaited<ReturnType<typeof createCatalogItem>>>
    export type CreateCatalogItemMutationBody = CreateCatalogItemRequest
    export type CreateCatalogItemMutationError = ErrorBody

    export const useCreateCatalogItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createCatalogItem>>, TError,{orgId: string;data: CreateCatalogItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createCatalogItem>>,
        TError,
        {orgId: string;data: CreateCatalogItemRequest},
        TContext
      > => {
      return useMutation(getCreateCatalogItemMutationOptions(options), queryClient);
    }

export const deleteCatalogItem = (
    orgId: string,
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/inventory/orgs/${orgId}/catalog/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteCatalogItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteCatalogItem>>, TError,{orgId: string;id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteCatalogItem>>, TError,{orgId: string;id: string}, TContext> => {

const mutationKey = ['deleteCatalogItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteCatalogItem>>, {orgId: string;id: string}> = (props) => {
          const {orgId,id} = props ?? {};

          return  deleteCatalogItem(orgId,id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteCatalogItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCatalogItem>>>

    export type DeleteCatalogItemMutationError = ErrorBody

    export const useDeleteCatalogItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteCatalogItem>>, TError,{orgId: string;id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteCatalogItem>>,
        TError,
        {orgId: string;id: string},
        TContext
      > => {
      return useMutation(getDeleteCatalogItemMutationOptions(options), queryClient);
    }

export const updateCatalogItem = (
    orgId: string,
    id: string,
    updateCatalogItemRequest: UpdateCatalogItemRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgIngredient>(
      {url: `/inventory/orgs/${orgId}/catalog/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateCatalogItemRequest, signal
    },
      options);
    }



export const getUpdateCatalogItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateCatalogItem>>, TError,{orgId: string;id: string;data: UpdateCatalogItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateCatalogItem>>, TError,{orgId: string;id: string;data: UpdateCatalogItemRequest}, TContext> => {

const mutationKey = ['updateCatalogItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateCatalogItem>>, {orgId: string;id: string;data: UpdateCatalogItemRequest}> = (props) => {
          const {orgId,id,data} = props ?? {};

          return  updateCatalogItem(orgId,id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateCatalogItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateCatalogItem>>>
    export type UpdateCatalogItemMutationBody = UpdateCatalogItemRequest
    export type UpdateCatalogItemMutationError = ErrorBody

    export const useUpdateCatalogItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateCatalogItem>>, TError,{orgId: string;id: string;data: UpdateCatalogItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateCatalogItem>>,
        TError,
        {orgId: string;id: string;data: UpdateCatalogItemRequest},
        TContext
      > => {
      return useMutation(getUpdateCatalogItemMutationOptions(options), queryClient);
    }

export const getInventorySettings = (
    orgId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgInventorySettings>(
      {url: `/inventory/orgs/${orgId}/settings`, method: 'GET', signal
    },
      options);
    }




export const getGetInventorySettingsQueryKey = (orgId: string,) => {
    return [
    `/inventory/orgs/${orgId}/settings`
    ] as const;
    }


export const getGetInventorySettingsQueryOptions = <TData = Awaited<ReturnType<typeof getInventorySettings>>, TError = ErrorBody>(orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInventorySettings>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetInventorySettingsQueryKey(orgId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getInventorySettings>>> = ({ signal }) => getInventorySettings(orgId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getInventorySettings>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetInventorySettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getInventorySettings>>>
export type GetInventorySettingsQueryError = ErrorBody


export function useGetInventorySettings<TData = Awaited<ReturnType<typeof getInventorySettings>>, TError = ErrorBody>(
 orgId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInventorySettings>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getInventorySettings>>,
          TError,
          Awaited<ReturnType<typeof getInventorySettings>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetInventorySettings<TData = Awaited<ReturnType<typeof getInventorySettings>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInventorySettings>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getInventorySettings>>,
          TError,
          Awaited<ReturnType<typeof getInventorySettings>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetInventorySettings<TData = Awaited<ReturnType<typeof getInventorySettings>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInventorySettings>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetInventorySettings<TData = Awaited<ReturnType<typeof getInventorySettings>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInventorySettings>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetInventorySettingsQueryOptions(orgId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const updateInventorySettings = (
    orgId: string,
    updateInventorySettingsRequest: UpdateInventorySettingsRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgInventorySettings>(
      {url: `/inventory/orgs/${orgId}/settings`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateInventorySettingsRequest, signal
    },
      options);
    }



export const getUpdateInventorySettingsMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateInventorySettings>>, TError,{orgId: string;data: UpdateInventorySettingsRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateInventorySettings>>, TError,{orgId: string;data: UpdateInventorySettingsRequest}, TContext> => {

const mutationKey = ['updateInventorySettings'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateInventorySettings>>, {orgId: string;data: UpdateInventorySettingsRequest}> = (props) => {
          const {orgId,data} = props ?? {};

          return  updateInventorySettings(orgId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateInventorySettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateInventorySettings>>>
    export type UpdateInventorySettingsMutationBody = UpdateInventorySettingsRequest
    export type UpdateInventorySettingsMutationError = ErrorBody

    export const useUpdateInventorySettings = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateInventorySettings>>, TError,{orgId: string;data: UpdateInventorySettingsRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateInventorySettings>>,
        TError,
        {orgId: string;data: UpdateInventorySettingsRequest},
        TContext
      > => {
      return useMutation(getUpdateInventorySettingsMutationOptions(options), queryClient);
    }

export const createTransfer = (
    createTransferRequest: CreateTransferRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryTransfer>(
      {url: `/inventory/transfers`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createTransferRequest, signal
    },
      options);
    }



export const getCreateTransferMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createTransfer>>, TError,{data: CreateTransferRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createTransfer>>, TError,{data: CreateTransferRequest}, TContext> => {

const mutationKey = ['createTransfer'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createTransfer>>, {data: CreateTransferRequest}> = (props) => {
          const {data} = props ?? {};

          return  createTransfer(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateTransferMutationResult = NonNullable<Awaited<ReturnType<typeof createTransfer>>>
    export type CreateTransferMutationBody = CreateTransferRequest
    export type CreateTransferMutationError = ErrorBody

    export const useCreateTransfer = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createTransfer>>, TError,{data: CreateTransferRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createTransfer>>,
        TError,
        {data: CreateTransferRequest},
        TContext
      > => {
      return useMutation(getCreateTransferMutationOptions(options), queryClient);
    }

export const deleteTransfer = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/inventory/transfers/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteTransferMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteTransfer>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteTransfer>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteTransfer'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteTransfer>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteTransfer(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteTransferMutationResult = NonNullable<Awaited<ReturnType<typeof deleteTransfer>>>

    export type DeleteTransferMutationError = ErrorBody

    export const useDeleteTransfer = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteTransfer>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteTransfer>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteTransferMutationOptions(options), queryClient);
    }

export const updateTransfer = (
    id: string,
    updateTransferRequest: UpdateTransferRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchInventoryTransfer>(
      {url: `/inventory/transfers/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateTransferRequest, signal
    },
      options);
    }



export const getUpdateTransferMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateTransfer>>, TError,{id: string;data: UpdateTransferRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateTransfer>>, TError,{id: string;data: UpdateTransferRequest}, TContext> => {

const mutationKey = ['updateTransfer'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateTransfer>>, {id: string;data: UpdateTransferRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateTransfer(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateTransferMutationResult = NonNullable<Awaited<ReturnType<typeof updateTransfer>>>
    export type UpdateTransferMutationBody = UpdateTransferRequest
    export type UpdateTransferMutationError = ErrorBody

    export const useUpdateTransfer = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateTransfer>>, TError,{id: string;data: UpdateTransferRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateTransfer>>,
        TError,
        {id: string;data: UpdateTransferRequest},
        TContext
      > => {
      return useMutation(getUpdateTransferMutationOptions(options), queryClient);
    }

export const getCalibrationHandler = (
    branchId: string,
    params?: GetCalibrationHandlerParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<CalibrationSummary>(
      {url: `/menu-advisor/branches/${branchId}/calibration`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetCalibrationHandlerQueryKey = (branchId: string,
    params?: GetCalibrationHandlerParams,) => {
    return [
    `/menu-advisor/branches/${branchId}/calibration`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetCalibrationHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getCalibrationHandler>>, TError = ErrorBody>(branchId: string,
    params?: GetCalibrationHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCalibrationHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetCalibrationHandlerQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getCalibrationHandler>>> = ({ signal }) => getCalibrationHandler(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getCalibrationHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetCalibrationHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getCalibrationHandler>>>
export type GetCalibrationHandlerQueryError = ErrorBody


export function useGetCalibrationHandler<TData = Awaited<ReturnType<typeof getCalibrationHandler>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  GetCalibrationHandlerParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCalibrationHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getCalibrationHandler>>,
          TError,
          Awaited<ReturnType<typeof getCalibrationHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetCalibrationHandler<TData = Awaited<ReturnType<typeof getCalibrationHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: GetCalibrationHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCalibrationHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getCalibrationHandler>>,
          TError,
          Awaited<ReturnType<typeof getCalibrationHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetCalibrationHandler<TData = Awaited<ReturnType<typeof getCalibrationHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: GetCalibrationHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCalibrationHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetCalibrationHandler<TData = Awaited<ReturnType<typeof getCalibrationHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: GetCalibrationHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCalibrationHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetCalibrationHandlerQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listDecisionsHandler = (
    branchId: string,
    params?: ListDecisionsHandlerParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<DecisionRecord[]>(
      {url: `/menu-advisor/branches/${branchId}/decisions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListDecisionsHandlerQueryKey = (branchId: string,
    params?: ListDecisionsHandlerParams,) => {
    return [
    `/menu-advisor/branches/${branchId}/decisions`, ...(params ? [params] : [])
    ] as const;
    }


export const getListDecisionsHandlerQueryOptions = <TData = Awaited<ReturnType<typeof listDecisionsHandler>>, TError = ErrorBody>(branchId: string,
    params?: ListDecisionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDecisionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListDecisionsHandlerQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listDecisionsHandler>>> = ({ signal }) => listDecisionsHandler(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listDecisionsHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListDecisionsHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof listDecisionsHandler>>>
export type ListDecisionsHandlerQueryError = ErrorBody


export function useListDecisionsHandler<TData = Awaited<ReturnType<typeof listDecisionsHandler>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  ListDecisionsHandlerParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDecisionsHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listDecisionsHandler>>,
          TError,
          Awaited<ReturnType<typeof listDecisionsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListDecisionsHandler<TData = Awaited<ReturnType<typeof listDecisionsHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: ListDecisionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDecisionsHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listDecisionsHandler>>,
          TError,
          Awaited<ReturnType<typeof listDecisionsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListDecisionsHandler<TData = Awaited<ReturnType<typeof listDecisionsHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: ListDecisionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDecisionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListDecisionsHandler<TData = Awaited<ReturnType<typeof listDecisionsHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: ListDecisionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDecisionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListDecisionsHandlerQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getLatestItemKpiHandler = (
    branchId: string,
    menuItemId: string,
    sizeLabel: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PriceSuggestionRecord>(
      {url: `/menu-advisor/branches/${branchId}/items/${menuItemId}/sizes/${sizeLabel}/latest-kpi`, method: 'GET', signal
    },
      options);
    }




export const getGetLatestItemKpiHandlerQueryKey = (branchId: string,
    menuItemId: string,
    sizeLabel: string,) => {
    return [
    `/menu-advisor/branches/${branchId}/items/${menuItemId}/sizes/${sizeLabel}/latest-kpi`
    ] as const;
    }


export const getGetLatestItemKpiHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError = ErrorBody>(branchId: string,
    menuItemId: string,
    sizeLabel: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetLatestItemKpiHandlerQueryKey(branchId,menuItemId,sizeLabel);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getLatestItemKpiHandler>>> = ({ signal }) => getLatestItemKpiHandler(branchId,menuItemId,sizeLabel, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined && menuItemId !== null && menuItemId !== undefined && sizeLabel !== null && sizeLabel !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetLatestItemKpiHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getLatestItemKpiHandler>>>
export type GetLatestItemKpiHandlerQueryError = ErrorBody


export function useGetLatestItemKpiHandler<TData = Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError = ErrorBody>(
 branchId: string,
    menuItemId: string,
    sizeLabel: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLatestItemKpiHandler>>,
          TError,
          Awaited<ReturnType<typeof getLatestItemKpiHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLatestItemKpiHandler<TData = Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError = ErrorBody>(
 branchId: string,
    menuItemId: string,
    sizeLabel: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLatestItemKpiHandler>>,
          TError,
          Awaited<ReturnType<typeof getLatestItemKpiHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLatestItemKpiHandler<TData = Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError = ErrorBody>(
 branchId: string,
    menuItemId: string,
    sizeLabel: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetLatestItemKpiHandler<TData = Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError = ErrorBody>(
 branchId: string,
    menuItemId: string,
    sizeLabel: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestItemKpiHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetLatestItemKpiHandlerQueryOptions(branchId,menuItemId,sizeLabel,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listRunsHandler = (
    branchId: string,
    params?: ListRunsHandlerParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PersistedRun[]>(
      {url: `/menu-advisor/branches/${branchId}/runs`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListRunsHandlerQueryKey = (branchId: string,
    params?: ListRunsHandlerParams,) => {
    return [
    `/menu-advisor/branches/${branchId}/runs`, ...(params ? [params] : [])
    ] as const;
    }


export const getListRunsHandlerQueryOptions = <TData = Awaited<ReturnType<typeof listRunsHandler>>, TError = ErrorBody>(branchId: string,
    params?: ListRunsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRunsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListRunsHandlerQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listRunsHandler>>> = ({ signal }) => listRunsHandler(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listRunsHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListRunsHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof listRunsHandler>>>
export type ListRunsHandlerQueryError = ErrorBody


export function useListRunsHandler<TData = Awaited<ReturnType<typeof listRunsHandler>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  ListRunsHandlerParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRunsHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listRunsHandler>>,
          TError,
          Awaited<ReturnType<typeof listRunsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListRunsHandler<TData = Awaited<ReturnType<typeof listRunsHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: ListRunsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRunsHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listRunsHandler>>,
          TError,
          Awaited<ReturnType<typeof listRunsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListRunsHandler<TData = Awaited<ReturnType<typeof listRunsHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: ListRunsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRunsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListRunsHandler<TData = Awaited<ReturnType<typeof listRunsHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: ListRunsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRunsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListRunsHandlerQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createRunHandler = (
    branchId: string,
    createRunBody: CreateRunBody,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<CreateRunResponse>(
      {url: `/menu-advisor/branches/${branchId}/runs`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createRunBody, signal
    },
      options);
    }



export const getCreateRunHandlerMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createRunHandler>>, TError,{branchId: string;data: CreateRunBody}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createRunHandler>>, TError,{branchId: string;data: CreateRunBody}, TContext> => {

const mutationKey = ['createRunHandler'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createRunHandler>>, {branchId: string;data: CreateRunBody}> = (props) => {
          const {branchId,data} = props ?? {};

          return  createRunHandler(branchId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateRunHandlerMutationResult = NonNullable<Awaited<ReturnType<typeof createRunHandler>>>
    export type CreateRunHandlerMutationBody = CreateRunBody
    export type CreateRunHandlerMutationError = ErrorBody

    export const useCreateRunHandler = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createRunHandler>>, TError,{branchId: string;data: CreateRunBody}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createRunHandler>>,
        TError,
        {branchId: string;data: CreateRunBody},
        TContext
      > => {
      return useMutation(getCreateRunHandlerMutationOptions(options), queryClient);
    }

export const getActiveRunHandler = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PersistedRun>(
      {url: `/menu-advisor/branches/${branchId}/runs/active`, method: 'GET', signal
    },
      options);
    }




export const getGetActiveRunHandlerQueryKey = (branchId: string,) => {
    return [
    `/menu-advisor/branches/${branchId}/runs/active`
    ] as const;
    }


export const getGetActiveRunHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getActiveRunHandler>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getActiveRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetActiveRunHandlerQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getActiveRunHandler>>> = ({ signal }) => getActiveRunHandler(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getActiveRunHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetActiveRunHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getActiveRunHandler>>>
export type GetActiveRunHandlerQueryError = ErrorBody


export function useGetActiveRunHandler<TData = Awaited<ReturnType<typeof getActiveRunHandler>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getActiveRunHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getActiveRunHandler>>,
          TError,
          Awaited<ReturnType<typeof getActiveRunHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetActiveRunHandler<TData = Awaited<ReturnType<typeof getActiveRunHandler>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getActiveRunHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getActiveRunHandler>>,
          TError,
          Awaited<ReturnType<typeof getActiveRunHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetActiveRunHandler<TData = Awaited<ReturnType<typeof getActiveRunHandler>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getActiveRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetActiveRunHandler<TData = Awaited<ReturnType<typeof getActiveRunHandler>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getActiveRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetActiveRunHandlerQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getLatestRunHandler = (
    branchId: string,
    params?: GetLatestRunHandlerParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PersistedRun>(
      {url: `/menu-advisor/branches/${branchId}/runs/latest`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetLatestRunHandlerQueryKey = (branchId: string,
    params?: GetLatestRunHandlerParams,) => {
    return [
    `/menu-advisor/branches/${branchId}/runs/latest`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetLatestRunHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getLatestRunHandler>>, TError = ErrorBody>(branchId: string,
    params?: GetLatestRunHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetLatestRunHandlerQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getLatestRunHandler>>> = ({ signal }) => getLatestRunHandler(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getLatestRunHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetLatestRunHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getLatestRunHandler>>>
export type GetLatestRunHandlerQueryError = ErrorBody


export function useGetLatestRunHandler<TData = Awaited<ReturnType<typeof getLatestRunHandler>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  GetLatestRunHandlerParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestRunHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLatestRunHandler>>,
          TError,
          Awaited<ReturnType<typeof getLatestRunHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLatestRunHandler<TData = Awaited<ReturnType<typeof getLatestRunHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: GetLatestRunHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestRunHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLatestRunHandler>>,
          TError,
          Awaited<ReturnType<typeof getLatestRunHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLatestRunHandler<TData = Awaited<ReturnType<typeof getLatestRunHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: GetLatestRunHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetLatestRunHandler<TData = Awaited<ReturnType<typeof getLatestRunHandler>>, TError = ErrorBody>(
 branchId: string,
    params?: GetLatestRunHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLatestRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetLatestRunHandlerQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getBundleSuggestionHandler = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleSuggestionRecord>(
      {url: `/menu-advisor/bundle-suggestions/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetBundleSuggestionHandlerQueryKey = (id: string,) => {
    return [
    `/menu-advisor/bundle-suggestions/${id}`
    ] as const;
    }


export const getGetBundleSuggestionHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetBundleSuggestionHandlerQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getBundleSuggestionHandler>>> = ({ signal }) => getBundleSuggestionHandler(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetBundleSuggestionHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getBundleSuggestionHandler>>>
export type GetBundleSuggestionHandlerQueryError = ErrorBody


export function useGetBundleSuggestionHandler<TData = Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getBundleSuggestionHandler>>,
          TError,
          Awaited<ReturnType<typeof getBundleSuggestionHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetBundleSuggestionHandler<TData = Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getBundleSuggestionHandler>>,
          TError,
          Awaited<ReturnType<typeof getBundleSuggestionHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetBundleSuggestionHandler<TData = Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetBundleSuggestionHandler<TData = Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getBundleSuggestionHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetBundleSuggestionHandlerQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const setBundlePromotedHandler = (
    id: string,
    promoteBundleBody: PromoteBundleBody,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/menu-advisor/bundle-suggestions/${id}/promote`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: promoteBundleBody, signal
    },
      options);
    }



export const getSetBundlePromotedHandlerMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof setBundlePromotedHandler>>, TError,{id: string;data: PromoteBundleBody}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof setBundlePromotedHandler>>, TError,{id: string;data: PromoteBundleBody}, TContext> => {

const mutationKey = ['setBundlePromotedHandler'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof setBundlePromotedHandler>>, {id: string;data: PromoteBundleBody}> = (props) => {
          const {id,data} = props ?? {};

          return  setBundlePromotedHandler(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type SetBundlePromotedHandlerMutationResult = NonNullable<Awaited<ReturnType<typeof setBundlePromotedHandler>>>
    export type SetBundlePromotedHandlerMutationBody = PromoteBundleBody
    export type SetBundlePromotedHandlerMutationError = ErrorBody

    export const useSetBundlePromotedHandler = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof setBundlePromotedHandler>>, TError,{id: string;data: PromoteBundleBody}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof setBundlePromotedHandler>>,
        TError,
        {id: string;data: PromoteBundleBody},
        TContext
      > => {
      return useMutation(getSetBundlePromotedHandlerMutationOptions(options), queryClient);
    }

export const recordDecisionHandler = (
    recordDecisionBody: RecordDecisionBody,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<DecisionRecord>(
      {url: `/menu-advisor/decisions`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: recordDecisionBody, signal
    },
      options);
    }



export const getRecordDecisionHandlerMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof recordDecisionHandler>>, TError,{data: RecordDecisionBody}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof recordDecisionHandler>>, TError,{data: RecordDecisionBody}, TContext> => {

const mutationKey = ['recordDecisionHandler'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof recordDecisionHandler>>, {data: RecordDecisionBody}> = (props) => {
          const {data} = props ?? {};

          return  recordDecisionHandler(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type RecordDecisionHandlerMutationResult = NonNullable<Awaited<ReturnType<typeof recordDecisionHandler>>>
    export type RecordDecisionHandlerMutationBody = RecordDecisionBody
    export type RecordDecisionHandlerMutationError = ErrorBody

    export const useRecordDecisionHandler = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof recordDecisionHandler>>, TError,{data: RecordDecisionBody}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof recordDecisionHandler>>,
        TError,
        {data: RecordDecisionBody},
        TContext
      > => {
      return useMutation(getRecordDecisionHandlerMutationOptions(options), queryClient);
    }

export const getPriceSuggestionHandler = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PriceSuggestionRecord>(
      {url: `/menu-advisor/price-suggestions/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetPriceSuggestionHandlerQueryKey = (id: string,) => {
    return [
    `/menu-advisor/price-suggestions/${id}`
    ] as const;
    }


export const getGetPriceSuggestionHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPriceSuggestionHandlerQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPriceSuggestionHandler>>> = ({ signal }) => getPriceSuggestionHandler(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPriceSuggestionHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getPriceSuggestionHandler>>>
export type GetPriceSuggestionHandlerQueryError = ErrorBody


export function useGetPriceSuggestionHandler<TData = Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPriceSuggestionHandler>>,
          TError,
          Awaited<ReturnType<typeof getPriceSuggestionHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPriceSuggestionHandler<TData = Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPriceSuggestionHandler>>,
          TError,
          Awaited<ReturnType<typeof getPriceSuggestionHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPriceSuggestionHandler<TData = Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetPriceSuggestionHandler<TData = Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPriceSuggestionHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPriceSuggestionHandlerQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getRemovalScenarioHandler = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<RemovalScenarioRecord>(
      {url: `/menu-advisor/removal-scenarios/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetRemovalScenarioHandlerQueryKey = (id: string,) => {
    return [
    `/menu-advisor/removal-scenarios/${id}`
    ] as const;
    }


export const getGetRemovalScenarioHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRemovalScenarioHandlerQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRemovalScenarioHandler>>> = ({ signal }) => getRemovalScenarioHandler(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRemovalScenarioHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getRemovalScenarioHandler>>>
export type GetRemovalScenarioHandlerQueryError = ErrorBody


export function useGetRemovalScenarioHandler<TData = Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRemovalScenarioHandler>>,
          TError,
          Awaited<ReturnType<typeof getRemovalScenarioHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRemovalScenarioHandler<TData = Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRemovalScenarioHandler>>,
          TError,
          Awaited<ReturnType<typeof getRemovalScenarioHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRemovalScenarioHandler<TData = Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetRemovalScenarioHandler<TData = Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRemovalScenarioHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRemovalScenarioHandlerQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getRunHandler = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PersistedRun>(
      {url: `/menu-advisor/runs/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetRunHandlerQueryKey = (id: string,) => {
    return [
    `/menu-advisor/runs/${id}`
    ] as const;
    }


export const getGetRunHandlerQueryOptions = <TData = Awaited<ReturnType<typeof getRunHandler>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRunHandlerQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRunHandler>>> = ({ signal }) => getRunHandler(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRunHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRunHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof getRunHandler>>>
export type GetRunHandlerQueryError = ErrorBody


export function useGetRunHandler<TData = Awaited<ReturnType<typeof getRunHandler>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRunHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRunHandler>>,
          TError,
          Awaited<ReturnType<typeof getRunHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRunHandler<TData = Awaited<ReturnType<typeof getRunHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRunHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRunHandler>>,
          TError,
          Awaited<ReturnType<typeof getRunHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRunHandler<TData = Awaited<ReturnType<typeof getRunHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetRunHandler<TData = Awaited<ReturnType<typeof getRunHandler>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRunHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRunHandlerQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listBundleSuggestionsHandler = (
    id: string,
    params?: ListBundleSuggestionsHandlerParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleSuggestionRecord[]>(
      {url: `/menu-advisor/runs/${id}/bundle-suggestions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListBundleSuggestionsHandlerQueryKey = (id: string,
    params?: ListBundleSuggestionsHandlerParams,) => {
    return [
    `/menu-advisor/runs/${id}/bundle-suggestions`, ...(params ? [params] : [])
    ] as const;
    }


export const getListBundleSuggestionsHandlerQueryOptions = <TData = Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError = ErrorBody>(id: string,
    params?: ListBundleSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListBundleSuggestionsHandlerQueryKey(id,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>> = ({ signal }) => listBundleSuggestionsHandler(id,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListBundleSuggestionsHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>>
export type ListBundleSuggestionsHandlerQueryError = ErrorBody


export function useListBundleSuggestionsHandler<TData = Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params: undefined |  ListBundleSuggestionsHandlerParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBundleSuggestionsHandler>>,
          TError,
          Awaited<ReturnType<typeof listBundleSuggestionsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBundleSuggestionsHandler<TData = Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListBundleSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listBundleSuggestionsHandler>>,
          TError,
          Awaited<ReturnType<typeof listBundleSuggestionsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListBundleSuggestionsHandler<TData = Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListBundleSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListBundleSuggestionsHandler<TData = Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListBundleSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listBundleSuggestionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListBundleSuggestionsHandlerQueryOptions(id,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listPriceSuggestionsHandler = (
    id: string,
    params?: ListPriceSuggestionsHandlerParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PriceSuggestionRecord[]>(
      {url: `/menu-advisor/runs/${id}/price-suggestions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListPriceSuggestionsHandlerQueryKey = (id: string,
    params?: ListPriceSuggestionsHandlerParams,) => {
    return [
    `/menu-advisor/runs/${id}/price-suggestions`, ...(params ? [params] : [])
    ] as const;
    }


export const getListPriceSuggestionsHandlerQueryOptions = <TData = Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError = ErrorBody>(id: string,
    params?: ListPriceSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListPriceSuggestionsHandlerQueryKey(id,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>> = ({ signal }) => listPriceSuggestionsHandler(id,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListPriceSuggestionsHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>>
export type ListPriceSuggestionsHandlerQueryError = ErrorBody


export function useListPriceSuggestionsHandler<TData = Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params: undefined |  ListPriceSuggestionsHandlerParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPriceSuggestionsHandler>>,
          TError,
          Awaited<ReturnType<typeof listPriceSuggestionsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPriceSuggestionsHandler<TData = Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListPriceSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPriceSuggestionsHandler>>,
          TError,
          Awaited<ReturnType<typeof listPriceSuggestionsHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPriceSuggestionsHandler<TData = Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListPriceSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListPriceSuggestionsHandler<TData = Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListPriceSuggestionsHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPriceSuggestionsHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListPriceSuggestionsHandlerQueryOptions(id,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listRemovalScenariosHandler = (
    id: string,
    params?: ListRemovalScenariosHandlerParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<RemovalScenarioRecord[]>(
      {url: `/menu-advisor/runs/${id}/removal-scenarios`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListRemovalScenariosHandlerQueryKey = (id: string,
    params?: ListRemovalScenariosHandlerParams,) => {
    return [
    `/menu-advisor/runs/${id}/removal-scenarios`, ...(params ? [params] : [])
    ] as const;
    }


export const getListRemovalScenariosHandlerQueryOptions = <TData = Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError = ErrorBody>(id: string,
    params?: ListRemovalScenariosHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListRemovalScenariosHandlerQueryKey(id,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listRemovalScenariosHandler>>> = ({ signal }) => listRemovalScenariosHandler(id,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListRemovalScenariosHandlerQueryResult = NonNullable<Awaited<ReturnType<typeof listRemovalScenariosHandler>>>
export type ListRemovalScenariosHandlerQueryError = ErrorBody


export function useListRemovalScenariosHandler<TData = Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError = ErrorBody>(
 id: string,
    params: undefined |  ListRemovalScenariosHandlerParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listRemovalScenariosHandler>>,
          TError,
          Awaited<ReturnType<typeof listRemovalScenariosHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListRemovalScenariosHandler<TData = Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListRemovalScenariosHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listRemovalScenariosHandler>>,
          TError,
          Awaited<ReturnType<typeof listRemovalScenariosHandler>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListRemovalScenariosHandler<TData = Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListRemovalScenariosHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListRemovalScenariosHandler<TData = Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError = ErrorBody>(
 id: string,
    params?: ListRemovalScenariosHandlerParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRemovalScenariosHandler>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListRemovalScenariosHandlerQueryOptions(id,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listMenuItems = (
    params: ListMenuItemsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<MenuItem[]>(
      {url: `/menu-items`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListMenuItemsQueryKey = (params?: ListMenuItemsParams,) => {
    return [
    `/menu-items`, ...(params ? [params] : [])
    ] as const;
    }


export const getListMenuItemsQueryOptions = <TData = Awaited<ReturnType<typeof listMenuItems>>, TError = ErrorBody>(params: ListMenuItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuItems>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMenuItemsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMenuItems>>> = ({ signal }) => listMenuItems(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMenuItems>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListMenuItemsQueryResult = NonNullable<Awaited<ReturnType<typeof listMenuItems>>>
export type ListMenuItemsQueryError = ErrorBody


export function useListMenuItems<TData = Awaited<ReturnType<typeof listMenuItems>>, TError = ErrorBody>(
 params: ListMenuItemsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuItems>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listMenuItems>>,
          TError,
          Awaited<ReturnType<typeof listMenuItems>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListMenuItems<TData = Awaited<ReturnType<typeof listMenuItems>>, TError = ErrorBody>(
 params: ListMenuItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuItems>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listMenuItems>>,
          TError,
          Awaited<ReturnType<typeof listMenuItems>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListMenuItems<TData = Awaited<ReturnType<typeof listMenuItems>>, TError = ErrorBody>(
 params: ListMenuItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuItems>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListMenuItems<TData = Awaited<ReturnType<typeof listMenuItems>>, TError = ErrorBody>(
 params: ListMenuItemsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listMenuItems>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListMenuItemsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createMenuItem = (
    createMenuItemRequest: CreateMenuItemRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<MenuItemFull>(
      {url: `/menu-items`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createMenuItemRequest, signal
    },
      options);
    }



export const getCreateMenuItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createMenuItem>>, TError,{data: CreateMenuItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createMenuItem>>, TError,{data: CreateMenuItemRequest}, TContext> => {

const mutationKey = ['createMenuItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createMenuItem>>, {data: CreateMenuItemRequest}> = (props) => {
          const {data} = props ?? {};

          return  createMenuItem(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateMenuItemMutationResult = NonNullable<Awaited<ReturnType<typeof createMenuItem>>>
    export type CreateMenuItemMutationBody = CreateMenuItemRequest
    export type CreateMenuItemMutationError = ErrorBody

    export const useCreateMenuItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createMenuItem>>, TError,{data: CreateMenuItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createMenuItem>>,
        TError,
        {data: CreateMenuItemRequest},
        TContext
      > => {
      return useMutation(getCreateMenuItemMutationOptions(options), queryClient);
    }

export const getMenuItem = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<MenuItemFull>(
      {url: `/menu-items/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetMenuItemQueryKey = (id: string,) => {
    return [
    `/menu-items/${id}`
    ] as const;
    }


export const getGetMenuItemQueryOptions = <TData = Awaited<ReturnType<typeof getMenuItem>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMenuItem>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetMenuItemQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getMenuItem>>> = ({ signal }) => getMenuItem(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getMenuItem>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetMenuItemQueryResult = NonNullable<Awaited<ReturnType<typeof getMenuItem>>>
export type GetMenuItemQueryError = ErrorBody


export function useGetMenuItem<TData = Awaited<ReturnType<typeof getMenuItem>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMenuItem>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getMenuItem>>,
          TError,
          Awaited<ReturnType<typeof getMenuItem>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetMenuItem<TData = Awaited<ReturnType<typeof getMenuItem>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMenuItem>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getMenuItem>>,
          TError,
          Awaited<ReturnType<typeof getMenuItem>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetMenuItem<TData = Awaited<ReturnType<typeof getMenuItem>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMenuItem>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetMenuItem<TData = Awaited<ReturnType<typeof getMenuItem>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMenuItem>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetMenuItemQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const deleteMenuItem = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/menu-items/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteMenuItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteMenuItem>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteMenuItem>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteMenuItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteMenuItem>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteMenuItem(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteMenuItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMenuItem>>>

    export type DeleteMenuItemMutationError = ErrorBody

    export const useDeleteMenuItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteMenuItem>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteMenuItem>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteMenuItemMutationOptions(options), queryClient);
    }

export const updateMenuItem = (
    id: string,
    updateMenuItemRequest: UpdateMenuItemRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<MenuItem>(
      {url: `/menu-items/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateMenuItemRequest, signal
    },
      options);
    }



export const getUpdateMenuItemMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMenuItem>>, TError,{id: string;data: UpdateMenuItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateMenuItem>>, TError,{id: string;data: UpdateMenuItemRequest}, TContext> => {

const mutationKey = ['updateMenuItem'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateMenuItem>>, {id: string;data: UpdateMenuItemRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateMenuItem(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateMenuItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateMenuItem>>>
    export type UpdateMenuItemMutationBody = UpdateMenuItemRequest
    export type UpdateMenuItemMutationError = ErrorBody

    export const useUpdateMenuItem = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMenuItem>>, TError,{id: string;data: UpdateMenuItemRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateMenuItem>>,
        TError,
        {id: string;data: UpdateMenuItemRequest},
        TContext
      > => {
      return useMutation(getUpdateMenuItemMutationOptions(options), queryClient);
    }

export const listAddonSlots = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonSlot[]>(
      {url: `/menu-items/${id}/addon-slots`, method: 'GET', signal
    },
      options);
    }




export const getListAddonSlotsQueryKey = (id: string,) => {
    return [
    `/menu-items/${id}/addon-slots`
    ] as const;
    }


export const getListAddonSlotsQueryOptions = <TData = Awaited<ReturnType<typeof listAddonSlots>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonSlots>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAddonSlotsQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAddonSlots>>> = ({ signal }) => listAddonSlots(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAddonSlots>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListAddonSlotsQueryResult = NonNullable<Awaited<ReturnType<typeof listAddonSlots>>>
export type ListAddonSlotsQueryError = ErrorBody


export function useListAddonSlots<TData = Awaited<ReturnType<typeof listAddonSlots>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonSlots>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonSlots>>,
          TError,
          Awaited<ReturnType<typeof listAddonSlots>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonSlots<TData = Awaited<ReturnType<typeof listAddonSlots>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonSlots>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonSlots>>,
          TError,
          Awaited<ReturnType<typeof listAddonSlots>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonSlots<TData = Awaited<ReturnType<typeof listAddonSlots>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonSlots>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListAddonSlots<TData = Awaited<ReturnType<typeof listAddonSlots>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonSlots>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListAddonSlotsQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createAddonSlot = (
    id: string,
    createAddonSlotRequest: CreateAddonSlotRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonSlot>(
      {url: `/menu-items/${id}/addon-slots`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createAddonSlotRequest, signal
    },
      options);
    }



export const getCreateAddonSlotMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAddonSlot>>, TError,{id: string;data: CreateAddonSlotRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createAddonSlot>>, TError,{id: string;data: CreateAddonSlotRequest}, TContext> => {

const mutationKey = ['createAddonSlot'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createAddonSlot>>, {id: string;data: CreateAddonSlotRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  createAddonSlot(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateAddonSlotMutationResult = NonNullable<Awaited<ReturnType<typeof createAddonSlot>>>
    export type CreateAddonSlotMutationBody = CreateAddonSlotRequest
    export type CreateAddonSlotMutationError = ErrorBody

    export const useCreateAddonSlot = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAddonSlot>>, TError,{id: string;data: CreateAddonSlotRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createAddonSlot>>,
        TError,
        {id: string;data: CreateAddonSlotRequest},
        TContext
      > => {
      return useMutation(getCreateAddonSlotMutationOptions(options), queryClient);
    }

export const deleteAddonSlot = (
    id: string,
    slotId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/menu-items/${id}/addon-slots/${slotId}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteAddonSlotMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonSlot>>, TError,{id: string;slotId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteAddonSlot>>, TError,{id: string;slotId: string}, TContext> => {

const mutationKey = ['deleteAddonSlot'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteAddonSlot>>, {id: string;slotId: string}> = (props) => {
          const {id,slotId} = props ?? {};

          return  deleteAddonSlot(id,slotId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteAddonSlotMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAddonSlot>>>

    export type DeleteAddonSlotMutationError = ErrorBody

    export const useDeleteAddonSlot = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonSlot>>, TError,{id: string;slotId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteAddonSlot>>,
        TError,
        {id: string;slotId: string},
        TContext
      > => {
      return useMutation(getDeleteAddonSlotMutationOptions(options), queryClient);
    }

export const updateAddonSlot = (
    id: string,
    slotId: string,
    updateAddonSlotRequest: UpdateAddonSlotRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonSlot>(
      {url: `/menu-items/${id}/addon-slots/${slotId}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateAddonSlotRequest, signal
    },
      options);
    }



export const getUpdateAddonSlotMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateAddonSlot>>, TError,{id: string;slotId: string;data: UpdateAddonSlotRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateAddonSlot>>, TError,{id: string;slotId: string;data: UpdateAddonSlotRequest}, TContext> => {

const mutationKey = ['updateAddonSlot'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateAddonSlot>>, {id: string;slotId: string;data: UpdateAddonSlotRequest}> = (props) => {
          const {id,slotId,data} = props ?? {};

          return  updateAddonSlot(id,slotId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateAddonSlotMutationResult = NonNullable<Awaited<ReturnType<typeof updateAddonSlot>>>
    export type UpdateAddonSlotMutationBody = UpdateAddonSlotRequest
    export type UpdateAddonSlotMutationError = ErrorBody

    export const useUpdateAddonSlot = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateAddonSlot>>, TError,{id: string;slotId: string;data: UpdateAddonSlotRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateAddonSlot>>,
        TError,
        {id: string;slotId: string;data: UpdateAddonSlotRequest},
        TContext
      > => {
      return useMutation(getUpdateAddonSlotMutationOptions(options), queryClient);
    }

export const listOptionalFields = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OptionalField[]>(
      {url: `/menu-items/${id}/optionals`, method: 'GET', signal
    },
      options);
    }




export const getListOptionalFieldsQueryKey = (id: string,) => {
    return [
    `/menu-items/${id}/optionals`
    ] as const;
    }


export const getListOptionalFieldsQueryOptions = <TData = Awaited<ReturnType<typeof listOptionalFields>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOptionalFields>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListOptionalFieldsQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listOptionalFields>>> = ({ signal }) => listOptionalFields(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listOptionalFields>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListOptionalFieldsQueryResult = NonNullable<Awaited<ReturnType<typeof listOptionalFields>>>
export type ListOptionalFieldsQueryError = ErrorBody


export function useListOptionalFields<TData = Awaited<ReturnType<typeof listOptionalFields>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOptionalFields>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOptionalFields>>,
          TError,
          Awaited<ReturnType<typeof listOptionalFields>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOptionalFields<TData = Awaited<ReturnType<typeof listOptionalFields>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOptionalFields>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOptionalFields>>,
          TError,
          Awaited<ReturnType<typeof listOptionalFields>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOptionalFields<TData = Awaited<ReturnType<typeof listOptionalFields>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOptionalFields>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListOptionalFields<TData = Awaited<ReturnType<typeof listOptionalFields>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOptionalFields>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListOptionalFieldsQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createOptionalField = (
    id: string,
    createOptionalFieldRequest: CreateOptionalFieldRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OptionalField>(
      {url: `/menu-items/${id}/optionals`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createOptionalFieldRequest, signal
    },
      options);
    }



export const getCreateOptionalFieldMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createOptionalField>>, TError,{id: string;data: CreateOptionalFieldRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createOptionalField>>, TError,{id: string;data: CreateOptionalFieldRequest}, TContext> => {

const mutationKey = ['createOptionalField'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createOptionalField>>, {id: string;data: CreateOptionalFieldRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  createOptionalField(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateOptionalFieldMutationResult = NonNullable<Awaited<ReturnType<typeof createOptionalField>>>
    export type CreateOptionalFieldMutationBody = CreateOptionalFieldRequest
    export type CreateOptionalFieldMutationError = ErrorBody

    export const useCreateOptionalField = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createOptionalField>>, TError,{id: string;data: CreateOptionalFieldRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createOptionalField>>,
        TError,
        {id: string;data: CreateOptionalFieldRequest},
        TContext
      > => {
      return useMutation(getCreateOptionalFieldMutationOptions(options), queryClient);
    }

export const deleteOptionalField = (
    id: string,
    fieldId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/menu-items/${id}/optionals/${fieldId}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteOptionalFieldMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteOptionalField>>, TError,{id: string;fieldId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteOptionalField>>, TError,{id: string;fieldId: string}, TContext> => {

const mutationKey = ['deleteOptionalField'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteOptionalField>>, {id: string;fieldId: string}> = (props) => {
          const {id,fieldId} = props ?? {};

          return  deleteOptionalField(id,fieldId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteOptionalFieldMutationResult = NonNullable<Awaited<ReturnType<typeof deleteOptionalField>>>

    export type DeleteOptionalFieldMutationError = ErrorBody

    export const useDeleteOptionalField = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteOptionalField>>, TError,{id: string;fieldId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteOptionalField>>,
        TError,
        {id: string;fieldId: string},
        TContext
      > => {
      return useMutation(getDeleteOptionalFieldMutationOptions(options), queryClient);
    }

export const updateOptionalField = (
    id: string,
    fieldId: string,
    updateOptionalFieldRequest: UpdateOptionalFieldRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OptionalField>(
      {url: `/menu-items/${id}/optionals/${fieldId}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateOptionalFieldRequest, signal
    },
      options);
    }



export const getUpdateOptionalFieldMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateOptionalField>>, TError,{id: string;fieldId: string;data: UpdateOptionalFieldRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateOptionalField>>, TError,{id: string;fieldId: string;data: UpdateOptionalFieldRequest}, TContext> => {

const mutationKey = ['updateOptionalField'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateOptionalField>>, {id: string;fieldId: string;data: UpdateOptionalFieldRequest}> = (props) => {
          const {id,fieldId,data} = props ?? {};

          return  updateOptionalField(id,fieldId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateOptionalFieldMutationResult = NonNullable<Awaited<ReturnType<typeof updateOptionalField>>>
    export type UpdateOptionalFieldMutationBody = UpdateOptionalFieldRequest
    export type UpdateOptionalFieldMutationError = ErrorBody

    export const useUpdateOptionalField = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateOptionalField>>, TError,{id: string;fieldId: string;data: UpdateOptionalFieldRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateOptionalField>>,
        TError,
        {id: string;fieldId: string;data: UpdateOptionalFieldRequest},
        TContext
      > => {
      return useMutation(getUpdateOptionalFieldMutationOptions(options), queryClient);
    }

export const listAddonOverrides = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonOverride[]>(
      {url: `/menu-items/${id}/overrides`, method: 'GET', signal
    },
      options);
    }




export const getListAddonOverridesQueryKey = (id: string,) => {
    return [
    `/menu-items/${id}/overrides`
    ] as const;
    }


export const getListAddonOverridesQueryOptions = <TData = Awaited<ReturnType<typeof listAddonOverrides>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonOverrides>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAddonOverridesQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAddonOverrides>>> = ({ signal }) => listAddonOverrides(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAddonOverrides>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListAddonOverridesQueryResult = NonNullable<Awaited<ReturnType<typeof listAddonOverrides>>>
export type ListAddonOverridesQueryError = ErrorBody


export function useListAddonOverrides<TData = Awaited<ReturnType<typeof listAddonOverrides>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonOverrides>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonOverrides>>,
          TError,
          Awaited<ReturnType<typeof listAddonOverrides>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonOverrides<TData = Awaited<ReturnType<typeof listAddonOverrides>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonOverrides>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonOverrides>>,
          TError,
          Awaited<ReturnType<typeof listAddonOverrides>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonOverrides<TData = Awaited<ReturnType<typeof listAddonOverrides>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonOverrides>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListAddonOverrides<TData = Awaited<ReturnType<typeof listAddonOverrides>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonOverrides>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListAddonOverridesQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const upsertAddonOverride = (
    id: string,
    upsertAddonOverrideRequest: UpsertAddonOverrideRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonOverride>(
      {url: `/menu-items/${id}/overrides`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: upsertAddonOverrideRequest, signal
    },
      options);
    }



export const getUpsertAddonOverrideMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertAddonOverride>>, TError,{id: string;data: UpsertAddonOverrideRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof upsertAddonOverride>>, TError,{id: string;data: UpsertAddonOverrideRequest}, TContext> => {

const mutationKey = ['upsertAddonOverride'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof upsertAddonOverride>>, {id: string;data: UpsertAddonOverrideRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  upsertAddonOverride(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpsertAddonOverrideMutationResult = NonNullable<Awaited<ReturnType<typeof upsertAddonOverride>>>
    export type UpsertAddonOverrideMutationBody = UpsertAddonOverrideRequest
    export type UpsertAddonOverrideMutationError = ErrorBody

    export const useUpsertAddonOverride = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertAddonOverride>>, TError,{id: string;data: UpsertAddonOverrideRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof upsertAddonOverride>>,
        TError,
        {id: string;data: UpsertAddonOverrideRequest},
        TContext
      > => {
      return useMutation(getUpsertAddonOverrideMutationOptions(options), queryClient);
    }

export const deleteAddonOverride = (
    id: string,
    overrideId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/menu-items/${id}/overrides/${overrideId}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteAddonOverrideMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonOverride>>, TError,{id: string;overrideId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteAddonOverride>>, TError,{id: string;overrideId: string}, TContext> => {

const mutationKey = ['deleteAddonOverride'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteAddonOverride>>, {id: string;overrideId: string}> = (props) => {
          const {id,overrideId} = props ?? {};

          return  deleteAddonOverride(id,overrideId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteAddonOverrideMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAddonOverride>>>

    export type DeleteAddonOverrideMutationError = ErrorBody

    export const useDeleteAddonOverride = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonOverride>>, TError,{id: string;overrideId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteAddonOverride>>,
        TError,
        {id: string;overrideId: string},
        TContext
      > => {
      return useMutation(getDeleteAddonOverrideMutationOptions(options), queryClient);
    }

export const upsertSize = (
    id: string,
    upsertSizeRequest: UpsertSizeRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ItemSize>(
      {url: `/menu-items/${id}/sizes`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: upsertSizeRequest, signal
    },
      options);
    }



export const getUpsertSizeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertSize>>, TError,{id: string;data: UpsertSizeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof upsertSize>>, TError,{id: string;data: UpsertSizeRequest}, TContext> => {

const mutationKey = ['upsertSize'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof upsertSize>>, {id: string;data: UpsertSizeRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  upsertSize(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpsertSizeMutationResult = NonNullable<Awaited<ReturnType<typeof upsertSize>>>
    export type UpsertSizeMutationBody = UpsertSizeRequest
    export type UpsertSizeMutationError = ErrorBody

    export const useUpsertSize = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertSize>>, TError,{id: string;data: UpsertSizeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof upsertSize>>,
        TError,
        {id: string;data: UpsertSizeRequest},
        TContext
      > => {
      return useMutation(getUpsertSizeMutationOptions(options), queryClient);
    }

export const deleteSize = (
    id: string,
    sid: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/menu-items/${id}/sizes/${sid}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteSizeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteSize>>, TError,{id: string;sid: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteSize>>, TError,{id: string;sid: string}, TContext> => {

const mutationKey = ['deleteSize'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteSize>>, {id: string;sid: string}> = (props) => {
          const {id,sid} = props ?? {};

          return  deleteSize(id,sid,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteSizeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSize>>>

    export type DeleteSizeMutationError = ErrorBody

    export const useDeleteSize = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteSize>>, TError,{id: string;sid: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteSize>>,
        TError,
        {id: string;sid: string},
        TContext
      > => {
      return useMutation(getDeleteSizeMutationOptions(options), queryClient);
    }

export const getPublicMenu = (
    orgId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PublicMenuResponse>(
      {url: `/menu/public/${orgId}`, method: 'GET', signal
    },
      options);
    }




export const getGetPublicMenuQueryKey = (orgId: string,) => {
    return [
    `/menu/public/${orgId}`
    ] as const;
    }


export const getGetPublicMenuQueryOptions = <TData = Awaited<ReturnType<typeof getPublicMenu>>, TError = ErrorBody>(orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPublicMenu>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPublicMenuQueryKey(orgId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPublicMenu>>> = ({ signal }) => getPublicMenu(orgId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPublicMenu>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPublicMenuQueryResult = NonNullable<Awaited<ReturnType<typeof getPublicMenu>>>
export type GetPublicMenuQueryError = ErrorBody


export function useGetPublicMenu<TData = Awaited<ReturnType<typeof getPublicMenu>>, TError = ErrorBody>(
 orgId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPublicMenu>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPublicMenu>>,
          TError,
          Awaited<ReturnType<typeof getPublicMenu>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPublicMenu<TData = Awaited<ReturnType<typeof getPublicMenu>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPublicMenu>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPublicMenu>>,
          TError,
          Awaited<ReturnType<typeof getPublicMenu>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPublicMenu<TData = Awaited<ReturnType<typeof getPublicMenu>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPublicMenu>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetPublicMenu<TData = Awaited<ReturnType<typeof getPublicMenu>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPublicMenu>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPublicMenuQueryOptions(orgId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listOrders = (
    params?: ListOrdersParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PaginatedOrders>(
      {url: `/orders`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListOrdersQueryKey = (params?: ListOrdersParams,) => {
    return [
    `/orders`, ...(params ? [params] : [])
    ] as const;
    }


export const getListOrdersQueryOptions = <TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorBody>(params?: ListOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListOrdersQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listOrders>>> = ({ signal }) => listOrders(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listOrders>>>
export type ListOrdersQueryError = ErrorBody


export function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorBody>(
 params: undefined |  ListOrdersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOrders>>,
          TError,
          Awaited<ReturnType<typeof listOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorBody>(
 params?: ListOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOrders>>,
          TError,
          Awaited<ReturnType<typeof listOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorBody>(
 params?: ListOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorBody>(
 params?: ListOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListOrdersQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createOrder = (
    createOrderRequest: CreateOrderRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrderFull>(
      {url: `/orders`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createOrderRequest, signal
    },
      options);
    }



export const getCreateOrderMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError,{data: CreateOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError,{data: CreateOrderRequest}, TContext> => {

const mutationKey = ['createOrder'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createOrder>>, {data: CreateOrderRequest}> = (props) => {
          const {data} = props ?? {};

          return  createOrder(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateOrderMutationResult = NonNullable<Awaited<ReturnType<typeof createOrder>>>
    export type CreateOrderMutationBody = CreateOrderRequest
    export type CreateOrderMutationError = ErrorBody

    export const useCreateOrder = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError,{data: CreateOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createOrder>>,
        TError,
        {data: CreateOrderRequest},
        TContext
      > => {
      return useMutation(getCreateOrderMutationOptions(options), queryClient);
    }

export const exportOrders = (
    params?: ExportOrdersParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ExportResponse>(
      {url: `/orders/export`, method: 'GET',
        params, signal
    },
      options);
    }




export const getExportOrdersQueryKey = (params?: ExportOrdersParams,) => {
    return [
    `/orders/export`, ...(params ? [params] : [])
    ] as const;
    }


export const getExportOrdersQueryOptions = <TData = Awaited<ReturnType<typeof exportOrders>>, TError = ErrorBody>(params?: ExportOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof exportOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getExportOrdersQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof exportOrders>>> = ({ signal }) => exportOrders(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof exportOrders>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ExportOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof exportOrders>>>
export type ExportOrdersQueryError = ErrorBody


export function useExportOrders<TData = Awaited<ReturnType<typeof exportOrders>>, TError = ErrorBody>(
 params: undefined |  ExportOrdersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof exportOrders>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof exportOrders>>,
          TError,
          Awaited<ReturnType<typeof exportOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useExportOrders<TData = Awaited<ReturnType<typeof exportOrders>>, TError = ErrorBody>(
 params?: ExportOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof exportOrders>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof exportOrders>>,
          TError,
          Awaited<ReturnType<typeof exportOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useExportOrders<TData = Awaited<ReturnType<typeof exportOrders>>, TError = ErrorBody>(
 params?: ExportOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof exportOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useExportOrders<TData = Awaited<ReturnType<typeof exportOrders>>, TError = ErrorBody>(
 params?: ExportOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof exportOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getExportOrdersQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const previewRecipe = (
    previewRecipeRequest: PreviewRecipeRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PreviewIngredient[]>(
      {url: `/orders/preview-recipe`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: previewRecipeRequest, signal
    },
      options);
    }



export const getPreviewRecipeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof previewRecipe>>, TError,{data: PreviewRecipeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof previewRecipe>>, TError,{data: PreviewRecipeRequest}, TContext> => {

const mutationKey = ['previewRecipe'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof previewRecipe>>, {data: PreviewRecipeRequest}> = (props) => {
          const {data} = props ?? {};

          return  previewRecipe(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PreviewRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof previewRecipe>>>
    export type PreviewRecipeMutationBody = PreviewRecipeRequest
    export type PreviewRecipeMutationError = ErrorBody

    export const usePreviewRecipe = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof previewRecipe>>, TError,{data: PreviewRecipeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof previewRecipe>>,
        TError,
        {data: PreviewRecipeRequest},
        TContext
      > => {
      return useMutation(getPreviewRecipeMutationOptions(options), queryClient);
    }

export const getOrder = (
    orderId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrderFull>(
      {url: `/orders/${orderId}`, method: 'GET', signal
    },
      options);
    }




export const getGetOrderQueryKey = (orderId: string,) => {
    return [
    `/orders/${orderId}`
    ] as const;
    }


export const getGetOrderQueryOptions = <TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorBody>(orderId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetOrderQueryKey(orderId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getOrder>>> = ({ signal }) => getOrder(orderId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orderId !== null && orderId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetOrderQueryResult = NonNullable<Awaited<ReturnType<typeof getOrder>>>
export type GetOrderQueryError = ErrorBody


export function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorBody>(
 orderId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getOrder>>,
          TError,
          Awaited<ReturnType<typeof getOrder>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorBody>(
 orderId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getOrder>>,
          TError,
          Awaited<ReturnType<typeof getOrder>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorBody>(
 orderId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorBody>(
 orderId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetOrderQueryOptions(orderId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const voidOrder = (
    orderId: string,
    voidOrderRequest: VoidOrderRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Order>(
      {url: `/orders/${orderId}/void`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: voidOrderRequest, signal
    },
      options);
    }



export const getVoidOrderMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof voidOrder>>, TError,{orderId: string;data: VoidOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof voidOrder>>, TError,{orderId: string;data: VoidOrderRequest}, TContext> => {

const mutationKey = ['voidOrder'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof voidOrder>>, {orderId: string;data: VoidOrderRequest}> = (props) => {
          const {orderId,data} = props ?? {};

          return  voidOrder(orderId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type VoidOrderMutationResult = NonNullable<Awaited<ReturnType<typeof voidOrder>>>
    export type VoidOrderMutationBody = VoidOrderRequest
    export type VoidOrderMutationError = ErrorBody

    export const useVoidOrder = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof voidOrder>>, TError,{orderId: string;data: VoidOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof voidOrder>>,
        TError,
        {orderId: string;data: VoidOrderRequest},
        TContext
      > => {
      return useMutation(getVoidOrderMutationOptions(options), queryClient);
    }

export const listOrgs = (

 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Org[]>(
      {url: `/orgs`, method: 'GET', signal
    },
      options);
    }




export const getListOrgsQueryKey = () => {
    return [
    `/orgs`
    ] as const;
    }


export const getListOrgsQueryOptions = <TData = Awaited<ReturnType<typeof listOrgs>>, TError = ErrorBody>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgs>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListOrgsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listOrgs>>> = ({ signal }) => listOrgs(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listOrgs>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListOrgsQueryResult = NonNullable<Awaited<ReturnType<typeof listOrgs>>>
export type ListOrgsQueryError = ErrorBody


export function useListOrgs<TData = Awaited<ReturnType<typeof listOrgs>>, TError = ErrorBody>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgs>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOrgs>>,
          TError,
          Awaited<ReturnType<typeof listOrgs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOrgs<TData = Awaited<ReturnType<typeof listOrgs>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgs>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOrgs>>,
          TError,
          Awaited<ReturnType<typeof listOrgs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOrgs<TData = Awaited<ReturnType<typeof listOrgs>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgs>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListOrgs<TData = Awaited<ReturnType<typeof listOrgs>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgs>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListOrgsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createOrg = (
    createOrgMultipart: CreateOrgMultipart,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
if(createOrgMultipart.currency_code !== undefined && createOrgMultipart.currency_code !== null) {
 formData.append(`currency_code`, createOrgMultipart.currency_code);
 }
if(createOrgMultipart.logo !== undefined && createOrgMultipart.logo !== null) {
 formData.append(`logo`, createOrgMultipart.logo);
 }
formData.append(`name`, createOrgMultipart.name);
if(createOrgMultipart.receipt_footer !== undefined && createOrgMultipart.receipt_footer !== null) {
 formData.append(`receipt_footer`, createOrgMultipart.receipt_footer);
 }
formData.append(`slug`, createOrgMultipart.slug);
if(createOrgMultipart.tax_rate !== undefined && createOrgMultipart.tax_rate !== null) {
 formData.append(`tax_rate`, createOrgMultipart.tax_rate.toString())
 }

      return customInstance<Org>(
      {url: `/orgs`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }



export const getCreateOrgMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createOrg>>, TError,{data: CreateOrgMultipart}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createOrg>>, TError,{data: CreateOrgMultipart}, TContext> => {

const mutationKey = ['createOrg'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createOrg>>, {data: CreateOrgMultipart}> = (props) => {
          const {data} = props ?? {};

          return  createOrg(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateOrgMutationResult = NonNullable<Awaited<ReturnType<typeof createOrg>>>
    export type CreateOrgMutationBody = CreateOrgMultipart
    export type CreateOrgMutationError = ErrorBody

    export const useCreateOrg = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createOrg>>, TError,{data: CreateOrgMultipart}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createOrg>>,
        TError,
        {data: CreateOrgMultipart},
        TContext
      > => {
      return useMutation(getCreateOrgMutationOptions(options), queryClient);
    }

export const getOrg = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Org>(
      {url: `/orgs/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetOrgQueryKey = (id: string,) => {
    return [
    `/orgs/${id}`
    ] as const;
    }


export const getGetOrgQueryOptions = <TData = Awaited<ReturnType<typeof getOrg>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrg>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetOrgQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getOrg>>> = ({ signal }) => getOrg(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getOrg>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetOrgQueryResult = NonNullable<Awaited<ReturnType<typeof getOrg>>>
export type GetOrgQueryError = ErrorBody


export function useGetOrg<TData = Awaited<ReturnType<typeof getOrg>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrg>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getOrg>>,
          TError,
          Awaited<ReturnType<typeof getOrg>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetOrg<TData = Awaited<ReturnType<typeof getOrg>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrg>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getOrg>>,
          TError,
          Awaited<ReturnType<typeof getOrg>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetOrg<TData = Awaited<ReturnType<typeof getOrg>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrg>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetOrg<TData = Awaited<ReturnType<typeof getOrg>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrg>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetOrgQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const deleteOrg = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/orgs/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteOrgMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteOrg>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteOrg>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteOrg'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteOrg>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteOrg(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteOrgMutationResult = NonNullable<Awaited<ReturnType<typeof deleteOrg>>>

    export type DeleteOrgMutationError = ErrorBody

    export const useDeleteOrg = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteOrg>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteOrg>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteOrgMutationOptions(options), queryClient);
    }

export const updateOrg = (
    id: string,
    updateOrgRequest: UpdateOrgRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Org>(
      {url: `/orgs/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateOrgRequest, signal
    },
      options);
    }



export const getUpdateOrgMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateOrg>>, TError,{id: string;data: UpdateOrgRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateOrg>>, TError,{id: string;data: UpdateOrgRequest}, TContext> => {

const mutationKey = ['updateOrg'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateOrg>>, {id: string;data: UpdateOrgRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateOrg(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateOrgMutationResult = NonNullable<Awaited<ReturnType<typeof updateOrg>>>
    export type UpdateOrgMutationBody = UpdateOrgRequest
    export type UpdateOrgMutationError = ErrorBody

    export const useUpdateOrg = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateOrg>>, TError,{id: string;data: UpdateOrgRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateOrg>>,
        TError,
        {id: string;data: UpdateOrgRequest},
        TContext
      > => {
      return useMutation(getUpdateOrgMutationOptions(options), queryClient);
    }

export const uploadOrgLogo = (
    id: string,
    uploadLogoMultipart: UploadLogoMultipart,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
formData.append(`logo`, uploadLogoMultipart.logo);

      return customInstance<Org>(
      {url: `/orgs/${id}/logo`, method: 'PUT',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }



export const getUploadOrgLogoMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof uploadOrgLogo>>, TError,{id: string;data: UploadLogoMultipart}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof uploadOrgLogo>>, TError,{id: string;data: UploadLogoMultipart}, TContext> => {

const mutationKey = ['uploadOrgLogo'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof uploadOrgLogo>>, {id: string;data: UploadLogoMultipart}> = (props) => {
          const {id,data} = props ?? {};

          return  uploadOrgLogo(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UploadOrgLogoMutationResult = NonNullable<Awaited<ReturnType<typeof uploadOrgLogo>>>
    export type UploadOrgLogoMutationBody = UploadLogoMultipart
    export type UploadOrgLogoMutationError = ErrorBody

    export const useUploadOrgLogo = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof uploadOrgLogo>>, TError,{id: string;data: UploadLogoMultipart}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof uploadOrgLogo>>,
        TError,
        {id: string;data: UploadLogoMultipart},
        TContext
      > => {
      return useMutation(getUploadOrgLogoMutationOptions(options), queryClient);
    }

export const getOnboarding = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OnboardingStatus>(
      {url: `/orgs/${id}/onboarding`, method: 'GET', signal
    },
      options);
    }




export const getGetOnboardingQueryKey = (id: string,) => {
    return [
    `/orgs/${id}/onboarding`
    ] as const;
    }


export const getGetOnboardingQueryOptions = <TData = Awaited<ReturnType<typeof getOnboarding>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOnboarding>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetOnboardingQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getOnboarding>>> = ({ signal }) => getOnboarding(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getOnboarding>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetOnboardingQueryResult = NonNullable<Awaited<ReturnType<typeof getOnboarding>>>
export type GetOnboardingQueryError = ErrorBody


export function useGetOnboarding<TData = Awaited<ReturnType<typeof getOnboarding>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOnboarding>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getOnboarding>>,
          TError,
          Awaited<ReturnType<typeof getOnboarding>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetOnboarding<TData = Awaited<ReturnType<typeof getOnboarding>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOnboarding>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getOnboarding>>,
          TError,
          Awaited<ReturnType<typeof getOnboarding>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetOnboarding<TData = Awaited<ReturnType<typeof getOnboarding>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOnboarding>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetOnboarding<TData = Awaited<ReturnType<typeof getOnboarding>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getOnboarding>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetOnboardingQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const completeOnboarding = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OnboardingStatus>(
      {url: `/orgs/${id}/onboarding/complete`, method: 'POST', signal
    },
      options);
    }



export const getCompleteOnboardingMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof completeOnboarding>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof completeOnboarding>>, TError,{id: string}, TContext> => {

const mutationKey = ['completeOnboarding'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof completeOnboarding>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  completeOnboarding(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CompleteOnboardingMutationResult = NonNullable<Awaited<ReturnType<typeof completeOnboarding>>>

    export type CompleteOnboardingMutationError = ErrorBody

    export const useCompleteOnboarding = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof completeOnboarding>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof completeOnboarding>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getCompleteOnboardingMutationOptions(options), queryClient);
    }

export const listPaymentMethods = (

 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgPaymentMethod[]>(
      {url: `/payment-methods`, method: 'GET', signal
    },
      options);
    }




export const getListPaymentMethodsQueryKey = () => {
    return [
    `/payment-methods`
    ] as const;
    }


export const getListPaymentMethodsQueryOptions = <TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorBody>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListPaymentMethodsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listPaymentMethods>>> = ({ signal }) => listPaymentMethods(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListPaymentMethodsQueryResult = NonNullable<Awaited<ReturnType<typeof listPaymentMethods>>>
export type ListPaymentMethodsQueryError = ErrorBody


export function useListPaymentMethods<TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorBody>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPaymentMethods>>,
          TError,
          Awaited<ReturnType<typeof listPaymentMethods>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPaymentMethods<TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPaymentMethods>>,
          TError,
          Awaited<ReturnType<typeof listPaymentMethods>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPaymentMethods<TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListPaymentMethods<TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListPaymentMethodsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createPaymentMethod = (
    createPaymentMethodRequest: CreatePaymentMethodRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgPaymentMethod>(
      {url: `/payment-methods`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createPaymentMethodRequest, signal
    },
      options);
    }



export const getCreatePaymentMethodMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createPaymentMethod>>, TError,{data: CreatePaymentMethodRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createPaymentMethod>>, TError,{data: CreatePaymentMethodRequest}, TContext> => {

const mutationKey = ['createPaymentMethod'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createPaymentMethod>>, {data: CreatePaymentMethodRequest}> = (props) => {
          const {data} = props ?? {};

          return  createPaymentMethod(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreatePaymentMethodMutationResult = NonNullable<Awaited<ReturnType<typeof createPaymentMethod>>>
    export type CreatePaymentMethodMutationBody = CreatePaymentMethodRequest
    export type CreatePaymentMethodMutationError = ErrorBody

    export const useCreatePaymentMethod = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createPaymentMethod>>, TError,{data: CreatePaymentMethodRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createPaymentMethod>>,
        TError,
        {data: CreatePaymentMethodRequest},
        TContext
      > => {
      return useMutation(getCreatePaymentMethodMutationOptions(options), queryClient);
    }

export const updatePaymentMethod = (
    id: string,
    updatePaymentMethodRequest: UpdatePaymentMethodRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgPaymentMethod>(
      {url: `/payment-methods/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updatePaymentMethodRequest, signal
    },
      options);
    }



export const getUpdatePaymentMethodMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updatePaymentMethod>>, TError,{id: string;data: UpdatePaymentMethodRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updatePaymentMethod>>, TError,{id: string;data: UpdatePaymentMethodRequest}, TContext> => {

const mutationKey = ['updatePaymentMethod'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updatePaymentMethod>>, {id: string;data: UpdatePaymentMethodRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updatePaymentMethod(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdatePaymentMethodMutationResult = NonNullable<Awaited<ReturnType<typeof updatePaymentMethod>>>
    export type UpdatePaymentMethodMutationBody = UpdatePaymentMethodRequest
    export type UpdatePaymentMethodMutationError = ErrorBody

    export const useUpdatePaymentMethod = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updatePaymentMethod>>, TError,{id: string;data: UpdatePaymentMethodRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updatePaymentMethod>>,
        TError,
        {id: string;data: UpdatePaymentMethodRequest},
        TContext
      > => {
      return useMutation(getUpdatePaymentMethodMutationOptions(options), queryClient);
    }

export const activatePaymentMethod = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgPaymentMethod>(
      {url: `/payment-methods/${id}/activate`, method: 'POST', signal
    },
      options);
    }



export const getActivatePaymentMethodMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof activatePaymentMethod>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof activatePaymentMethod>>, TError,{id: string}, TContext> => {

const mutationKey = ['activatePaymentMethod'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof activatePaymentMethod>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  activatePaymentMethod(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type ActivatePaymentMethodMutationResult = NonNullable<Awaited<ReturnType<typeof activatePaymentMethod>>>

    export type ActivatePaymentMethodMutationError = ErrorBody

    export const useActivatePaymentMethod = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof activatePaymentMethod>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof activatePaymentMethod>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getActivatePaymentMethodMutationOptions(options), queryClient);
    }

export const deactivatePaymentMethod = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgPaymentMethod>(
      {url: `/payment-methods/${id}/deactivate`, method: 'POST', signal
    },
      options);
    }



export const getDeactivatePaymentMethodMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deactivatePaymentMethod>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deactivatePaymentMethod>>, TError,{id: string}, TContext> => {

const mutationKey = ['deactivatePaymentMethod'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deactivatePaymentMethod>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deactivatePaymentMethod(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeactivatePaymentMethodMutationResult = NonNullable<Awaited<ReturnType<typeof deactivatePaymentMethod>>>

    export type DeactivatePaymentMethodMutationError = ErrorBody

    export const useDeactivatePaymentMethod = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deactivatePaymentMethod>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deactivatePaymentMethod>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeactivatePaymentMethodMutationOptions(options), queryClient);
    }

export const getPermissionMatrix = (
    userId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PermissionMatrix[]>(
      {url: `/permissions/matrix/${userId}`, method: 'GET', signal
    },
      options);
    }




export const getGetPermissionMatrixQueryKey = (userId: string,) => {
    return [
    `/permissions/matrix/${userId}`
    ] as const;
    }


export const getGetPermissionMatrixQueryOptions = <TData = Awaited<ReturnType<typeof getPermissionMatrix>>, TError = ErrorBody>(userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionMatrix>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPermissionMatrixQueryKey(userId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPermissionMatrix>>> = ({ signal }) => getPermissionMatrix(userId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: userId !== null && userId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPermissionMatrix>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPermissionMatrixQueryResult = NonNullable<Awaited<ReturnType<typeof getPermissionMatrix>>>
export type GetPermissionMatrixQueryError = ErrorBody


export function useGetPermissionMatrix<TData = Awaited<ReturnType<typeof getPermissionMatrix>>, TError = ErrorBody>(
 userId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionMatrix>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPermissionMatrix>>,
          TError,
          Awaited<ReturnType<typeof getPermissionMatrix>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPermissionMatrix<TData = Awaited<ReturnType<typeof getPermissionMatrix>>, TError = ErrorBody>(
 userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionMatrix>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPermissionMatrix>>,
          TError,
          Awaited<ReturnType<typeof getPermissionMatrix>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPermissionMatrix<TData = Awaited<ReturnType<typeof getPermissionMatrix>>, TError = ErrorBody>(
 userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionMatrix>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetPermissionMatrix<TData = Awaited<ReturnType<typeof getPermissionMatrix>>, TError = ErrorBody>(
 userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionMatrix>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPermissionMatrixQueryOptions(userId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getRolePermissions = (

 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<RolePermission[]>(
      {url: `/permissions/roles`, method: 'GET', signal
    },
      options);
    }




export const getGetRolePermissionsQueryKey = () => {
    return [
    `/permissions/roles`
    ] as const;
    }


export const getGetRolePermissionsQueryOptions = <TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorBody>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRolePermissionsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRolePermissions>>> = ({ signal }) => getRolePermissions(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRolePermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getRolePermissions>>>
export type GetRolePermissionsQueryError = ErrorBody


export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorBody>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRolePermissions>>,
          TError,
          Awaited<ReturnType<typeof getRolePermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRolePermissions>>,
          TError,
          Awaited<ReturnType<typeof getRolePermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRolePermissionsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const upsertRolePermission = (
    upsertRolePermissionRequest: UpsertRolePermissionRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<RolePermission>(
      {url: `/permissions/roles`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: upsertRolePermissionRequest, signal
    },
      options);
    }



export const getUpsertRolePermissionMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertRolePermission>>, TError,{data: UpsertRolePermissionRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof upsertRolePermission>>, TError,{data: UpsertRolePermissionRequest}, TContext> => {

const mutationKey = ['upsertRolePermission'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof upsertRolePermission>>, {data: UpsertRolePermissionRequest}> = (props) => {
          const {data} = props ?? {};

          return  upsertRolePermission(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpsertRolePermissionMutationResult = NonNullable<Awaited<ReturnType<typeof upsertRolePermission>>>
    export type UpsertRolePermissionMutationBody = UpsertRolePermissionRequest
    export type UpsertRolePermissionMutationError = ErrorBody

    export const useUpsertRolePermission = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertRolePermission>>, TError,{data: UpsertRolePermissionRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof upsertRolePermission>>,
        TError,
        {data: UpsertRolePermissionRequest},
        TContext
      > => {
      return useMutation(getUpsertRolePermissionMutationOptions(options), queryClient);
    }

export const getUserPermissions = (
    userId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Permission[]>(
      {url: `/permissions/user/${userId}`, method: 'GET', signal
    },
      options);
    }




export const getGetUserPermissionsQueryKey = (userId: string,) => {
    return [
    `/permissions/user/${userId}`
    ] as const;
    }


export const getGetUserPermissionsQueryOptions = <TData = Awaited<ReturnType<typeof getUserPermissions>>, TError = ErrorBody>(userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserPermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetUserPermissionsQueryKey(userId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserPermissions>>> = ({ signal }) => getUserPermissions(userId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: userId !== null && userId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getUserPermissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetUserPermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getUserPermissions>>>
export type GetUserPermissionsQueryError = ErrorBody


export function useGetUserPermissions<TData = Awaited<ReturnType<typeof getUserPermissions>>, TError = ErrorBody>(
 userId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserPermissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserPermissions>>,
          TError,
          Awaited<ReturnType<typeof getUserPermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserPermissions<TData = Awaited<ReturnType<typeof getUserPermissions>>, TError = ErrorBody>(
 userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserPermissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserPermissions>>,
          TError,
          Awaited<ReturnType<typeof getUserPermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserPermissions<TData = Awaited<ReturnType<typeof getUserPermissions>>, TError = ErrorBody>(
 userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserPermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetUserPermissions<TData = Awaited<ReturnType<typeof getUserPermissions>>, TError = ErrorBody>(
 userId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserPermissions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetUserPermissionsQueryOptions(userId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const upsertUserPermission = (
    userId: string,
    upsertPermissionRequest: UpsertPermissionRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Permission>(
      {url: `/permissions/user/${userId}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: upsertPermissionRequest, signal
    },
      options);
    }



export const getUpsertUserPermissionMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertUserPermission>>, TError,{userId: string;data: UpsertPermissionRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof upsertUserPermission>>, TError,{userId: string;data: UpsertPermissionRequest}, TContext> => {

const mutationKey = ['upsertUserPermission'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof upsertUserPermission>>, {userId: string;data: UpsertPermissionRequest}> = (props) => {
          const {userId,data} = props ?? {};

          return  upsertUserPermission(userId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpsertUserPermissionMutationResult = NonNullable<Awaited<ReturnType<typeof upsertUserPermission>>>
    export type UpsertUserPermissionMutationBody = UpsertPermissionRequest
    export type UpsertUserPermissionMutationError = ErrorBody

    export const useUpsertUserPermission = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertUserPermission>>, TError,{userId: string;data: UpsertPermissionRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof upsertUserPermission>>,
        TError,
        {userId: string;data: UpsertPermissionRequest},
        TContext
      > => {
      return useMutation(getUpsertUserPermissionMutationOptions(options), queryClient);
    }

export const deleteUserPermission = (
    userId: string,
    resource: string,
    action: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/permissions/user/${userId}/${resource}/${action}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteUserPermissionMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteUserPermission>>, TError,{userId: string;resource: string;action: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteUserPermission>>, TError,{userId: string;resource: string;action: string}, TContext> => {

const mutationKey = ['deleteUserPermission'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteUserPermission>>, {userId: string;resource: string;action: string}> = (props) => {
          const {userId,resource,action} = props ?? {};

          return  deleteUserPermission(userId,resource,action,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteUserPermissionMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUserPermission>>>

    export type DeleteUserPermissionMutationError = ErrorBody

    export const useDeleteUserPermission = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteUserPermission>>, TError,{userId: string;resource: string;action: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteUserPermission>>,
        TError,
        {userId: string;resource: string;action: string},
        TContext
      > => {
      return useMutation(getDeleteUserPermissionMutationOptions(options), queryClient);
    }

export const listPublicOrgs = (

 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PublicOrg[]>(
      {url: `/public/orgs`, method: 'GET', signal
    },
      options);
    }




export const getListPublicOrgsQueryKey = () => {
    return [
    `/public/orgs`
    ] as const;
    }


export const getListPublicOrgsQueryOptions = <TData = Awaited<ReturnType<typeof listPublicOrgs>>, TError = ErrorBody>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPublicOrgs>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListPublicOrgsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listPublicOrgs>>> = ({ signal }) => listPublicOrgs(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listPublicOrgs>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListPublicOrgsQueryResult = NonNullable<Awaited<ReturnType<typeof listPublicOrgs>>>
export type ListPublicOrgsQueryError = ErrorBody


export function useListPublicOrgs<TData = Awaited<ReturnType<typeof listPublicOrgs>>, TError = ErrorBody>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPublicOrgs>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPublicOrgs>>,
          TError,
          Awaited<ReturnType<typeof listPublicOrgs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPublicOrgs<TData = Awaited<ReturnType<typeof listPublicOrgs>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPublicOrgs>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPublicOrgs>>,
          TError,
          Awaited<ReturnType<typeof listPublicOrgs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPublicOrgs<TData = Awaited<ReturnType<typeof listPublicOrgs>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPublicOrgs>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListPublicOrgs<TData = Awaited<ReturnType<typeof listPublicOrgs>>, TError = ErrorBody>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPublicOrgs>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListPublicOrgsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listPurchaseOrders = (
    branchId: string,
    params?: ListPurchaseOrdersParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PurchaseOrder[]>(
      {url: `/purchasing/branches/${branchId}/orders`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListPurchaseOrdersQueryKey = (branchId: string,
    params?: ListPurchaseOrdersParams,) => {
    return [
    `/purchasing/branches/${branchId}/orders`, ...(params ? [params] : [])
    ] as const;
    }


export const getListPurchaseOrdersQueryOptions = <TData = Awaited<ReturnType<typeof listPurchaseOrders>>, TError = ErrorBody>(branchId: string,
    params?: ListPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListPurchaseOrdersQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listPurchaseOrders>>> = ({ signal }) => listPurchaseOrders(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListPurchaseOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listPurchaseOrders>>>
export type ListPurchaseOrdersQueryError = ErrorBody


export function useListPurchaseOrders<TData = Awaited<ReturnType<typeof listPurchaseOrders>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  ListPurchaseOrdersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPurchaseOrders>>,
          TError,
          Awaited<ReturnType<typeof listPurchaseOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPurchaseOrders<TData = Awaited<ReturnType<typeof listPurchaseOrders>>, TError = ErrorBody>(
 branchId: string,
    params?: ListPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listPurchaseOrders>>,
          TError,
          Awaited<ReturnType<typeof listPurchaseOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListPurchaseOrders<TData = Awaited<ReturnType<typeof listPurchaseOrders>>, TError = ErrorBody>(
 branchId: string,
    params?: ListPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListPurchaseOrders<TData = Awaited<ReturnType<typeof listPurchaseOrders>>, TError = ErrorBody>(
 branchId: string,
    params?: ListPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListPurchaseOrdersQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createPurchaseOrder = (
    branchId: string,
    createPurchaseOrderRequest: CreatePurchaseOrderRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PurchaseOrderFull>(
      {url: `/purchasing/branches/${branchId}/orders`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createPurchaseOrderRequest, signal
    },
      options);
    }



export const getCreatePurchaseOrderMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createPurchaseOrder>>, TError,{branchId: string;data: CreatePurchaseOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createPurchaseOrder>>, TError,{branchId: string;data: CreatePurchaseOrderRequest}, TContext> => {

const mutationKey = ['createPurchaseOrder'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createPurchaseOrder>>, {branchId: string;data: CreatePurchaseOrderRequest}> = (props) => {
          const {branchId,data} = props ?? {};

          return  createPurchaseOrder(branchId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreatePurchaseOrderMutationResult = NonNullable<Awaited<ReturnType<typeof createPurchaseOrder>>>
    export type CreatePurchaseOrderMutationBody = CreatePurchaseOrderRequest
    export type CreatePurchaseOrderMutationError = ErrorBody

    export const useCreatePurchaseOrder = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createPurchaseOrder>>, TError,{branchId: string;data: CreatePurchaseOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createPurchaseOrder>>,
        TError,
        {branchId: string;data: CreatePurchaseOrderRequest},
        TContext
      > => {
      return useMutation(getCreatePurchaseOrderMutationOptions(options), queryClient);
    }

export const getPurchaseOrder = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PurchaseOrderFull>(
      {url: `/purchasing/orders/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetPurchaseOrderQueryKey = (id: string,) => {
    return [
    `/purchasing/orders/${id}`
    ] as const;
    }


export const getGetPurchaseOrderQueryOptions = <TData = Awaited<ReturnType<typeof getPurchaseOrder>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPurchaseOrderQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPurchaseOrder>>> = ({ signal }) => getPurchaseOrder(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPurchaseOrderQueryResult = NonNullable<Awaited<ReturnType<typeof getPurchaseOrder>>>
export type GetPurchaseOrderQueryError = ErrorBody


export function useGetPurchaseOrder<TData = Awaited<ReturnType<typeof getPurchaseOrder>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPurchaseOrder>>,
          TError,
          Awaited<ReturnType<typeof getPurchaseOrder>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPurchaseOrder<TData = Awaited<ReturnType<typeof getPurchaseOrder>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPurchaseOrder>>,
          TError,
          Awaited<ReturnType<typeof getPurchaseOrder>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPurchaseOrder<TData = Awaited<ReturnType<typeof getPurchaseOrder>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetPurchaseOrder<TData = Awaited<ReturnType<typeof getPurchaseOrder>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPurchaseOrderQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const cancelPurchaseOrder = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PurchaseOrder>(
      {url: `/purchasing/orders/${id}/cancel`, method: 'POST', signal
    },
      options);
    }



export const getCancelPurchaseOrderMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelPurchaseOrder>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof cancelPurchaseOrder>>, TError,{id: string}, TContext> => {

const mutationKey = ['cancelPurchaseOrder'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof cancelPurchaseOrder>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  cancelPurchaseOrder(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CancelPurchaseOrderMutationResult = NonNullable<Awaited<ReturnType<typeof cancelPurchaseOrder>>>

    export type CancelPurchaseOrderMutationError = ErrorBody

    export const useCancelPurchaseOrder = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelPurchaseOrder>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof cancelPurchaseOrder>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getCancelPurchaseOrderMutationOptions(options), queryClient);
    }

export const receivePurchaseOrder = (
    id: string,
    receivePurchaseOrderRequest: ReceivePurchaseOrderRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PurchaseOrderFull>(
      {url: `/purchasing/orders/${id}/receive`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: receivePurchaseOrderRequest, signal
    },
      options);
    }



export const getReceivePurchaseOrderMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof receivePurchaseOrder>>, TError,{id: string;data: ReceivePurchaseOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof receivePurchaseOrder>>, TError,{id: string;data: ReceivePurchaseOrderRequest}, TContext> => {

const mutationKey = ['receivePurchaseOrder'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof receivePurchaseOrder>>, {id: string;data: ReceivePurchaseOrderRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  receivePurchaseOrder(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type ReceivePurchaseOrderMutationResult = NonNullable<Awaited<ReturnType<typeof receivePurchaseOrder>>>
    export type ReceivePurchaseOrderMutationBody = ReceivePurchaseOrderRequest
    export type ReceivePurchaseOrderMutationError = ErrorBody

    export const useReceivePurchaseOrder = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof receivePurchaseOrder>>, TError,{id: string;data: ReceivePurchaseOrderRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof receivePurchaseOrder>>,
        TError,
        {id: string;data: ReceivePurchaseOrderRequest},
        TContext
      > => {
      return useMutation(getReceivePurchaseOrderMutationOptions(options), queryClient);
    }

export const listOrgPurchaseOrders = (
    orgId: string,
    params?: ListOrgPurchaseOrdersParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<PurchaseOrder[]>(
      {url: `/purchasing/orgs/${orgId}/orders`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListOrgPurchaseOrdersQueryKey = (orgId: string,
    params?: ListOrgPurchaseOrdersParams,) => {
    return [
    `/purchasing/orgs/${orgId}/orders`, ...(params ? [params] : [])
    ] as const;
    }


export const getListOrgPurchaseOrdersQueryOptions = <TData = Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError = ErrorBody>(orgId: string,
    params?: ListOrgPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListOrgPurchaseOrdersQueryKey(orgId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listOrgPurchaseOrders>>> = ({ signal }) => listOrgPurchaseOrders(orgId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListOrgPurchaseOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listOrgPurchaseOrders>>>
export type ListOrgPurchaseOrdersQueryError = ErrorBody


export function useListOrgPurchaseOrders<TData = Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError = ErrorBody>(
 orgId: string,
    params: undefined |  ListOrgPurchaseOrdersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOrgPurchaseOrders>>,
          TError,
          Awaited<ReturnType<typeof listOrgPurchaseOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOrgPurchaseOrders<TData = Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError = ErrorBody>(
 orgId: string,
    params?: ListOrgPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listOrgPurchaseOrders>>,
          TError,
          Awaited<ReturnType<typeof listOrgPurchaseOrders>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListOrgPurchaseOrders<TData = Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError = ErrorBody>(
 orgId: string,
    params?: ListOrgPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListOrgPurchaseOrders<TData = Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError = ErrorBody>(
 orgId: string,
    params?: ListOrgPurchaseOrdersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrgPurchaseOrders>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListOrgPurchaseOrdersQueryOptions(orgId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listSuppliers = (
    orgId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Supplier[]>(
      {url: `/purchasing/orgs/${orgId}/suppliers`, method: 'GET', signal
    },
      options);
    }




export const getListSuppliersQueryKey = (orgId: string,) => {
    return [
    `/purchasing/orgs/${orgId}/suppliers`
    ] as const;
    }


export const getListSuppliersQueryOptions = <TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorBody>(orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListSuppliersQueryKey(orgId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listSuppliers>>> = ({ signal }) => listSuppliers(orgId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListSuppliersQueryResult = NonNullable<Awaited<ReturnType<typeof listSuppliers>>>
export type ListSuppliersQueryError = ErrorBody


export function useListSuppliers<TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorBody>(
 orgId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSuppliers>>,
          TError,
          Awaited<ReturnType<typeof listSuppliers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSuppliers<TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSuppliers>>,
          TError,
          Awaited<ReturnType<typeof listSuppliers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSuppliers<TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListSuppliers<TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListSuppliersQueryOptions(orgId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createSupplier = (
    orgId: string,
    createSupplierRequest: CreateSupplierRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Supplier>(
      {url: `/purchasing/orgs/${orgId}/suppliers`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createSupplierRequest, signal
    },
      options);
    }



export const getCreateSupplierMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError,{orgId: string;data: CreateSupplierRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError,{orgId: string;data: CreateSupplierRequest}, TContext> => {

const mutationKey = ['createSupplier'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createSupplier>>, {orgId: string;data: CreateSupplierRequest}> = (props) => {
          const {orgId,data} = props ?? {};

          return  createSupplier(orgId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof createSupplier>>>
    export type CreateSupplierMutationBody = CreateSupplierRequest
    export type CreateSupplierMutationError = ErrorBody

    export const useCreateSupplier = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError,{orgId: string;data: CreateSupplierRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createSupplier>>,
        TError,
        {orgId: string;data: CreateSupplierRequest},
        TContext
      > => {
      return useMutation(getCreateSupplierMutationOptions(options), queryClient);
    }

export const deleteSupplier = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/purchasing/suppliers/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteSupplierMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteSupplier'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteSupplier>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteSupplier(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSupplier>>>

    export type DeleteSupplierMutationError = ErrorBody

    export const useDeleteSupplier = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteSupplier>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteSupplierMutationOptions(options), queryClient);
    }

export const updateSupplier = (
    id: string,
    updateSupplierRequest: UpdateSupplierRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Supplier>(
      {url: `/purchasing/suppliers/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateSupplierRequest, signal
    },
      options);
    }



export const getUpdateSupplierMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError,{id: string;data: UpdateSupplierRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError,{id: string;data: UpdateSupplierRequest}, TContext> => {

const mutationKey = ['updateSupplier'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateSupplier>>, {id: string;data: UpdateSupplierRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateSupplier(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof updateSupplier>>>
    export type UpdateSupplierMutationBody = UpdateSupplierRequest
    export type UpdateSupplierMutationError = ErrorBody

    export const useUpdateSupplier = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError,{id: string;data: UpdateSupplierRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateSupplier>>,
        TError,
        {id: string;data: UpdateSupplierRequest},
        TContext
      > => {
      return useMutation(getUpdateSupplierMutationOptions(options), queryClient);
    }

export const listAddonIngredients = (
    addonItemId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonIngredient[]>(
      {url: `/recipes/addons/${addonItemId}`, method: 'GET', signal
    },
      options);
    }




export const getListAddonIngredientsQueryKey = (addonItemId: string,) => {
    return [
    `/recipes/addons/${addonItemId}`
    ] as const;
    }


export const getListAddonIngredientsQueryOptions = <TData = Awaited<ReturnType<typeof listAddonIngredients>>, TError = ErrorBody>(addonItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonIngredients>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAddonIngredientsQueryKey(addonItemId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAddonIngredients>>> = ({ signal }) => listAddonIngredients(addonItemId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: addonItemId !== null && addonItemId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAddonIngredients>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListAddonIngredientsQueryResult = NonNullable<Awaited<ReturnType<typeof listAddonIngredients>>>
export type ListAddonIngredientsQueryError = ErrorBody


export function useListAddonIngredients<TData = Awaited<ReturnType<typeof listAddonIngredients>>, TError = ErrorBody>(
 addonItemId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonIngredients>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonIngredients>>,
          TError,
          Awaited<ReturnType<typeof listAddonIngredients>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonIngredients<TData = Awaited<ReturnType<typeof listAddonIngredients>>, TError = ErrorBody>(
 addonItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonIngredients>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAddonIngredients>>,
          TError,
          Awaited<ReturnType<typeof listAddonIngredients>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAddonIngredients<TData = Awaited<ReturnType<typeof listAddonIngredients>>, TError = ErrorBody>(
 addonItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonIngredients>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListAddonIngredients<TData = Awaited<ReturnType<typeof listAddonIngredients>>, TError = ErrorBody>(
 addonItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAddonIngredients>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListAddonIngredientsQueryOptions(addonItemId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const upsertAddonIngredient = (
    addonItemId: string,
    upsertAddonIngredientRequest: UpsertAddonIngredientRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonIngredient>(
      {url: `/recipes/addons/${addonItemId}`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: upsertAddonIngredientRequest, signal
    },
      options);
    }



export const getUpsertAddonIngredientMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertAddonIngredient>>, TError,{addonItemId: string;data: UpsertAddonIngredientRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof upsertAddonIngredient>>, TError,{addonItemId: string;data: UpsertAddonIngredientRequest}, TContext> => {

const mutationKey = ['upsertAddonIngredient'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof upsertAddonIngredient>>, {addonItemId: string;data: UpsertAddonIngredientRequest}> = (props) => {
          const {addonItemId,data} = props ?? {};

          return  upsertAddonIngredient(addonItemId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpsertAddonIngredientMutationResult = NonNullable<Awaited<ReturnType<typeof upsertAddonIngredient>>>
    export type UpsertAddonIngredientMutationBody = UpsertAddonIngredientRequest
    export type UpsertAddonIngredientMutationError = ErrorBody

    export const useUpsertAddonIngredient = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertAddonIngredient>>, TError,{addonItemId: string;data: UpsertAddonIngredientRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof upsertAddonIngredient>>,
        TError,
        {addonItemId: string;data: UpsertAddonIngredientRequest},
        TContext
      > => {
      return useMutation(getUpsertAddonIngredientMutationOptions(options), queryClient);
    }

export const deleteAddonIngredient = (
    addonItemId: string,
    params: DeleteAddonIngredientParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/recipes/addons/${addonItemId}`, method: 'DELETE',
        params, signal
    },
      options);
    }



export const getDeleteAddonIngredientMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonIngredient>>, TError,{addonItemId: string;params: DeleteAddonIngredientParams}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteAddonIngredient>>, TError,{addonItemId: string;params: DeleteAddonIngredientParams}, TContext> => {

const mutationKey = ['deleteAddonIngredient'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteAddonIngredient>>, {addonItemId: string;params: DeleteAddonIngredientParams}> = (props) => {
          const {addonItemId,params} = props ?? {};

          return  deleteAddonIngredient(addonItemId,params,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteAddonIngredientMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAddonIngredient>>>

    export type DeleteAddonIngredientMutationError = ErrorBody

    export const useDeleteAddonIngredient = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteAddonIngredient>>, TError,{addonItemId: string;params: DeleteAddonIngredientParams}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteAddonIngredient>>,
        TError,
        {addonItemId: string;params: DeleteAddonIngredientParams},
        TContext
      > => {
      return useMutation(getDeleteAddonIngredientMutationOptions(options), queryClient);
    }

export const listDrinkRecipes = (
    menuItemId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<DrinkRecipe[]>(
      {url: `/recipes/drinks/${menuItemId}`, method: 'GET', signal
    },
      options);
    }




export const getListDrinkRecipesQueryKey = (menuItemId: string,) => {
    return [
    `/recipes/drinks/${menuItemId}`
    ] as const;
    }


export const getListDrinkRecipesQueryOptions = <TData = Awaited<ReturnType<typeof listDrinkRecipes>>, TError = ErrorBody>(menuItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDrinkRecipes>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListDrinkRecipesQueryKey(menuItemId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listDrinkRecipes>>> = ({ signal }) => listDrinkRecipes(menuItemId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: menuItemId !== null && menuItemId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listDrinkRecipes>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListDrinkRecipesQueryResult = NonNullable<Awaited<ReturnType<typeof listDrinkRecipes>>>
export type ListDrinkRecipesQueryError = ErrorBody


export function useListDrinkRecipes<TData = Awaited<ReturnType<typeof listDrinkRecipes>>, TError = ErrorBody>(
 menuItemId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDrinkRecipes>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listDrinkRecipes>>,
          TError,
          Awaited<ReturnType<typeof listDrinkRecipes>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListDrinkRecipes<TData = Awaited<ReturnType<typeof listDrinkRecipes>>, TError = ErrorBody>(
 menuItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDrinkRecipes>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listDrinkRecipes>>,
          TError,
          Awaited<ReturnType<typeof listDrinkRecipes>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListDrinkRecipes<TData = Awaited<ReturnType<typeof listDrinkRecipes>>, TError = ErrorBody>(
 menuItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDrinkRecipes>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListDrinkRecipes<TData = Awaited<ReturnType<typeof listDrinkRecipes>>, TError = ErrorBody>(
 menuItemId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listDrinkRecipes>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListDrinkRecipesQueryOptions(menuItemId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const upsertDrinkRecipe = (
    menuItemId: string,
    upsertDrinkRecipeRequest: UpsertDrinkRecipeRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<DrinkRecipe>(
      {url: `/recipes/drinks/${menuItemId}`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: upsertDrinkRecipeRequest, signal
    },
      options);
    }



export const getUpsertDrinkRecipeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertDrinkRecipe>>, TError,{menuItemId: string;data: UpsertDrinkRecipeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof upsertDrinkRecipe>>, TError,{menuItemId: string;data: UpsertDrinkRecipeRequest}, TContext> => {

const mutationKey = ['upsertDrinkRecipe'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof upsertDrinkRecipe>>, {menuItemId: string;data: UpsertDrinkRecipeRequest}> = (props) => {
          const {menuItemId,data} = props ?? {};

          return  upsertDrinkRecipe(menuItemId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpsertDrinkRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof upsertDrinkRecipe>>>
    export type UpsertDrinkRecipeMutationBody = UpsertDrinkRecipeRequest
    export type UpsertDrinkRecipeMutationError = ErrorBody

    export const useUpsertDrinkRecipe = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertDrinkRecipe>>, TError,{menuItemId: string;data: UpsertDrinkRecipeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof upsertDrinkRecipe>>,
        TError,
        {menuItemId: string;data: UpsertDrinkRecipeRequest},
        TContext
      > => {
      return useMutation(getUpsertDrinkRecipeMutationOptions(options), queryClient);
    }

export const deleteDrinkRecipe = (
    menuItemId: string,
    size: string,
    params: DeleteDrinkRecipeParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/recipes/drinks/${menuItemId}/${size}`, method: 'DELETE',
        params, signal
    },
      options);
    }



export const getDeleteDrinkRecipeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteDrinkRecipe>>, TError,{menuItemId: string;size: string;params: DeleteDrinkRecipeParams}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteDrinkRecipe>>, TError,{menuItemId: string;size: string;params: DeleteDrinkRecipeParams}, TContext> => {

const mutationKey = ['deleteDrinkRecipe'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteDrinkRecipe>>, {menuItemId: string;size: string;params: DeleteDrinkRecipeParams}> = (props) => {
          const {menuItemId,size,params} = props ?? {};

          return  deleteDrinkRecipe(menuItemId,size,params,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteDrinkRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDrinkRecipe>>>

    export type DeleteDrinkRecipeMutationError = ErrorBody

    export const useDeleteDrinkRecipe = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteDrinkRecipe>>, TError,{menuItemId: string;size: string;params: DeleteDrinkRecipeParams}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteDrinkRecipe>>,
        TError,
        {menuItemId: string;size: string;params: DeleteDrinkRecipeParams},
        TContext
      > => {
      return useMutation(getDeleteDrinkRecipeMutationOptions(options), queryClient);
    }

export const branchAddonSales = (
    branchId: string,
    params?: BranchAddonSalesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<AddonSalesRow[]>(
      {url: `/reports/branches/${branchId}/addons`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchAddonSalesQueryKey = (branchId: string,
    params?: BranchAddonSalesParams,) => {
    return [
    `/reports/branches/${branchId}/addons`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchAddonSalesQueryOptions = <TData = Awaited<ReturnType<typeof branchAddonSales>>, TError = ErrorBody>(branchId: string,
    params?: BranchAddonSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchAddonSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchAddonSalesQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchAddonSales>>> = ({ signal }) => branchAddonSales(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchAddonSales>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchAddonSalesQueryResult = NonNullable<Awaited<ReturnType<typeof branchAddonSales>>>
export type BranchAddonSalesQueryError = ErrorBody


export function useBranchAddonSales<TData = Awaited<ReturnType<typeof branchAddonSales>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchAddonSalesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchAddonSales>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchAddonSales>>,
          TError,
          Awaited<ReturnType<typeof branchAddonSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchAddonSales<TData = Awaited<ReturnType<typeof branchAddonSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchAddonSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchAddonSales>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchAddonSales>>,
          TError,
          Awaited<ReturnType<typeof branchAddonSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchAddonSales<TData = Awaited<ReturnType<typeof branchAddonSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchAddonSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchAddonSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchAddonSales<TData = Awaited<ReturnType<typeof branchAddonSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchAddonSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchAddonSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchAddonSalesQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchBundleSales = (
    branchId: string,
    params?: BranchBundleSalesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BundleSalesRow[]>(
      {url: `/reports/branches/${branchId}/bundles`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchBundleSalesQueryKey = (branchId: string,
    params?: BranchBundleSalesParams,) => {
    return [
    `/reports/branches/${branchId}/bundles`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchBundleSalesQueryOptions = <TData = Awaited<ReturnType<typeof branchBundleSales>>, TError = ErrorBody>(branchId: string,
    params?: BranchBundleSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchBundleSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchBundleSalesQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchBundleSales>>> = ({ signal }) => branchBundleSales(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchBundleSales>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchBundleSalesQueryResult = NonNullable<Awaited<ReturnType<typeof branchBundleSales>>>
export type BranchBundleSalesQueryError = ErrorBody


export function useBranchBundleSales<TData = Awaited<ReturnType<typeof branchBundleSales>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchBundleSalesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchBundleSales>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchBundleSales>>,
          TError,
          Awaited<ReturnType<typeof branchBundleSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchBundleSales<TData = Awaited<ReturnType<typeof branchBundleSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchBundleSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchBundleSales>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchBundleSales>>,
          TError,
          Awaited<ReturnType<typeof branchBundleSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchBundleSales<TData = Awaited<ReturnType<typeof branchBundleSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchBundleSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchBundleSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchBundleSales<TData = Awaited<ReturnType<typeof branchBundleSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchBundleSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchBundleSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchBundleSalesQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchConsumption = (
    branchId: string,
    params?: BranchConsumptionParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ConsumptionRow[]>(
      {url: `/reports/branches/${branchId}/consumption`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchConsumptionQueryKey = (branchId: string,
    params?: BranchConsumptionParams,) => {
    return [
    `/reports/branches/${branchId}/consumption`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchConsumptionQueryOptions = <TData = Awaited<ReturnType<typeof branchConsumption>>, TError = ErrorBody>(branchId: string,
    params?: BranchConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchConsumption>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchConsumptionQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchConsumption>>> = ({ signal }) => branchConsumption(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchConsumption>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchConsumptionQueryResult = NonNullable<Awaited<ReturnType<typeof branchConsumption>>>
export type BranchConsumptionQueryError = ErrorBody


export function useBranchConsumption<TData = Awaited<ReturnType<typeof branchConsumption>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchConsumptionParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchConsumption>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchConsumption>>,
          TError,
          Awaited<ReturnType<typeof branchConsumption>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchConsumption<TData = Awaited<ReturnType<typeof branchConsumption>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchConsumption>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchConsumption>>,
          TError,
          Awaited<ReturnType<typeof branchConsumption>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchConsumption<TData = Awaited<ReturnType<typeof branchConsumption>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchConsumption>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchConsumption<TData = Awaited<ReturnType<typeof branchConsumption>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchConsumption>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchConsumptionQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchInventoryValuation = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<InventoryValuationReport>(
      {url: `/reports/branches/${branchId}/inventory-valuation`, method: 'GET', signal
    },
      options);
    }




export const getBranchInventoryValuationQueryKey = (branchId: string,) => {
    return [
    `/reports/branches/${branchId}/inventory-valuation`
    ] as const;
    }


export const getBranchInventoryValuationQueryOptions = <TData = Awaited<ReturnType<typeof branchInventoryValuation>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchInventoryValuation>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchInventoryValuationQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchInventoryValuation>>> = ({ signal }) => branchInventoryValuation(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchInventoryValuation>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchInventoryValuationQueryResult = NonNullable<Awaited<ReturnType<typeof branchInventoryValuation>>>
export type BranchInventoryValuationQueryError = ErrorBody


export function useBranchInventoryValuation<TData = Awaited<ReturnType<typeof branchInventoryValuation>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchInventoryValuation>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchInventoryValuation>>,
          TError,
          Awaited<ReturnType<typeof branchInventoryValuation>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchInventoryValuation<TData = Awaited<ReturnType<typeof branchInventoryValuation>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchInventoryValuation>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchInventoryValuation>>,
          TError,
          Awaited<ReturnType<typeof branchInventoryValuation>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchInventoryValuation<TData = Awaited<ReturnType<typeof branchInventoryValuation>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchInventoryValuation>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchInventoryValuation<TData = Awaited<ReturnType<typeof branchInventoryValuation>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchInventoryValuation>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchInventoryValuationQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchCombinedItemSales = (
    branchId: string,
    params?: BranchCombinedItemSalesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<CombinedItemSalesRow[]>(
      {url: `/reports/branches/${branchId}/items-combined`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchCombinedItemSalesQueryKey = (branchId: string,
    params?: BranchCombinedItemSalesParams,) => {
    return [
    `/reports/branches/${branchId}/items-combined`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchCombinedItemSalesQueryOptions = <TData = Awaited<ReturnType<typeof branchCombinedItemSales>>, TError = ErrorBody>(branchId: string,
    params?: BranchCombinedItemSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchCombinedItemSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchCombinedItemSalesQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchCombinedItemSales>>> = ({ signal }) => branchCombinedItemSales(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchCombinedItemSales>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchCombinedItemSalesQueryResult = NonNullable<Awaited<ReturnType<typeof branchCombinedItemSales>>>
export type BranchCombinedItemSalesQueryError = ErrorBody


export function useBranchCombinedItemSales<TData = Awaited<ReturnType<typeof branchCombinedItemSales>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchCombinedItemSalesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchCombinedItemSales>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchCombinedItemSales>>,
          TError,
          Awaited<ReturnType<typeof branchCombinedItemSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchCombinedItemSales<TData = Awaited<ReturnType<typeof branchCombinedItemSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchCombinedItemSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchCombinedItemSales>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchCombinedItemSales>>,
          TError,
          Awaited<ReturnType<typeof branchCombinedItemSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchCombinedItemSales<TData = Awaited<ReturnType<typeof branchCombinedItemSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchCombinedItemSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchCombinedItemSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchCombinedItemSales<TData = Awaited<ReturnType<typeof branchCombinedItemSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchCombinedItemSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchCombinedItemSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchCombinedItemSalesQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchLowStock = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<LowStockRow[]>(
      {url: `/reports/branches/${branchId}/low-stock`, method: 'GET', signal
    },
      options);
    }




export const getBranchLowStockQueryKey = (branchId: string,) => {
    return [
    `/reports/branches/${branchId}/low-stock`
    ] as const;
    }


export const getBranchLowStockQueryOptions = <TData = Awaited<ReturnType<typeof branchLowStock>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchLowStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchLowStockQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchLowStock>>> = ({ signal }) => branchLowStock(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchLowStock>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchLowStockQueryResult = NonNullable<Awaited<ReturnType<typeof branchLowStock>>>
export type BranchLowStockQueryError = ErrorBody


export function useBranchLowStock<TData = Awaited<ReturnType<typeof branchLowStock>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchLowStock>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchLowStock>>,
          TError,
          Awaited<ReturnType<typeof branchLowStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchLowStock<TData = Awaited<ReturnType<typeof branchLowStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchLowStock>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchLowStock>>,
          TError,
          Awaited<ReturnType<typeof branchLowStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchLowStock<TData = Awaited<ReturnType<typeof branchLowStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchLowStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchLowStock<TData = Awaited<ReturnType<typeof branchLowStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchLowStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchLowStockQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchMenuEngineering = (
    branchId: string,
    params?: BranchMenuEngineeringParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<MenuEngineeringReport>(
      {url: `/reports/branches/${branchId}/menu-engineering`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchMenuEngineeringQueryKey = (branchId: string,
    params?: BranchMenuEngineeringParams,) => {
    return [
    `/reports/branches/${branchId}/menu-engineering`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchMenuEngineeringQueryOptions = <TData = Awaited<ReturnType<typeof branchMenuEngineering>>, TError = ErrorBody>(branchId: string,
    params?: BranchMenuEngineeringParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchMenuEngineering>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchMenuEngineeringQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchMenuEngineering>>> = ({ signal }) => branchMenuEngineering(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchMenuEngineering>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchMenuEngineeringQueryResult = NonNullable<Awaited<ReturnType<typeof branchMenuEngineering>>>
export type BranchMenuEngineeringQueryError = ErrorBody


export function useBranchMenuEngineering<TData = Awaited<ReturnType<typeof branchMenuEngineering>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchMenuEngineeringParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchMenuEngineering>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchMenuEngineering>>,
          TError,
          Awaited<ReturnType<typeof branchMenuEngineering>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchMenuEngineering<TData = Awaited<ReturnType<typeof branchMenuEngineering>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchMenuEngineeringParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchMenuEngineering>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchMenuEngineering>>,
          TError,
          Awaited<ReturnType<typeof branchMenuEngineering>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchMenuEngineering<TData = Awaited<ReturnType<typeof branchMenuEngineering>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchMenuEngineeringParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchMenuEngineering>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchMenuEngineering<TData = Awaited<ReturnType<typeof branchMenuEngineering>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchMenuEngineeringParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchMenuEngineering>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchMenuEngineeringQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchSales = (
    branchId: string,
    params?: BranchSalesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchSalesReport>(
      {url: `/reports/branches/${branchId}/sales`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchSalesQueryKey = (branchId: string,
    params?: BranchSalesParams,) => {
    return [
    `/reports/branches/${branchId}/sales`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchSalesQueryOptions = <TData = Awaited<ReturnType<typeof branchSales>>, TError = ErrorBody>(branchId: string,
    params?: BranchSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchSalesQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchSales>>> = ({ signal }) => branchSales(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchSales>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchSalesQueryResult = NonNullable<Awaited<ReturnType<typeof branchSales>>>
export type BranchSalesQueryError = ErrorBody


export function useBranchSales<TData = Awaited<ReturnType<typeof branchSales>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchSalesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSales>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchSales>>,
          TError,
          Awaited<ReturnType<typeof branchSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchSales<TData = Awaited<ReturnType<typeof branchSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSales>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchSales>>,
          TError,
          Awaited<ReturnType<typeof branchSales>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchSales<TData = Awaited<ReturnType<typeof branchSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchSales<TData = Awaited<ReturnType<typeof branchSales>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchSalesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSales>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchSalesQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchSalesTimeseries = (
    branchId: string,
    params?: BranchSalesTimeseriesParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<TimeseriesPoint[]>(
      {url: `/reports/branches/${branchId}/sales/timeseries`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchSalesTimeseriesQueryKey = (branchId: string,
    params?: BranchSalesTimeseriesParams,) => {
    return [
    `/reports/branches/${branchId}/sales/timeseries`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchSalesTimeseriesQueryOptions = <TData = Awaited<ReturnType<typeof branchSalesTimeseries>>, TError = ErrorBody>(branchId: string,
    params?: BranchSalesTimeseriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSalesTimeseries>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchSalesTimeseriesQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchSalesTimeseries>>> = ({ signal }) => branchSalesTimeseries(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchSalesTimeseries>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchSalesTimeseriesQueryResult = NonNullable<Awaited<ReturnType<typeof branchSalesTimeseries>>>
export type BranchSalesTimeseriesQueryError = ErrorBody


export function useBranchSalesTimeseries<TData = Awaited<ReturnType<typeof branchSalesTimeseries>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchSalesTimeseriesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSalesTimeseries>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchSalesTimeseries>>,
          TError,
          Awaited<ReturnType<typeof branchSalesTimeseries>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchSalesTimeseries<TData = Awaited<ReturnType<typeof branchSalesTimeseries>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchSalesTimeseriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSalesTimeseries>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchSalesTimeseries>>,
          TError,
          Awaited<ReturnType<typeof branchSalesTimeseries>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchSalesTimeseries<TData = Awaited<ReturnType<typeof branchSalesTimeseries>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchSalesTimeseriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSalesTimeseries>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchSalesTimeseries<TData = Awaited<ReturnType<typeof branchSalesTimeseries>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchSalesTimeseriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchSalesTimeseries>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchSalesTimeseriesQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchShrinkage = (
    branchId: string,
    params?: BranchShrinkageParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ShrinkageRow[]>(
      {url: `/reports/branches/${branchId}/shrinkage`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchShrinkageQueryKey = (branchId: string,
    params?: BranchShrinkageParams,) => {
    return [
    `/reports/branches/${branchId}/shrinkage`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchShrinkageQueryOptions = <TData = Awaited<ReturnType<typeof branchShrinkage>>, TError = ErrorBody>(branchId: string,
    params?: BranchShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchShrinkage>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchShrinkageQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchShrinkage>>> = ({ signal }) => branchShrinkage(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchShrinkage>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchShrinkageQueryResult = NonNullable<Awaited<ReturnType<typeof branchShrinkage>>>
export type BranchShrinkageQueryError = ErrorBody


export function useBranchShrinkage<TData = Awaited<ReturnType<typeof branchShrinkage>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchShrinkageParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchShrinkage>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchShrinkage>>,
          TError,
          Awaited<ReturnType<typeof branchShrinkage>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchShrinkage<TData = Awaited<ReturnType<typeof branchShrinkage>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchShrinkage>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchShrinkage>>,
          TError,
          Awaited<ReturnType<typeof branchShrinkage>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchShrinkage<TData = Awaited<ReturnType<typeof branchShrinkage>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchShrinkage>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchShrinkage<TData = Awaited<ReturnType<typeof branchShrinkage>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchShrinkage>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchShrinkageQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchStock = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<BranchStockReport>(
      {url: `/reports/branches/${branchId}/stock`, method: 'GET', signal
    },
      options);
    }




export const getBranchStockQueryKey = (branchId: string,) => {
    return [
    `/reports/branches/${branchId}/stock`
    ] as const;
    }


export const getBranchStockQueryOptions = <TData = Awaited<ReturnType<typeof branchStock>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchStockQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchStock>>> = ({ signal }) => branchStock(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchStock>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchStockQueryResult = NonNullable<Awaited<ReturnType<typeof branchStock>>>
export type BranchStockQueryError = ErrorBody


export function useBranchStock<TData = Awaited<ReturnType<typeof branchStock>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchStock>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchStock>>,
          TError,
          Awaited<ReturnType<typeof branchStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchStock<TData = Awaited<ReturnType<typeof branchStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchStock>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchStock>>,
          TError,
          Awaited<ReturnType<typeof branchStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchStock<TData = Awaited<ReturnType<typeof branchStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchStock<TData = Awaited<ReturnType<typeof branchStock>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchStockQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchTellerStats = (
    branchId: string,
    params?: BranchTellerStatsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<TellerStats[]>(
      {url: `/reports/branches/${branchId}/tellers`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchTellerStatsQueryKey = (branchId: string,
    params?: BranchTellerStatsParams,) => {
    return [
    `/reports/branches/${branchId}/tellers`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchTellerStatsQueryOptions = <TData = Awaited<ReturnType<typeof branchTellerStats>>, TError = ErrorBody>(branchId: string,
    params?: BranchTellerStatsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchTellerStats>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchTellerStatsQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchTellerStats>>> = ({ signal }) => branchTellerStats(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchTellerStats>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchTellerStatsQueryResult = NonNullable<Awaited<ReturnType<typeof branchTellerStats>>>
export type BranchTellerStatsQueryError = ErrorBody


export function useBranchTellerStats<TData = Awaited<ReturnType<typeof branchTellerStats>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchTellerStatsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchTellerStats>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchTellerStats>>,
          TError,
          Awaited<ReturnType<typeof branchTellerStats>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchTellerStats<TData = Awaited<ReturnType<typeof branchTellerStats>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchTellerStatsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchTellerStats>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchTellerStats>>,
          TError,
          Awaited<ReturnType<typeof branchTellerStats>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchTellerStats<TData = Awaited<ReturnType<typeof branchTellerStats>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchTellerStatsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchTellerStats>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchTellerStats<TData = Awaited<ReturnType<typeof branchTellerStats>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchTellerStatsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchTellerStats>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchTellerStatsQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const branchWasteReport = (
    branchId: string,
    params?: BranchWasteReportParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<WasteReportRow[]>(
      {url: `/reports/branches/${branchId}/waste-report`, method: 'GET',
        params, signal
    },
      options);
    }




export const getBranchWasteReportQueryKey = (branchId: string,
    params?: BranchWasteReportParams,) => {
    return [
    `/reports/branches/${branchId}/waste-report`, ...(params ? [params] : [])
    ] as const;
    }


export const getBranchWasteReportQueryOptions = <TData = Awaited<ReturnType<typeof branchWasteReport>>, TError = ErrorBody>(branchId: string,
    params?: BranchWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchWasteReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBranchWasteReportQueryKey(branchId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof branchWasteReport>>> = ({ signal }) => branchWasteReport(branchId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof branchWasteReport>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BranchWasteReportQueryResult = NonNullable<Awaited<ReturnType<typeof branchWasteReport>>>
export type BranchWasteReportQueryError = ErrorBody


export function useBranchWasteReport<TData = Awaited<ReturnType<typeof branchWasteReport>>, TError = ErrorBody>(
 branchId: string,
    params: undefined |  BranchWasteReportParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchWasteReport>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchWasteReport>>,
          TError,
          Awaited<ReturnType<typeof branchWasteReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchWasteReport<TData = Awaited<ReturnType<typeof branchWasteReport>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchWasteReport>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof branchWasteReport>>,
          TError,
          Awaited<ReturnType<typeof branchWasteReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBranchWasteReport<TData = Awaited<ReturnType<typeof branchWasteReport>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchWasteReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useBranchWasteReport<TData = Awaited<ReturnType<typeof branchWasteReport>>, TError = ErrorBody>(
 branchId: string,
    params?: BranchWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof branchWasteReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBranchWasteReportQueryOptions(branchId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const orgBranchComparison = (
    orgId: string,
    params?: OrgBranchComparisonParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<OrgComparisonReport>(
      {url: `/reports/orgs/${orgId}/comparison`, method: 'GET',
        params, signal
    },
      options);
    }




export const getOrgBranchComparisonQueryKey = (orgId: string,
    params?: OrgBranchComparisonParams,) => {
    return [
    `/reports/orgs/${orgId}/comparison`, ...(params ? [params] : [])
    ] as const;
    }


export const getOrgBranchComparisonQueryOptions = <TData = Awaited<ReturnType<typeof orgBranchComparison>>, TError = ErrorBody>(orgId: string,
    params?: OrgBranchComparisonParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgBranchComparison>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getOrgBranchComparisonQueryKey(orgId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof orgBranchComparison>>> = ({ signal }) => orgBranchComparison(orgId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof orgBranchComparison>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type OrgBranchComparisonQueryResult = NonNullable<Awaited<ReturnType<typeof orgBranchComparison>>>
export type OrgBranchComparisonQueryError = ErrorBody


export function useOrgBranchComparison<TData = Awaited<ReturnType<typeof orgBranchComparison>>, TError = ErrorBody>(
 orgId: string,
    params: undefined |  OrgBranchComparisonParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgBranchComparison>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgBranchComparison>>,
          TError,
          Awaited<ReturnType<typeof orgBranchComparison>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgBranchComparison<TData = Awaited<ReturnType<typeof orgBranchComparison>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgBranchComparisonParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgBranchComparison>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgBranchComparison>>,
          TError,
          Awaited<ReturnType<typeof orgBranchComparison>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgBranchComparison<TData = Awaited<ReturnType<typeof orgBranchComparison>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgBranchComparisonParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgBranchComparison>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useOrgBranchComparison<TData = Awaited<ReturnType<typeof orgBranchComparison>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgBranchComparisonParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgBranchComparison>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getOrgBranchComparisonQueryOptions(orgId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const orgConsumption = (
    orgId: string,
    params?: OrgConsumptionParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ConsumptionRow[]>(
      {url: `/reports/orgs/${orgId}/consumption`, method: 'GET',
        params, signal
    },
      options);
    }




export const getOrgConsumptionQueryKey = (orgId: string,
    params?: OrgConsumptionParams,) => {
    return [
    `/reports/orgs/${orgId}/consumption`, ...(params ? [params] : [])
    ] as const;
    }


export const getOrgConsumptionQueryOptions = <TData = Awaited<ReturnType<typeof orgConsumption>>, TError = ErrorBody>(orgId: string,
    params?: OrgConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgConsumption>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getOrgConsumptionQueryKey(orgId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof orgConsumption>>> = ({ signal }) => orgConsumption(orgId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof orgConsumption>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type OrgConsumptionQueryResult = NonNullable<Awaited<ReturnType<typeof orgConsumption>>>
export type OrgConsumptionQueryError = ErrorBody


export function useOrgConsumption<TData = Awaited<ReturnType<typeof orgConsumption>>, TError = ErrorBody>(
 orgId: string,
    params: undefined |  OrgConsumptionParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgConsumption>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgConsumption>>,
          TError,
          Awaited<ReturnType<typeof orgConsumption>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgConsumption<TData = Awaited<ReturnType<typeof orgConsumption>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgConsumption>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgConsumption>>,
          TError,
          Awaited<ReturnType<typeof orgConsumption>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgConsumption<TData = Awaited<ReturnType<typeof orgConsumption>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgConsumption>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useOrgConsumption<TData = Awaited<ReturnType<typeof orgConsumption>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgConsumptionParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgConsumption>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getOrgConsumptionQueryOptions(orgId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const orgInventoryValuation = (
    orgId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<InventoryValuationReport>(
      {url: `/reports/orgs/${orgId}/inventory-valuation`, method: 'GET', signal
    },
      options);
    }




export const getOrgInventoryValuationQueryKey = (orgId: string,) => {
    return [
    `/reports/orgs/${orgId}/inventory-valuation`
    ] as const;
    }


export const getOrgInventoryValuationQueryOptions = <TData = Awaited<ReturnType<typeof orgInventoryValuation>>, TError = ErrorBody>(orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgInventoryValuation>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getOrgInventoryValuationQueryKey(orgId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof orgInventoryValuation>>> = ({ signal }) => orgInventoryValuation(orgId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof orgInventoryValuation>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type OrgInventoryValuationQueryResult = NonNullable<Awaited<ReturnType<typeof orgInventoryValuation>>>
export type OrgInventoryValuationQueryError = ErrorBody


export function useOrgInventoryValuation<TData = Awaited<ReturnType<typeof orgInventoryValuation>>, TError = ErrorBody>(
 orgId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgInventoryValuation>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgInventoryValuation>>,
          TError,
          Awaited<ReturnType<typeof orgInventoryValuation>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgInventoryValuation<TData = Awaited<ReturnType<typeof orgInventoryValuation>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgInventoryValuation>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgInventoryValuation>>,
          TError,
          Awaited<ReturnType<typeof orgInventoryValuation>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgInventoryValuation<TData = Awaited<ReturnType<typeof orgInventoryValuation>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgInventoryValuation>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useOrgInventoryValuation<TData = Awaited<ReturnType<typeof orgInventoryValuation>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgInventoryValuation>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getOrgInventoryValuationQueryOptions(orgId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const orgLowStock = (
    orgId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<LowStockRow[]>(
      {url: `/reports/orgs/${orgId}/low-stock`, method: 'GET', signal
    },
      options);
    }




export const getOrgLowStockQueryKey = (orgId: string,) => {
    return [
    `/reports/orgs/${orgId}/low-stock`
    ] as const;
    }


export const getOrgLowStockQueryOptions = <TData = Awaited<ReturnType<typeof orgLowStock>>, TError = ErrorBody>(orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgLowStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getOrgLowStockQueryKey(orgId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof orgLowStock>>> = ({ signal }) => orgLowStock(orgId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof orgLowStock>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type OrgLowStockQueryResult = NonNullable<Awaited<ReturnType<typeof orgLowStock>>>
export type OrgLowStockQueryError = ErrorBody


export function useOrgLowStock<TData = Awaited<ReturnType<typeof orgLowStock>>, TError = ErrorBody>(
 orgId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgLowStock>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgLowStock>>,
          TError,
          Awaited<ReturnType<typeof orgLowStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgLowStock<TData = Awaited<ReturnType<typeof orgLowStock>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgLowStock>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgLowStock>>,
          TError,
          Awaited<ReturnType<typeof orgLowStock>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgLowStock<TData = Awaited<ReturnType<typeof orgLowStock>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgLowStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useOrgLowStock<TData = Awaited<ReturnType<typeof orgLowStock>>, TError = ErrorBody>(
 orgId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgLowStock>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getOrgLowStockQueryOptions(orgId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const orgShrinkage = (
    orgId: string,
    params?: OrgShrinkageParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ShrinkageRow[]>(
      {url: `/reports/orgs/${orgId}/shrinkage`, method: 'GET',
        params, signal
    },
      options);
    }




export const getOrgShrinkageQueryKey = (orgId: string,
    params?: OrgShrinkageParams,) => {
    return [
    `/reports/orgs/${orgId}/shrinkage`, ...(params ? [params] : [])
    ] as const;
    }


export const getOrgShrinkageQueryOptions = <TData = Awaited<ReturnType<typeof orgShrinkage>>, TError = ErrorBody>(orgId: string,
    params?: OrgShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgShrinkage>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getOrgShrinkageQueryKey(orgId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof orgShrinkage>>> = ({ signal }) => orgShrinkage(orgId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof orgShrinkage>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type OrgShrinkageQueryResult = NonNullable<Awaited<ReturnType<typeof orgShrinkage>>>
export type OrgShrinkageQueryError = ErrorBody


export function useOrgShrinkage<TData = Awaited<ReturnType<typeof orgShrinkage>>, TError = ErrorBody>(
 orgId: string,
    params: undefined |  OrgShrinkageParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgShrinkage>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgShrinkage>>,
          TError,
          Awaited<ReturnType<typeof orgShrinkage>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgShrinkage<TData = Awaited<ReturnType<typeof orgShrinkage>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgShrinkage>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgShrinkage>>,
          TError,
          Awaited<ReturnType<typeof orgShrinkage>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgShrinkage<TData = Awaited<ReturnType<typeof orgShrinkage>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgShrinkage>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useOrgShrinkage<TData = Awaited<ReturnType<typeof orgShrinkage>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgShrinkageParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgShrinkage>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getOrgShrinkageQueryOptions(orgId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const orgWasteReport = (
    orgId: string,
    params?: OrgWasteReportParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<WasteReportRow[]>(
      {url: `/reports/orgs/${orgId}/waste-report`, method: 'GET',
        params, signal
    },
      options);
    }




export const getOrgWasteReportQueryKey = (orgId: string,
    params?: OrgWasteReportParams,) => {
    return [
    `/reports/orgs/${orgId}/waste-report`, ...(params ? [params] : [])
    ] as const;
    }


export const getOrgWasteReportQueryOptions = <TData = Awaited<ReturnType<typeof orgWasteReport>>, TError = ErrorBody>(orgId: string,
    params?: OrgWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgWasteReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getOrgWasteReportQueryKey(orgId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof orgWasteReport>>> = ({ signal }) => orgWasteReport(orgId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: orgId !== null && orgId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof orgWasteReport>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type OrgWasteReportQueryResult = NonNullable<Awaited<ReturnType<typeof orgWasteReport>>>
export type OrgWasteReportQueryError = ErrorBody


export function useOrgWasteReport<TData = Awaited<ReturnType<typeof orgWasteReport>>, TError = ErrorBody>(
 orgId: string,
    params: undefined |  OrgWasteReportParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgWasteReport>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgWasteReport>>,
          TError,
          Awaited<ReturnType<typeof orgWasteReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgWasteReport<TData = Awaited<ReturnType<typeof orgWasteReport>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgWasteReport>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof orgWasteReport>>,
          TError,
          Awaited<ReturnType<typeof orgWasteReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useOrgWasteReport<TData = Awaited<ReturnType<typeof orgWasteReport>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgWasteReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useOrgWasteReport<TData = Awaited<ReturnType<typeof orgWasteReport>>, TError = ErrorBody>(
 orgId: string,
    params?: OrgWasteReportParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof orgWasteReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getOrgWasteReportQueryOptions(orgId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const shiftDeductions = (
    shiftId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<DeductionLogRow[]>(
      {url: `/reports/shifts/${shiftId}/deductions`, method: 'GET', signal
    },
      options);
    }




export const getShiftDeductionsQueryKey = (shiftId: string,) => {
    return [
    `/reports/shifts/${shiftId}/deductions`
    ] as const;
    }


export const getShiftDeductionsQueryOptions = <TData = Awaited<ReturnType<typeof shiftDeductions>>, TError = ErrorBody>(shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftDeductions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getShiftDeductionsQueryKey(shiftId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof shiftDeductions>>> = ({ signal }) => shiftDeductions(shiftId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: shiftId !== null && shiftId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof shiftDeductions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ShiftDeductionsQueryResult = NonNullable<Awaited<ReturnType<typeof shiftDeductions>>>
export type ShiftDeductionsQueryError = ErrorBody


export function useShiftDeductions<TData = Awaited<ReturnType<typeof shiftDeductions>>, TError = ErrorBody>(
 shiftId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftDeductions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof shiftDeductions>>,
          TError,
          Awaited<ReturnType<typeof shiftDeductions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useShiftDeductions<TData = Awaited<ReturnType<typeof shiftDeductions>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftDeductions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof shiftDeductions>>,
          TError,
          Awaited<ReturnType<typeof shiftDeductions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useShiftDeductions<TData = Awaited<ReturnType<typeof shiftDeductions>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftDeductions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useShiftDeductions<TData = Awaited<ReturnType<typeof shiftDeductions>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftDeductions>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getShiftDeductionsQueryOptions(shiftId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const shiftSummary = (
    shiftId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ShiftSummary>(
      {url: `/reports/shifts/${shiftId}/summary`, method: 'GET', signal
    },
      options);
    }




export const getShiftSummaryQueryKey = (shiftId: string,) => {
    return [
    `/reports/shifts/${shiftId}/summary`
    ] as const;
    }


export const getShiftSummaryQueryOptions = <TData = Awaited<ReturnType<typeof shiftSummary>>, TError = ErrorBody>(shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftSummary>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getShiftSummaryQueryKey(shiftId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof shiftSummary>>> = ({ signal }) => shiftSummary(shiftId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: shiftId !== null && shiftId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof shiftSummary>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ShiftSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof shiftSummary>>>
export type ShiftSummaryQueryError = ErrorBody


export function useShiftSummary<TData = Awaited<ReturnType<typeof shiftSummary>>, TError = ErrorBody>(
 shiftId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftSummary>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof shiftSummary>>,
          TError,
          Awaited<ReturnType<typeof shiftSummary>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useShiftSummary<TData = Awaited<ReturnType<typeof shiftSummary>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftSummary>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof shiftSummary>>,
          TError,
          Awaited<ReturnType<typeof shiftSummary>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useShiftSummary<TData = Awaited<ReturnType<typeof shiftSummary>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftSummary>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useShiftSummary<TData = Awaited<ReturnType<typeof shiftSummary>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftSummary>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getShiftSummaryQueryOptions(shiftId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listShifts = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Shift[]>(
      {url: `/shifts/branches/${branchId}`, method: 'GET', signal
    },
      options);
    }




export const getListShiftsQueryKey = (branchId: string,) => {
    return [
    `/shifts/branches/${branchId}`
    ] as const;
    }


export const getListShiftsQueryOptions = <TData = Awaited<ReturnType<typeof listShifts>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListShiftsQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listShifts>>> = ({ signal }) => listShifts(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListShiftsQueryResult = NonNullable<Awaited<ReturnType<typeof listShifts>>>
export type ListShiftsQueryError = ErrorBody


export function useListShifts<TData = Awaited<ReturnType<typeof listShifts>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listShifts>>,
          TError,
          Awaited<ReturnType<typeof listShifts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListShifts<TData = Awaited<ReturnType<typeof listShifts>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listShifts>>,
          TError,
          Awaited<ReturnType<typeof listShifts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListShifts<TData = Awaited<ReturnType<typeof listShifts>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListShifts<TData = Awaited<ReturnType<typeof listShifts>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListShiftsQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const getCurrentShift = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ShiftPreFill>(
      {url: `/shifts/branches/${branchId}/current`, method: 'GET', signal
    },
      options);
    }




export const getGetCurrentShiftQueryKey = (branchId: string,) => {
    return [
    `/shifts/branches/${branchId}/current`
    ] as const;
    }


export const getGetCurrentShiftQueryOptions = <TData = Awaited<ReturnType<typeof getCurrentShift>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCurrentShift>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetCurrentShiftQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getCurrentShift>>> = ({ signal }) => getCurrentShift(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getCurrentShift>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetCurrentShiftQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentShift>>>
export type GetCurrentShiftQueryError = ErrorBody


export function useGetCurrentShift<TData = Awaited<ReturnType<typeof getCurrentShift>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCurrentShift>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getCurrentShift>>,
          TError,
          Awaited<ReturnType<typeof getCurrentShift>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetCurrentShift<TData = Awaited<ReturnType<typeof getCurrentShift>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCurrentShift>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getCurrentShift>>,
          TError,
          Awaited<ReturnType<typeof getCurrentShift>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetCurrentShift<TData = Awaited<ReturnType<typeof getCurrentShift>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCurrentShift>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetCurrentShift<TData = Awaited<ReturnType<typeof getCurrentShift>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getCurrentShift>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetCurrentShiftQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const openShift = (
    branchId: string,
    openShiftRequest: OpenShiftRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Shift>(
      {url: `/shifts/branches/${branchId}/open`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: openShiftRequest, signal
    },
      options);
    }



export const getOpenShiftMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof openShift>>, TError,{branchId: string;data: OpenShiftRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof openShift>>, TError,{branchId: string;data: OpenShiftRequest}, TContext> => {

const mutationKey = ['openShift'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof openShift>>, {branchId: string;data: OpenShiftRequest}> = (props) => {
          const {branchId,data} = props ?? {};

          return  openShift(branchId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type OpenShiftMutationResult = NonNullable<Awaited<ReturnType<typeof openShift>>>
    export type OpenShiftMutationBody = OpenShiftRequest
    export type OpenShiftMutationError = ErrorBody

    export const useOpenShift = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof openShift>>, TError,{branchId: string;data: OpenShiftRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof openShift>>,
        TError,
        {branchId: string;data: OpenShiftRequest},
        TContext
      > => {
      return useMutation(getOpenShiftMutationOptions(options), queryClient);
    }

export const getShift = (
    shiftId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Shift>(
      {url: `/shifts/${shiftId}`, method: 'GET', signal
    },
      options);
    }




export const getGetShiftQueryKey = (shiftId: string,) => {
    return [
    `/shifts/${shiftId}`
    ] as const;
    }


export const getGetShiftQueryOptions = <TData = Awaited<ReturnType<typeof getShift>>, TError = ErrorBody>(shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShift>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetShiftQueryKey(shiftId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getShift>>> = ({ signal }) => getShift(shiftId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: shiftId !== null && shiftId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getShift>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetShiftQueryResult = NonNullable<Awaited<ReturnType<typeof getShift>>>
export type GetShiftQueryError = ErrorBody


export function useGetShift<TData = Awaited<ReturnType<typeof getShift>>, TError = ErrorBody>(
 shiftId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShift>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getShift>>,
          TError,
          Awaited<ReturnType<typeof getShift>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetShift<TData = Awaited<ReturnType<typeof getShift>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShift>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getShift>>,
          TError,
          Awaited<ReturnType<typeof getShift>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetShift<TData = Awaited<ReturnType<typeof getShift>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShift>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetShift<TData = Awaited<ReturnType<typeof getShift>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShift>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetShiftQueryOptions(shiftId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const deleteShift = (
    shiftId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/shifts/${shiftId}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteShiftMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteShift>>, TError,{shiftId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteShift>>, TError,{shiftId: string}, TContext> => {

const mutationKey = ['deleteShift'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteShift>>, {shiftId: string}> = (props) => {
          const {shiftId} = props ?? {};

          return  deleteShift(shiftId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteShiftMutationResult = NonNullable<Awaited<ReturnType<typeof deleteShift>>>

    export type DeleteShiftMutationError = ErrorBody

    export const useDeleteShift = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteShift>>, TError,{shiftId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteShift>>,
        TError,
        {shiftId: string},
        TContext
      > => {
      return useMutation(getDeleteShiftMutationOptions(options), queryClient);
    }

export const listCashMovements = (
    shiftId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<CashMovement[]>(
      {url: `/shifts/${shiftId}/cash-movements`, method: 'GET', signal
    },
      options);
    }




export const getListCashMovementsQueryKey = (shiftId: string,) => {
    return [
    `/shifts/${shiftId}/cash-movements`
    ] as const;
    }


export const getListCashMovementsQueryOptions = <TData = Awaited<ReturnType<typeof listCashMovements>>, TError = ErrorBody>(shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCashMovements>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListCashMovementsQueryKey(shiftId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listCashMovements>>> = ({ signal }) => listCashMovements(shiftId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: shiftId !== null && shiftId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listCashMovements>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListCashMovementsQueryResult = NonNullable<Awaited<ReturnType<typeof listCashMovements>>>
export type ListCashMovementsQueryError = ErrorBody


export function useListCashMovements<TData = Awaited<ReturnType<typeof listCashMovements>>, TError = ErrorBody>(
 shiftId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCashMovements>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listCashMovements>>,
          TError,
          Awaited<ReturnType<typeof listCashMovements>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListCashMovements<TData = Awaited<ReturnType<typeof listCashMovements>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCashMovements>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listCashMovements>>,
          TError,
          Awaited<ReturnType<typeof listCashMovements>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListCashMovements<TData = Awaited<ReturnType<typeof listCashMovements>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCashMovements>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListCashMovements<TData = Awaited<ReturnType<typeof listCashMovements>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listCashMovements>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListCashMovementsQueryOptions(shiftId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const addCashMovement = (
    shiftId: string,
    cashMovementRequest: CashMovementRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<CashMovement>(
      {url: `/shifts/${shiftId}/cash-movements`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: cashMovementRequest, signal
    },
      options);
    }



export const getAddCashMovementMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof addCashMovement>>, TError,{shiftId: string;data: CashMovementRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof addCashMovement>>, TError,{shiftId: string;data: CashMovementRequest}, TContext> => {

const mutationKey = ['addCashMovement'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof addCashMovement>>, {shiftId: string;data: CashMovementRequest}> = (props) => {
          const {shiftId,data} = props ?? {};

          return  addCashMovement(shiftId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type AddCashMovementMutationResult = NonNullable<Awaited<ReturnType<typeof addCashMovement>>>
    export type AddCashMovementMutationBody = CashMovementRequest
    export type AddCashMovementMutationError = ErrorBody

    export const useAddCashMovement = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof addCashMovement>>, TError,{shiftId: string;data: CashMovementRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof addCashMovement>>,
        TError,
        {shiftId: string;data: CashMovementRequest},
        TContext
      > => {
      return useMutation(getAddCashMovementMutationOptions(options), queryClient);
    }

export const closeShift = (
    shiftId: string,
    closeShiftRequest: CloseShiftRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<CloseShiftResponse>(
      {url: `/shifts/${shiftId}/close`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: closeShiftRequest, signal
    },
      options);
    }



export const getCloseShiftMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof closeShift>>, TError,{shiftId: string;data: CloseShiftRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof closeShift>>, TError,{shiftId: string;data: CloseShiftRequest}, TContext> => {

const mutationKey = ['closeShift'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof closeShift>>, {shiftId: string;data: CloseShiftRequest}> = (props) => {
          const {shiftId,data} = props ?? {};

          return  closeShift(shiftId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CloseShiftMutationResult = NonNullable<Awaited<ReturnType<typeof closeShift>>>
    export type CloseShiftMutationBody = CloseShiftRequest
    export type CloseShiftMutationError = ErrorBody

    export const useCloseShift = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof closeShift>>, TError,{shiftId: string;data: CloseShiftRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof closeShift>>,
        TError,
        {shiftId: string;data: CloseShiftRequest},
        TContext
      > => {
      return useMutation(getCloseShiftMutationOptions(options), queryClient);
    }

export const forceCloseShift = (
    shiftId: string,
    forceCloseRequest: ForceCloseRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Shift>(
      {url: `/shifts/${shiftId}/force-close`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: forceCloseRequest, signal
    },
      options);
    }



export const getForceCloseShiftMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof forceCloseShift>>, TError,{shiftId: string;data: ForceCloseRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof forceCloseShift>>, TError,{shiftId: string;data: ForceCloseRequest}, TContext> => {

const mutationKey = ['forceCloseShift'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof forceCloseShift>>, {shiftId: string;data: ForceCloseRequest}> = (props) => {
          const {shiftId,data} = props ?? {};

          return  forceCloseShift(shiftId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type ForceCloseShiftMutationResult = NonNullable<Awaited<ReturnType<typeof forceCloseShift>>>
    export type ForceCloseShiftMutationBody = ForceCloseRequest
    export type ForceCloseShiftMutationError = ErrorBody

    export const useForceCloseShift = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof forceCloseShift>>, TError,{shiftId: string;data: ForceCloseRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof forceCloseShift>>,
        TError,
        {shiftId: string;data: ForceCloseRequest},
        TContext
      > => {
      return useMutation(getForceCloseShiftMutationOptions(options), queryClient);
    }

export const getShiftReport = (
    shiftId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<ShiftReportResponse>(
      {url: `/shifts/${shiftId}/report`, method: 'GET', signal
    },
      options);
    }




export const getGetShiftReportQueryKey = (shiftId: string,) => {
    return [
    `/shifts/${shiftId}/report`
    ] as const;
    }


export const getGetShiftReportQueryOptions = <TData = Awaited<ReturnType<typeof getShiftReport>>, TError = ErrorBody>(shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShiftReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetShiftReportQueryKey(shiftId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getShiftReport>>> = ({ signal }) => getShiftReport(shiftId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: shiftId !== null && shiftId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getShiftReport>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetShiftReportQueryResult = NonNullable<Awaited<ReturnType<typeof getShiftReport>>>
export type GetShiftReportQueryError = ErrorBody


export function useGetShiftReport<TData = Awaited<ReturnType<typeof getShiftReport>>, TError = ErrorBody>(
 shiftId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShiftReport>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getShiftReport>>,
          TError,
          Awaited<ReturnType<typeof getShiftReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetShiftReport<TData = Awaited<ReturnType<typeof getShiftReport>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShiftReport>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getShiftReport>>,
          TError,
          Awaited<ReturnType<typeof getShiftReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetShiftReport<TData = Awaited<ReturnType<typeof getShiftReport>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShiftReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetShiftReport<TData = Awaited<ReturnType<typeof getShiftReport>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getShiftReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetShiftReportQueryOptions(shiftId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const listStocktakes = (
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Stocktake[]>(
      {url: `/stocktakes/branches/${branchId}`, method: 'GET', signal
    },
      options);
    }




export const getListStocktakesQueryKey = (branchId: string,) => {
    return [
    `/stocktakes/branches/${branchId}`
    ] as const;
    }


export const getListStocktakesQueryOptions = <TData = Awaited<ReturnType<typeof listStocktakes>>, TError = ErrorBody>(branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListStocktakesQueryKey(branchId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listStocktakes>>> = ({ signal }) => listStocktakes(branchId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: branchId !== null && branchId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListStocktakesQueryResult = NonNullable<Awaited<ReturnType<typeof listStocktakes>>>
export type ListStocktakesQueryError = ErrorBody


export function useListStocktakes<TData = Awaited<ReturnType<typeof listStocktakes>>, TError = ErrorBody>(
 branchId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listStocktakes>>,
          TError,
          Awaited<ReturnType<typeof listStocktakes>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListStocktakes<TData = Awaited<ReturnType<typeof listStocktakes>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listStocktakes>>,
          TError,
          Awaited<ReturnType<typeof listStocktakes>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListStocktakes<TData = Awaited<ReturnType<typeof listStocktakes>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListStocktakes<TData = Awaited<ReturnType<typeof listStocktakes>>, TError = ErrorBody>(
 branchId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListStocktakesQueryOptions(branchId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createStocktake = (
    branchId: string,
    createStocktakeRequest: CreateStocktakeRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<StocktakeFull>(
      {url: `/stocktakes/branches/${branchId}`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createStocktakeRequest, signal
    },
      options);
    }



export const getCreateStocktakeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createStocktake>>, TError,{branchId: string;data: CreateStocktakeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createStocktake>>, TError,{branchId: string;data: CreateStocktakeRequest}, TContext> => {

const mutationKey = ['createStocktake'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createStocktake>>, {branchId: string;data: CreateStocktakeRequest}> = (props) => {
          const {branchId,data} = props ?? {};

          return  createStocktake(branchId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateStocktakeMutationResult = NonNullable<Awaited<ReturnType<typeof createStocktake>>>
    export type CreateStocktakeMutationBody = CreateStocktakeRequest
    export type CreateStocktakeMutationError = ErrorBody

    export const useCreateStocktake = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createStocktake>>, TError,{branchId: string;data: CreateStocktakeRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createStocktake>>,
        TError,
        {branchId: string;data: CreateStocktakeRequest},
        TContext
      > => {
      return useMutation(getCreateStocktakeMutationOptions(options), queryClient);
    }

export const getStocktake = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<StocktakeFull>(
      {url: `/stocktakes/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetStocktakeQueryKey = (id: string,) => {
    return [
    `/stocktakes/${id}`
    ] as const;
    }


export const getGetStocktakeQueryOptions = <TData = Awaited<ReturnType<typeof getStocktake>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetStocktakeQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getStocktake>>> = ({ signal }) => getStocktake(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetStocktakeQueryResult = NonNullable<Awaited<ReturnType<typeof getStocktake>>>
export type GetStocktakeQueryError = ErrorBody


export function useGetStocktake<TData = Awaited<ReturnType<typeof getStocktake>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getStocktake>>,
          TError,
          Awaited<ReturnType<typeof getStocktake>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetStocktake<TData = Awaited<ReturnType<typeof getStocktake>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getStocktake>>,
          TError,
          Awaited<ReturnType<typeof getStocktake>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetStocktake<TData = Awaited<ReturnType<typeof getStocktake>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetStocktake<TData = Awaited<ReturnType<typeof getStocktake>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetStocktakeQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const cancelStocktake = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<Stocktake>(
      {url: `/stocktakes/${id}/cancel`, method: 'POST', signal
    },
      options);
    }



export const getCancelStocktakeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelStocktake>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof cancelStocktake>>, TError,{id: string}, TContext> => {

const mutationKey = ['cancelStocktake'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof cancelStocktake>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  cancelStocktake(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CancelStocktakeMutationResult = NonNullable<Awaited<ReturnType<typeof cancelStocktake>>>

    export type CancelStocktakeMutationError = ErrorBody

    export const useCancelStocktake = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelStocktake>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof cancelStocktake>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getCancelStocktakeMutationOptions(options), queryClient);
    }

export const finalizeStocktake = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<StocktakeFull>(
      {url: `/stocktakes/${id}/finalize`, method: 'POST', signal
    },
      options);
    }



export const getFinalizeStocktakeMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof finalizeStocktake>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof finalizeStocktake>>, TError,{id: string}, TContext> => {

const mutationKey = ['finalizeStocktake'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof finalizeStocktake>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  finalizeStocktake(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type FinalizeStocktakeMutationResult = NonNullable<Awaited<ReturnType<typeof finalizeStocktake>>>

    export type FinalizeStocktakeMutationError = ErrorBody

    export const useFinalizeStocktake = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof finalizeStocktake>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof finalizeStocktake>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getFinalizeStocktakeMutationOptions(options), queryClient);
    }

export const upsertItems = (
    id: string,
    upsertItemsRequest: UpsertItemsRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<StocktakeFull>(
      {url: `/stocktakes/${id}/items`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: upsertItemsRequest, signal
    },
      options);
    }



export const getUpsertItemsMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertItems>>, TError,{id: string;data: UpsertItemsRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof upsertItems>>, TError,{id: string;data: UpsertItemsRequest}, TContext> => {

const mutationKey = ['upsertItems'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof upsertItems>>, {id: string;data: UpsertItemsRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  upsertItems(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpsertItemsMutationResult = NonNullable<Awaited<ReturnType<typeof upsertItems>>>
    export type UpsertItemsMutationBody = UpsertItemsRequest
    export type UpsertItemsMutationError = ErrorBody

    export const useUpsertItems = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof upsertItems>>, TError,{id: string;data: UpsertItemsRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof upsertItems>>,
        TError,
        {id: string;data: UpsertItemsRequest},
        TContext
      > => {
      return useMutation(getUpsertItemsMutationOptions(options), queryClient);
    }

export const varianceReport = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<VarianceReport>(
      {url: `/stocktakes/${id}/variance-report`, method: 'GET', signal
    },
      options);
    }




export const getVarianceReportQueryKey = (id: string,) => {
    return [
    `/stocktakes/${id}/variance-report`
    ] as const;
    }


export const getVarianceReportQueryOptions = <TData = Awaited<ReturnType<typeof varianceReport>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof varianceReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getVarianceReportQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof varianceReport>>> = ({ signal }) => varianceReport(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof varianceReport>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type VarianceReportQueryResult = NonNullable<Awaited<ReturnType<typeof varianceReport>>>
export type VarianceReportQueryError = ErrorBody


export function useVarianceReport<TData = Awaited<ReturnType<typeof varianceReport>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof varianceReport>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof varianceReport>>,
          TError,
          Awaited<ReturnType<typeof varianceReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useVarianceReport<TData = Awaited<ReturnType<typeof varianceReport>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof varianceReport>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof varianceReport>>,
          TError,
          Awaited<ReturnType<typeof varianceReport>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useVarianceReport<TData = Awaited<ReturnType<typeof varianceReport>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof varianceReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useVarianceReport<TData = Awaited<ReturnType<typeof varianceReport>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof varianceReport>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getVarianceReportQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const uploadMenuItemImage = (
    menuItemId: string,
    uploadImageMultipart: UploadImageMultipart,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
formData.append(`image`, uploadImageMultipart.image);

      return customInstance<UploadResponse>(
      {url: `/uploads/menu-items/${menuItemId}`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }



export const getUploadMenuItemImageMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof uploadMenuItemImage>>, TError,{menuItemId: string;data: UploadImageMultipart}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof uploadMenuItemImage>>, TError,{menuItemId: string;data: UploadImageMultipart}, TContext> => {

const mutationKey = ['uploadMenuItemImage'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof uploadMenuItemImage>>, {menuItemId: string;data: UploadImageMultipart}> = (props) => {
          const {menuItemId,data} = props ?? {};

          return  uploadMenuItemImage(menuItemId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UploadMenuItemImageMutationResult = NonNullable<Awaited<ReturnType<typeof uploadMenuItemImage>>>
    export type UploadMenuItemImageMutationBody = UploadImageMultipart
    export type UploadMenuItemImageMutationError = ErrorBody

    export const useUploadMenuItemImage = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof uploadMenuItemImage>>, TError,{menuItemId: string;data: UploadImageMultipart}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof uploadMenuItemImage>>,
        TError,
        {menuItemId: string;data: UploadImageMultipart},
        TContext
      > => {
      return useMutation(getUploadMenuItemImageMutationOptions(options), queryClient);
    }

export const listUsers = (
    params?: ListUsersParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<UserPublic[]>(
      {url: `/users`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListUsersQueryKey = (params?: ListUsersParams,) => {
    return [
    `/users`, ...(params ? [params] : [])
    ] as const;
    }


export const getListUsersQueryOptions = <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorBody>(params?: ListUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListUsersQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listUsers>>> = ({ signal }) => listUsers(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>
export type ListUsersQueryError = ErrorBody


export function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorBody>(
 params: undefined |  ListUsersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listUsers>>,
          TError,
          Awaited<ReturnType<typeof listUsers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorBody>(
 params?: ListUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listUsers>>,
          TError,
          Awaited<ReturnType<typeof listUsers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorBody>(
 params?: ListUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorBody>(
 params?: ListUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListUsersQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const createUser = (
    createUserRequest: CreateUserRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<CreateUserResponse>(
      {url: `/users`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createUserRequest, signal
    },
      options);
    }



export const getCreateUserMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError,{data: CreateUserRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError,{data: CreateUserRequest}, TContext> => {

const mutationKey = ['createUser'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createUser>>, {data: CreateUserRequest}> = (props) => {
          const {data} = props ?? {};

          return  createUser(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateUserMutationResult = NonNullable<Awaited<ReturnType<typeof createUser>>>
    export type CreateUserMutationBody = CreateUserRequest
    export type CreateUserMutationError = ErrorBody

    export const useCreateUser = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError,{data: CreateUserRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof createUser>>,
        TError,
        {data: CreateUserRequest},
        TContext
      > => {
      return useMutation(getCreateUserMutationOptions(options), queryClient);
    }

export const getUser = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<UserPublic>(
      {url: `/users/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetUserQueryKey = (id: string,) => {
    return [
    `/users/${id}`
    ] as const;
    }


export const getGetUserQueryOptions = <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetUserQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getUser>>> = ({ signal }) => getUser(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>
export type GetUserQueryError = ErrorBody


export function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUser>>,
          TError,
          Awaited<ReturnType<typeof getUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUser>>,
          TError,
          Awaited<ReturnType<typeof getUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetUserQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const deleteUser = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/users/${id}`, method: 'DELETE', signal
    },
      options);
    }



export const getDeleteUserMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteUser'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteUser>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteUser(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteUserMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUser>>>

    export type DeleteUserMutationError = ErrorBody

    export const useDeleteUser = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteUser>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteUserMutationOptions(options), queryClient);
    }

export const updateUser = (
    id: string,
    updateUserRequest: UpdateUserRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<UserPublic>(
      {url: `/users/${id}`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: updateUserRequest, signal
    },
      options);
    }



export const getUpdateUserMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError,{id: string;data: UpdateUserRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError,{id: string;data: UpdateUserRequest}, TContext> => {

const mutationKey = ['updateUser'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateUser>>, {id: string;data: UpdateUserRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  updateUser(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>
    export type UpdateUserMutationBody = UpdateUserRequest
    export type UpdateUserMutationError = ErrorBody

    export const useUpdateUser = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError,{id: string;data: UpdateUserRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof updateUser>>,
        TError,
        {id: string;data: UpdateUserRequest},
        TContext
      > => {
      return useMutation(getUpdateUserMutationOptions(options), queryClient);
    }

export const listUserBranches = (
    id: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<UserBranch[]>(
      {url: `/users/${id}/branches`, method: 'GET', signal
    },
      options);
    }




export const getListUserBranchesQueryKey = (id: string,) => {
    return [
    `/users/${id}/branches`
    ] as const;
    }


export const getListUserBranchesQueryOptions = <TData = Awaited<ReturnType<typeof listUserBranches>>, TError = ErrorBody>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUserBranches>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListUserBranchesQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listUserBranches>>> = ({ signal }) => listUserBranches(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listUserBranches>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListUserBranchesQueryResult = NonNullable<Awaited<ReturnType<typeof listUserBranches>>>
export type ListUserBranchesQueryError = ErrorBody


export function useListUserBranches<TData = Awaited<ReturnType<typeof listUserBranches>>, TError = ErrorBody>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUserBranches>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listUserBranches>>,
          TError,
          Awaited<ReturnType<typeof listUserBranches>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListUserBranches<TData = Awaited<ReturnType<typeof listUserBranches>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUserBranches>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listUserBranches>>,
          TError,
          Awaited<ReturnType<typeof listUserBranches>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListUserBranches<TData = Awaited<ReturnType<typeof listUserBranches>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUserBranches>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useListUserBranches<TData = Awaited<ReturnType<typeof listUserBranches>>, TError = ErrorBody>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listUserBranches>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListUserBranchesQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}







export const assignBranch = (
    id: string,
    assignBranchRequest: AssignBranchRequest,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/users/${id}/branches`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: assignBranchRequest, signal
    },
      options);
    }



export const getAssignBranchMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof assignBranch>>, TError,{id: string;data: AssignBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof assignBranch>>, TError,{id: string;data: AssignBranchRequest}, TContext> => {

const mutationKey = ['assignBranch'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof assignBranch>>, {id: string;data: AssignBranchRequest}> = (props) => {
          const {id,data} = props ?? {};

          return  assignBranch(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type AssignBranchMutationResult = NonNullable<Awaited<ReturnType<typeof assignBranch>>>
    export type AssignBranchMutationBody = AssignBranchRequest
    export type AssignBranchMutationError = ErrorBody

    export const useAssignBranch = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof assignBranch>>, TError,{id: string;data: AssignBranchRequest}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof assignBranch>>,
        TError,
        {id: string;data: AssignBranchRequest},
        TContext
      > => {
      return useMutation(getAssignBranchMutationOptions(options), queryClient);
    }

export const unassignBranch = (
    id: string,
    branchId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<void>(
      {url: `/users/${id}/branches/${branchId}`, method: 'DELETE', signal
    },
      options);
    }



export const getUnassignBranchMutationOptions = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof unassignBranch>>, TError,{id: string;branchId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof unassignBranch>>, TError,{id: string;branchId: string}, TContext> => {

const mutationKey = ['unassignBranch'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof unassignBranch>>, {id: string;branchId: string}> = (props) => {
          const {id,branchId} = props ?? {};

          return  unassignBranch(id,branchId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UnassignBranchMutationResult = NonNullable<Awaited<ReturnType<typeof unassignBranch>>>

    export type UnassignBranchMutationError = ErrorBody

    export const useUnassignBranch = <TError = ErrorBody,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof unassignBranch>>, TError,{id: string;branchId: string}, TContext>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof unassignBranch>>,
        TError,
        {id: string;branchId: string},
        TContext
      > => {
      return useMutation(getUnassignBranchMutationOptions(options), queryClient);
    }

