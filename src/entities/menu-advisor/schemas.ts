import { z } from "zod";

// --- Enums & Basic Types ---
export const QuadrantSchema = z.enum(["star", "plowhorse", "puzzle", "dog", "insufficient"]);
export type Quadrant = z.infer<typeof QuadrantSchema>;

export const ActionSchema = z.enum(["hold", "raise_price", "lower_price", "remove", "reformulate", "monitor"]);
export type Action = z.infer<typeof ActionSchema>;

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const DecisionSchema = z.enum(["accepted", "rejected", "ignored"]);
export type Decision = z.infer<typeof DecisionSchema>;

// --- API Payloads & Filters ---
export interface PriceSuggestionFilter {
  classification_mode?: "cm" | "revenue" | "insufficient";
  cm_quadrant?: Quadrant;
  revenue_class?: "a" | "b" | "c" | "d";
  action?: Action;
  confidence?: Confidence;
  category_id?: string;
  decision_status?: Decision | "pending";
  search?: string;
}

export interface BundleSuggestionFilter {
  missing_costs?: boolean;
  focus_menu_item_id?: string;
  decision_status?: Decision | "pending";
}

export interface RemovalScenarioFilter {
  recommendation?: Action;
  decision_status?: Decision | "pending";
}

// --- Domain Models ---
export interface DecisionRecord {
  id: string;
  suggestion_id: string;
  suggestion_kind: "price" | "bundle" | "removal";
  branch_id: string;
  decision: Decision;
  notes?: string;
  decided_by: string;
  decided_at: string;
}

export interface PriceSuggestionRecord {
  id: string;
  run_id: string;
  branch_id: string;
  created_at: string;
  decision?: DecisionRecord;
  suggestion: {
    menu_item_id: string;
    size_label: string;
    item_name: string;
    category_id?: string;
    classification_mode: string;
    cm_quadrant?: Quadrant;
    revenue_class?: string;
    current_price: number;
    units_sold_raw: number;
    effective_price: number;
    popularity_share: number;
    cm_per_unit?: number;
    margin_pct?: number;
    food_cost_pct?: number;
    suggested_price: number;
    suggested_delta_abs: number;
    suggested_delta_pct: number;
    action: Action;
    confidence: Confidence;
    explanation: string;
    price_changed_in_window: boolean;
    cost_reduction_whatif_margin?: number;
    cost_missing: boolean;
  };
}

export interface BundleSuggestionRecord {
  id: string;
  run_id: string;
  branch_id: string;
  created_at: string;
  decision?: DecisionRecord;
  promoted_bundle_id?: string;
  suggestion: {
    focus_item: { menu_item_id: string; size_label: string };
    bundle_items: { menu_item_id: string; size_label: string }[];
    bundle_list_price: number;
    bundle_suggested_price: number;
    bundle_discount_pct: number;
    bundle_cost?: number;
    bundle_cm?: number;
    bundle_margin_pct?: number;
    association: {
      composite_score: number;
    };
    forecast: {
      expected_velocity: { lo: number; mid: number; hi: number };
      total_units_uplift_x: number;
      incremental_cm?: { lo: number; mid: number; hi: number };
    };
    explanation: string;
    missing_costs: boolean;
  };
}

export interface RemovalScenarioRecord {
  id: string;
  run_id: string;
  branch_id: string;
  created_at: string;
  decision?: DecisionRecord;
  scenario: {
    key: { menu_item_id: string; size_label: string };
    item_name: string;
    baseline_cm: number;
    net_cm_change: number;
    recommendation: Action;
    explanation: string;
  };
}

export interface RunRecord {
  id: string;
  org_id: string;
  branch_id: string;
  status: "in_progress" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  error_message?: string;
}
