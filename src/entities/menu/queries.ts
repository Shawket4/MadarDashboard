import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { addonApi, categoryApi, menuItemApi, optionalApi, publicMenuApi, slotApi } from "./api";

// Caching configuration similar to apex project
const MENU_CACHE_OPTS = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 15 * 60 * 1000, // 15 minutes
  refetchOnWindowFocus: false, // Prevent refetching static menu data just from switching tabs
};

export const useCategories = (orgId: string | null) =>
  useQuery({ 
    queryKey: QUERY_KEYS.categories(orgId ?? ""), 
    queryFn: () => categoryApi.list(orgId!), 
    enabled: !!orgId,
    ...MENU_CACHE_OPTS,
  });

export const useMenuItems = (orgId: string | null, categoryId?: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.menuItems(orgId ?? "", categoryId),
    queryFn: () => menuItemApi.list(orgId!, categoryId),
    enabled: !!orgId,
    ...MENU_CACHE_OPTS,
  });

export const useMenuItem = (id: string | null) =>
  useQuery({ 
    queryKey: QUERY_KEYS.menuItem(id ?? ""), 
    queryFn: () => menuItemApi.get(id!), 
    enabled: !!id,
    ...MENU_CACHE_OPTS,
  });

export const useAddons = (orgId: string | null, type?: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.addons(orgId ?? "", type),
    queryFn: () => addonApi.list(orgId!, type),
    enabled: !!orgId,
    ...MENU_CACHE_OPTS,
  });

export const useSlots = (menuItemId: string | null) =>
  useQuery({ 
    queryKey: QUERY_KEYS.slots(menuItemId ?? ""), 
    queryFn: () => slotApi.list(menuItemId!), 
    enabled: !!menuItemId,
    ...MENU_CACHE_OPTS,
  });

export const useOptionals = (menuItemId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.optionals(menuItemId ?? ""),
    queryFn: () => optionalApi.list(menuItemId!),
    enabled: !!menuItemId,
    ...MENU_CACHE_OPTS,
  });

export const usePublicMenu = (orgId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.publicMenu(orgId ?? ""),
    queryFn: () => publicMenuApi.get(orgId!),
    enabled: !!orgId,
    ...MENU_CACHE_OPTS,
  });
