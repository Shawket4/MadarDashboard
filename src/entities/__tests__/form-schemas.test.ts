/**
 * Contract tests for every react-hook-form Zod schema.
 *
 * Each test parses a payload shaped EXACTLY like what the form's rendered
 * fields produce. If a schema requires a field the form never sets (e.g. a
 * page-injected org_id), zodResolver rejects the submit silently — no console
 * output, no network request. These tests pin that class of bug down.
 */
import { describe, expect, it } from "vitest";
import { loginSchema } from "../auth/schemas";
import { branchSchema } from "../branch/schemas";
import { createBundleSchema } from "../bundle/schemas";
import { discountSchema } from "../discount/schemas";
import { catalogSchema, addStockSchema, adjustmentSchema, transferSchema } from "../inventory/schemas";
import { categorySchema, menuItemSchema, updateMenuItemSchema, addonSchema, slotSchema, optionalSchema } from "../menu/schemas";
import { voidOrderSchema } from "../order/schemas";
import { orgSchema } from "../org/schemas";
import { paymentMethodSchema } from "../payment-method/schemas";
import { drinkRecipeSchema, addonRecipeSchema } from "../recipe/schemas";
import { openShiftSchema, closeShiftSchema, forceCloseSchema, cashMovementSchema } from "../shift/schemas";
import { createUserSchema, updateUserSchema } from "../user/schemas";

const expectParses = (result: { success: boolean; error?: unknown }) => {
  if (!result.success) {
    // surface the zod issues in the failure message
    throw new Error(`schema rejected form payload: ${JSON.stringify((result.error as { issues?: unknown })?.issues)}`);
  }
  expect(result.success).toBe(true);
};

describe("form schemas accept exactly what their forms render", () => {
  it("login", () => {
    expectParses(loginSchema.safeParse({ email: "a@b.com", password: "secret" }));
  });

  it("branch (printer hidden)", () => {
    expectParses(branchSchema.safeParse({
      name: "Downtown", address: "", phone: "", timezone: "Africa/Cairo",
      is_active: true, printer_brand: "none", printer_ip: "", printer_port: 9100,
    }));
  });

  it("bundle", () => {
    const schema = createBundleSchema(((k: string) => k) as never);
    expectParses(schema.safeParse({
      name: "Combo", name_translations: {}, description: "", description_translations: {},
      price: "120", available_from_time: "", available_until_time: "",
      available_from_date: "", available_until_date: "",
      components: [
        { item_id: "a", quantity: 1 },
        { item_id: "b", quantity: 2 },
      ],
      branch_ids: [],
    }));
  });

  it("discount (percentage and fixed)", () => {
    expectParses(discountSchema.safeParse({ name: "Happy hour", dtype: "percentage", percent_value: 10, is_active: true }));
    expectParses(discountSchema.safeParse({ name: "Flat", dtype: "fixed", fixed_value: "5", is_active: true }));
  });

  it("inventory: catalog / stock / adjustment / transfer", () => {
    expectParses(catalogSchema.safeParse({ name: "Milk", unit: "ml", category: "general", description: "", cost_per_unit: "1.5", is_active: true }));
    expectParses(catalogSchema.safeParse({ name: "Milk", unit: "ml", category: "general", description: "", cost_per_unit: "", is_active: true }));
    // ingredient costs are DECIMAL piastres — sub-piastre precision survives
    const precise = catalogSchema.safeParse({ name: "Sugar", unit: "g", category: "general", description: "", cost_per_unit: "0.005", is_active: true });
    expectParses(precise);
    if (precise.success) expect(precise.data.cost_per_unit).toBeCloseTo(0.5);
    expectParses(addStockSchema.safeParse({ org_ingredient_id: "ing-1", current_stock: 5, reorder_threshold: 1 }));
    expectParses(adjustmentSchema.safeParse({ branch_inventory_id: "bi-1", adjustment_type: "add", quantity: 2, note: "delivery" }));
    expectParses(transferSchema.safeParse({ source_branch_id: "b1", destination_branch_id: "b2", org_ingredient_id: "i1", quantity: 3, note: "" }));
  });

  it("menu: category dialog payload — org_id is page-injected, never a form field", () => {
    // regression: schema once required org_id → every save died silently
    expectParses(categorySchema.safeParse({
      name: "Drinks", name_translations: { ar: "مشروبات" }, display_order: 0, is_active: true,
    }));
  });

  it("AR translations are optional — untouched inputs register as undefined", () => {
    // regression: z.record(z.string()) rejected {ar: undefined} with "Required"
    // under every untouched AR field; the backend auto-translates empty AR
    const untouched = { name: "Drinks", name_translations: { ar: undefined }, display_order: 0, is_active: true };
    const parsed = categorySchema.safeParse(untouched);
    expectParses(parsed);
    // empty/whitespace AR is stripped so auto-translate fills it server-side
    if (parsed.success) expect(parsed.data.name_translations).toEqual({});
    const blank = categorySchema.safeParse({ ...untouched, name_translations: { ar: "  " } });
    expectParses(blank);
    if (blank.success) expect(blank.data.name_translations).toEqual({});
  });

  it("menu: item dialog payload (create requires category, update may clear it)", () => {
    const payload = {
      name: "Latte", name_translations: {}, description: "", description_translations: {},
      base_price: "45", category_id: "cat-1", is_active: true, display_order: 0,
      sizes: [{ label: "L", price_override: "55", display_order: 0 }],
    };
    expectParses(menuItemSchema.safeParse(payload));
    // create without category violates the backend contract → must fail
    expect(menuItemSchema.safeParse({ ...payload, category_id: "" }).success).toBe(false);
    // update may clear the category ("" → null at the call site)
    expectParses(updateMenuItemSchema.safeParse({ ...payload, category_id: "" }));
  });

  it("menu: addon dialog payload", () => {
    expectParses(addonSchema.safeParse({
      name: "Extra shot", name_translations: {}, addon_type: "coffee_extra",
      default_price: "10", display_order: 0, is_active: true,
    }));
  });

  it("menu: slot + optional dialogs", () => {
    expectParses(slotSchema.safeParse({
      addon_type: "milk", label: "", label_translations: {},
      is_required: false, min_selections: 0, max_selections: 1, display_order: 0,
    }));
    expectParses(optionalSchema.safeParse({
      name: "Sugar", name_translations: {}, org_ingredient_id: null,
      ingredient_name: "", ingredient_unit: "", quantity_used: 0, is_active: true,
    }));
  });

  it("order void", () => {
    expectParses(voidOrderSchema.safeParse({ reason: "customer_request", restore_inventory: true }));
  });

  it("org", () => {
    expectParses(orgSchema.safeParse({ name: "Cafe", slug: "cafe", currency_code: "EGP", tax_rate: 14, receipt_footer: "" }));
  });

  it("payment method", () => {
    expectParses(paymentMethodSchema.safeParse({
      name: "instapay", labelEn: "InstaPay", labelAr: "", color: "#fff", icon: "wallet", isCash: false, is_active: true,
    }));
  });

  it("recipes: drink + addon rows match the upsert contract field names", () => {
    expectParses(drinkRecipeSchema.safeParse({
      size_label: "one_size", org_ingredient_id: "i1", ingredient_name: "Milk", ingredient_unit: "ml", quantity_used: 200,
    }));
    // regression: schema once used a stray `unit` field while the contract's
    // required ingredient_unit stayed unset → silent submit failure
    expectParses(addonRecipeSchema.safeParse({
      org_ingredient_id: "i1", ingredient_name: "Almond milk", ingredient_unit: "ml", quantity_used: 100,
    }));
  });

  it("shifts: open / close / force-close / cash movement", () => {
    expectParses(openShiftSchema.safeParse({ opening_cash: "500" }));
    expectParses(closeShiftSchema.safeParse({ closing_cash_declared: "1200.50" }));
    expectParses(forceCloseSchema.safeParse({ reason: "left open overnight" }));
    expectParses(cashMovementSchema.safeParse({ direction: "out", amount: "50", note: "supplier" }));
  });

  it("users: create (org_id prefilled from context) + update", () => {
    expectParses(createUserSchema.safeParse({
      name: "Teller", email: "", phone: "", pin: "1234", password: "",
      org_id: "org-1", role: "teller", is_active: true,
    }));
    expectParses(updateUserSchema.safeParse({
      name: "Teller", email: "t@x.com", phone: "", pin: "", password: "",
      role: "branch_manager", is_active: true,
    }));
  });
});
