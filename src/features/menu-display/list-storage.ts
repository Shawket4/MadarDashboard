/**
 * The customer's list on the menu without prices, kept for the visit.
 *
 * Session storage, not local: a list is for this sitting, and the next person
 * to open the shop's menu on a shared tablet should not find it. Its own key,
 * never the ordering basket's — on a shop's own host both pages share one
 * origin, and a list carries no prices an order could be built from.
 */
import type { CartLine } from "@/features/public-ordering/types";

const key = (orgId: string, branchId: string) => `madar_menu_list:${orgId}:${branchId}`;

export function loadList(orgId: string, branchId: string): CartLine[] {
  try {
    const raw = sessionStorage.getItem(key(orgId, branchId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function saveList(orgId: string, branchId: string, lines: CartLine[]): void {
  try {
    if (lines.length === 0) sessionStorage.removeItem(key(orgId, branchId));
    else sessionStorage.setItem(key(orgId, branchId), JSON.stringify(lines));
  } catch {
    /* storage unavailable: the list lasts as long as the page */
  }
}
