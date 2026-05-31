/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
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
  BranchInventoryAdjustment,
  BranchInventoryItem,
  BranchInventoryTransfer,
  BranchSalesParams,
  BranchSalesReport,
  BranchSalesTimeseriesParams,
  BranchStockReport,
  BranchTellerStatsParams,
  BundlePerformanceParams,
  BundlePerformanceResponse,
  BundleSalesRow,
  BundleWithComponents,
  CashMovement,
  CashMovementRequest,
  Category,
  CloseShiftRequest,
  CloseShiftResponse,
  CombinedItemSalesRow,
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
  CreateTransferRequest,
  CreateUserRequest,
  CreateUserResponse,
  DeductionLogRow,
  DeleteAddonIngredientParams,
  DeleteDrinkRecipeParams,
  Discount,
  DrinkRecipe,
  ErrorBody,
  ExportOrdersParams,
  ExportResponse,
  ForceCloseRequest,
  InventoryDiscrepancy,
  ItemSize,
  ListAddonItemsParams,
  ListBranchesParams,
  ListBundlesParams,
  ListCategoriesParams,
  ListDiscountsParams,
  ListMenuItemsParams,
  ListOrdersParams,
  ListTransfersParams,
  ListUsersParams,
  LoginRequest,
  LoginResponse,
  MeResponse,
  MenuItem,
  MenuItemFull,
  OpenShiftRequest,
  OptionalField,
  Order,
  OrderFull,
  Org,
  OrgBranchComparisonParams,
  OrgComparisonReport,
  OrgIngredient,
  OrgPaymentMethod,
  PaginatedBundles,
  PaginatedOrders,
  Permission,
  PermissionMatrix,
  PreviewIngredient,
  PreviewRecipeRequest,
  PublicMenuResponse,
  RolePermission,
  Shift,
  ShiftPreFill,
  ShiftReportResponse,
  ShiftSummary,
  TellerStats,
  TimeseriesPoint,
  UpdateAddonItemRequest,
  UpdateAddonSlotRequest,
  UpdateBranchRequest,
  UpdateBundleRequest,
  UpdateCatalogItemRequest,
  UpdateCategoryRequest,
  UpdateDiscountRequest,
  UpdateMenuItemRequest,
  UpdateOptionalFieldRequest,
  UpdateOrgRequest,
  UpdatePaymentMethodRequest,
  UpdateStockRequest,
  UpdateTransferRequest,
  UpdateUserRequest,
  UploadImageMultipart,
  UploadLogoMultipart,
  UploadResponse,
  UpsertAddonIngredientRequest,
  UpsertAddonOverrideRequest,
  UpsertDrinkRecipeRequest,
  UpsertPermissionRequest,
  UpsertRolePermissionRequest,
  UpsertSizeRequest,
  UserBranch,
  UserPublic,
  VoidOrderRequest
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

export const listMenuItems = (
    params: ListMenuItemsParams,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<MenuItemFull[]>(
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







export const shiftInventoryDiscrepancies = (
    shiftId: string,
 options?: SecondParameter<typeof customInstance>,signal?: AbortSignal
) => {


      return customInstance<InventoryDiscrepancy[]>(
      {url: `/reports/shifts/${shiftId}/inventory`, method: 'GET', signal
    },
      options);
    }




export const getShiftInventoryDiscrepanciesQueryKey = (shiftId: string,) => {
    return [
    `/reports/shifts/${shiftId}/inventory`
    ] as const;
    }


export const getShiftInventoryDiscrepanciesQueryOptions = <TData = Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError = ErrorBody>(shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getShiftInventoryDiscrepanciesQueryKey(shiftId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>> = ({ signal }) => shiftInventoryDiscrepancies(shiftId, requestOptions, signal);





   return  { queryKey, queryFn, enabled: shiftId !== null && shiftId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ShiftInventoryDiscrepanciesQueryResult = NonNullable<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>>
export type ShiftInventoryDiscrepanciesQueryError = ErrorBody


export function useShiftInventoryDiscrepancies<TData = Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError = ErrorBody>(
 shiftId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>,
          TError,
          Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useShiftInventoryDiscrepancies<TData = Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>,
          TError,
          Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>
        > , 'initialData'
      >, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useShiftInventoryDiscrepancies<TData = Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useShiftInventoryDiscrepancies<TData = Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError = ErrorBody>(
 shiftId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof shiftInventoryDiscrepancies>>, TError, TData>>, request?: SecondParameter<typeof customInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getShiftInventoryDiscrepanciesQueryOptions(shiftId,options)

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

