import type { StudioAggregate } from "@/data/api/generated/models";
import type { PreviewRequest, ServiceMode } from "../../recipe/modeling-api";

export interface PreviewOption {
  id: string;
  name: string;
  price: number;
}

export interface PreviewGroup {
  id: string;
  name: string;
  /** Radio-like: picking one replaces the previous pick. */
  single: boolean;
  required: boolean;
  max: number | null;
  options: PreviewOption[];
}

export interface PreviewSelection {
  size: string | null;
  /** Group id → picked option ids. Absent = not touched yet (recipe default applies). */
  picks: Record<string, string[]>;
  /** Item-private optional-field ids. */
  optionals: string[];
  service: ServiceMode;
  quantity: number;
}

export const EMPTY_SELECTION: PreviewSelection = { size: null, picks: {}, optionals: [], service: "takeaway", quantity: 1 };

/** Offered, active options of each attached group, in the order the POS shows them. */
export const toPreviewGroups = (s: StudioAggregate): PreviewGroup[] =>
  [...s.modifier_groups]
    .sort((a, b) => a.sort - b.sort)
    .map((g) => ({
      id: g.group_id,
      name: g.name,
      single: g.selection_type === "single" || g.max === 1,
      required: g.is_required || g.min > 0,
      max: g.max ?? null,
      options: g.options.filter((o) => o.included && o.is_active).map((o) => ({ id: o.id, name: o.name, price: o.price })),
    }))
    .filter((g) => g.options.length > 0);

/** The ids currently chosen in a group: explicit picks, else the recipe default. */
export const pickedIn = (sel: PreviewSelection, groupId: string, defaults: Record<string, string>): string[] =>
  sel.picks[groupId] ?? (defaults[groupId] ? [defaults[groupId]] : []);

export function togglePick(
  sel: PreviewSelection,
  group: PreviewGroup,
  optionId: string,
  defaults: Record<string, string>,
): PreviewSelection {
  const current = pickedIn(sel, group.id, defaults);
  const on = current.includes(optionId);
  let next: string[];
  if (group.single) {
    next = on ? (group.required ? current : []) : [optionId];
  } else if (on) {
    next = current.filter((id) => id !== optionId);
  } else {
    next = group.max != null && current.length >= group.max ? current : [...current, optionId];
  }
  return { ...sel, picks: { ...sel.picks, [group.id]: next } };
}

export const toggleOptional = (sel: PreviewSelection, id: string): PreviewSelection => ({
  ...sel,
  optionals: sel.optionals.includes(id) ? sel.optionals.filter((x) => x !== id) : [...sel.optionals, id],
});

export function toPreviewBody(
  sel: PreviewSelection,
  groups: PreviewGroup[],
  defaults: Record<string, string>,
): PreviewRequest {
  const option_ids = [...groups.flatMap((g) => pickedIn(sel, g.id, defaults)), ...sel.optionals];
  return {
    ...(sel.size ? { size_label: sel.size } : {}),
    option_ids,
    quantity: Math.max(1, Math.floor(sel.quantity) || 1),
    service_mode: sel.service,
  };
}
