/* tslint:disable */
/* eslint-disable */
/**
 * A choice group attached to an item (`menu_item_modifier_groups` over an
 * active `modifier_groups` row), with the attachment's overrides resolved.
 */
export interface GroupView {
    id: string;
    /**
     * `COALESCE(min_override, min_selections)`.
     */
    min?: number;
    /**
     * `COALESCE(is_required_override, is_required)`.
     */
    is_required?: boolean;
    /**
     * `none` | `adds` | `swaps`.
     */
    effect?: string;
    /**
     * The legacy add-on type the group was made from (`milk_type`, …).
     */
    legacy_type?: string | null;
    /**
     * The attachment's allow-list; `None` offers every option.
     */
    included?: string[] | null;
    options?: GroupOption[];
}

/**
 * A combo as a branch sells it.
 */
export interface ComboView {
    id: string;
    /**
     * P: the combo's `one_size` price, branch-effective.
     */
    price: number;
    is_active?: boolean;
    slots: SlotView[];
    /**
     * No window = always on sale.
     */
    windows?: Window[];
}

/**
 * A line as the till or the order payload states it.
 */
export interface Selection {
    size_label?: string | null;
    /**
     * The picked options (add-on items), in the order they were picked.
     */
    options?: Pick[];
    /**
     * The picked optional fields. A repeated id is charged again, as the
     * server does; the till never sends one twice.
     */
    optionals?: string[];
}

/**
 * A line's options and optional fields, priced.
 */
export interface PricedOptions {
    /**
     * The options as charged: one of each swap family (the last pick), in
     * the order they were picked.
     */
    options: PricedOption[];
    optionals: PricedOptional[];
    /**
     * Σ option price × quantity, per unit of the line.
     */
    option_total: number;
    /**
     * Σ optional-field price, per unit of the line.
     */
    optional_total: number;
    /**
     * What the rule set aside or dropped, for a log or a preview.
     */
    notes?: Note[];
}

/**
 * A menu item and the options a line of it may pick.
 */
export interface CatalogView {
    item: ItemView;
    /**
     * The options (add-on items) a selection may name. Extra entries are
     * harmless; a picked id that is not here is [`crate::PriceError::UnknownOption`].
     */
    options?: OptionView[];
}

/**
 * A priced combo line.
 */
export interface ComboQuote {
    /**
     * P, per combo unit.
     */
    price: number;
    /**
     * n: combo units on the line.
     */
    quantity: number;
    /**
     * One combo unit with its surcharges and add-ons.
     */
    unit_total: number;
    /**
     * One combo unit's picks à la carte at their chosen sizes, with add-ons.
     */
    list_unit: number;
    /**
     * `list_unit − unit_total` (negative when the combo costs more).
     */
    saving_unit: number;
    /**
     * In slot order (slot sort, slot position, then input order).
     */
    parts: PartQuote[];
}

/**
 * A priced line.
 */
export interface PricedLine extends PricedOptions {
    /**
     * One unit of the item at its size, before any option.
     */
    unit_price: number;
}

/**
 * A received line, judged. `difference` = received − sent (negative when
 * short), in the unit, to the thousandth.
 */
export interface LineCheck {
    arrival: Arrival;
    difference: number;
}

/**
 * A recipe line: its quantity in the ingredient's base unit and its cost per
 * base unit in piastres, `None` when the ingredient has no cost (or the line
 * links no ingredient).
 */
export interface CostLine {
    qty: number;
    cost_per_unit: number | null;
}

/**
 * A recipe's cost: the known lines' exact sum, rounded once.
 */
export interface RecipeCost {
    piastres: number;
    /**
     * `false` when any line has no cost: `piastres` is then a partial sum,
     * and the server shows no margin for it.
     */
    complete: boolean;
}

/**
 * A reconciliation line to store.
 */
export interface TillLine {
    method: string;
    payment_method_id: string | null;
    is_cash: boolean;
    system_total: number;
    order_count: number;
    status: string;
    declared_amount: number | null;
    note: string | null;
}

/**
 * A size and what it costs at the branch.
 */
export interface SizeView {
    label: string;
    /**
     * The catalogue price (`menu_item_sizes.price`); `None` when only a
     * branch override names this label.
     */
    price?: number | null;
    is_active?: boolean;
    /**
     * The branch's price for this size (`branch_menu_size_overrides`).
     */
    branch_price?: number | null;
}

/**
 * An allowed transfer action: the side that takes it, the capability
 * it needs (its key) and the status it leads to.
 */
export interface TransferStep {
    side: Side;
    cap: string;
    next: TransferStatus;
}

/**
 * An ingredient an option names.
 */
export interface IngredientRef {
    id: string;
    name: string;
    unit: string;
}

/**
 * An option (add-on item) as the rule reads it.
 */
export interface OptionView {
    id: string;
    name: string;
    /**
     * The add-on type (`milk_type`, `coffee_type`, `extra`, …).
     */
    kind: string;
    /**
     * The branch-effective price.
     */
    price: number;
    group_id?: string | null;
    /**
     * The group's effect (`none` | `adds` | `swaps`); `None` when the
     * option belongs to no group.
     */
    effect?: string | null;
    swap_category_id?: string | null;
    swap_category_slug?: string | null;
    /**
     * The ingredient an explicit swap option names as its replacement.
     */
    replaces?: IngredientRef | null;
    /**
     * Its ingredient lines, in the server's order (ingredient name, then id).
     */
    ingredients?: IngredientLine[];
    /**
     * Per-size ingredient lines (menu modeling B9).
     */
    sized?: SizedLine[];
}

/**
 * An option a swap may be charged over.
 */
export interface BaseCandidate {
    option_id: string;
    name: string;
    /**
     * The add-on type (`milk_type`, `coffee_type`, `extra`, …).
     */
    kind: string;
    /**
     * Its branch-effective price.
     */
    price: number;
    group_id?: string | null;
    /**
     * Its group's swap category (whatever the group's effect).
     */
    swap_category_id?: string | null;
}

/**
 * An optional field of the item.
 */
export interface OptionalView {
    id: string;
    price: number;
    /**
     * Offered on this size only.
     */
    size_label?: string | null;
}

/**
 * How one line arrived.
 */
export type Arrival = "exact" | "short" | "over";

/**
 * How one option relates to the drink's recipe.
 */
export interface SwapTarget {
    /**
     * Ingredient category slug of the recipe line the choice replaces.
     */
    slug: string;
    /**
     * The group's explicit swap category; `None` = inferred from the type.
     */
    category_id?: string | null;
    /**
     * Family key: two choices with the same key cannot share a line.
     */
    family: string;
}

/**
 * One ingredient line of an option (`addon_item_ingredients`).
 */
export interface IngredientLine {
    id?: string | null;
    name: string;
    unit: string;
}

/**
 * One ingredient, one branch, one warehouse. All in the base stock unit.
 */
export interface ReplenishInput {
    on_hand: number;
    par_min: number;
    par_max: number | null;
    /**
     * Σ `qty_sent` of `dispatched` transfers to this branch.
     */
    in_transit: number;
    /**
     * Σ line quantities of `requested`/`draft` transfers to this branch.
     */
    open_inbound: number;
    /**
     * The warehouse's on hand.
     */
    warehouse_on_hand: number;
    /**
     * Σ line quantities of the warehouse's `draft` transfers to anyone.
     */
    warehouse_drafted_out: number;
}

/**
 * One menu item, priced for one branch.
 */
export interface ItemView {
    id: string;
    /**
     * The branch's item-level price override (`branch_menu_overrides`):
     * what a line with no size costs, and the fallback for a size the item
     * no longer sells.
     */
    branch_price?: number | null;
    /**
     * Every size the item has, and every size label the branch overrides,
     * in the item's display order (sort, then label).
     */
    sizes?: SizeView[];
    /**
     * The recipe size a line with no size is made from: the item's first
     * size (active first, then sort, then label) among the recipe's own
     * labels. `None` = no recipe at all (the server then reads `one_size`).
     */
    default_recipe_size?: string | null;
    /**
     * The recipe's lines, per size, in the server's order (size label, then
     * ingredient name). Only what the rule reads: the ingredient and its
     * category slug.
     */
    recipe?: RecipeLine[];
    /**
     * For each ingredient of the recipe: the options that carry it (as an
     * ingredient line, or as the ingredient they replace), in the server's
     * order (active first, then sort — missing last — then name, then id).
     * A swap is charged over the first candidate of the chosen option's
     * family, the chosen option's own group first.
     */
    bases?: BaseCandidates[];
    /**
     * The item's active optional fields.
     */
    optionals?: OptionalView[];
    /**
     * The choice groups attached to the item (active groups only), in the
     * server's order (attachment sort, then group name, then id; options by
     * sort, then name, then id). Read by the staff comp's input builder
     * ([`crate::staff`]), not by the pricing rule. Empty from a server older
     * than v0.4.0, which did not send it.
     */
    groups?: GroupView[];
}

/**
 * One option as charged.
 */
export interface PricedOption {
    id: string;
    /**
     * The quantity charged (at least 1; a swap-family pick beside another
     * pick is always 1).
     */
    quantity: number;
    /**
     * The charge per unit of this option.
     */
    unit_price: number;
    /**
     * The option replaced part of the recipe (a swap, or the recipe's own
     * choice) rather than adding to it.
     */
    is_swap: boolean;
    /**
     * It is the recipe's own ingredient: charged nothing.
     */
    is_base: boolean;
    /**
     * An add-on that carries ingredient lines of its own.
     */
    has_ingredients: boolean;
    /**
     * What it swaps: set for every option of a swap family.
     */
    target?: SwapTarget | null;
    /**
     * The recipe ingredient it would replace, when the recipe has one.
     */
    base_ingredient?: string | null;
    /**
     * The ingredient it swaps in.
     */
    replacement?: Replacement | null;
    /**
     * The option a swap is charged over (the recipe's own choice).
     */
    over?: Over | null;
}

/**
 * One option of a choice group, priced for the branch.
 */
export interface GroupOption {
    id: string;
    /**
     * The catalogue price (`addon_items.default_price`).
     */
    price: number;
    /**
     * The branch's price (`branch_addon_overrides.price_override`).
     */
    branch_price?: number | null;
    is_default?: boolean;
    /**
     * The option, its add-on item and the branch's availability all on.
     */
    is_active?: boolean;
}

/**
 * One optional field as charged.
 */
export interface PricedOptional {
    id: string;
    price: number;
}

/**
 * One part line of a combo line. The `unit`/per-pick figures are for ONE
 * combo unit; the rest are for the whole line (n combo units).
 */
export interface PartQuote {
    /**
     * Index into the input picks.
     */
    pick_index: number;
    slot_id: string;
    menu_item_id: string;
    /**
     * The pick's size, else its included size.
     */
    size_label: string;
    included_size_label: string;
    /**
     * Units per combo unit.
     */
    pick_quantity: number;
    /**
     * The part line's quantity: pick quantity × n.
     */
    quantity: number;
    /**
     * The item's normal price at the chosen size (so `unit_price × quantity
     * − line_total` is what the combo saved on this line).
     */
    unit_price: number;
    /**
     * This part's share of ONE P.
     */
    share_unit: number;
    /**
     * Per pick unit: the choice's surcharge + the size's extra.
     */
    surcharge_unit: number;
    /**
     * n × share_unit.
     */
    combo_share: number;
    /**
     * n × pick quantity × surcharge_unit.
     */
    combo_surcharge: number;
    /**
     * combo_share + combo_surcharge.
     */
    line_total: number;
    /**
     * The pick's add-ons and optional fields, priced per unit of the part.
     */
    options: PricedOptions;
    /**
     * option_total + optional_total, per unit of the part.
     */
    extras_unit: number;
    /**
     * extras_unit × quantity.
     */
    addons_total: number;
}

/**
 * One per-size ingredient line of an option (`recipe_lines`).
 */
export interface SizedLine {
    size_label: string;
    id: string;
    name: string;
    unit: string;
}

/**
 * One pick, with its item's view (branch-priced) and its category.
 */
export interface PickIn {
    slot_id: string;
    view: CatalogView;
    /**
     * The picked item's category (a category choice admits it by this).
     */
    category_id?: string | null;
    /**
     * Its size, add-ons and optional fields.
     */
    selection?: Selection;
    /**
     * Units per combo unit.
     */
    quantity?: number;
}

/**
 * One picked option.
 */
export interface Pick {
    id: string;
    quantity?: number;
}

/**
 * One recipe line, as far as the swap rule reads it.
 */
export interface RecipeLine {
    size_label: string;
    /**
     * The ingredient's category slug (`milk`, `coffee_bean`, …); `None`
     * for a line with no ingredient.
     */
    category?: string | null;
    ingredient_id?: string | null;
}

/**
 * One slot: what a customer picks `min..=max` of.
 */
export interface SlotView {
    id: string;
    name?: string;
    sort?: number;
    min: number;
    max: number;
    default_item_id?: string | null;
    default_size_label?: string | null;
    choices: ChoiceView[];
}

/**
 * One window, as the `sale_windows` row and the feed carry it.
 */
export interface Window {
    /**
     * `None` = every branch.
     */
    branch_id?: string | null;
    /**
     * bit0 = Sunday … bit6 = Saturday; 127 = every day.
     */
    weekdays?: number;
    starts_at?: string | null;
    ends_at?: string | null;
    /**
     * The first day (inclusive) the window starts on.
     */
    valid_from?: string | null;
    /**
     * The last day (inclusive) the window starts on.
     */
    valid_to?: string | null;
}

/**
 * Something the rule set aside.
 */
export type Note = { note: "collapsed_family" } | { note: "optional_not_found"; id: string } | { note: "optional_size_mismatch"; id: string; size_label: string };

/**
 * The ingredient a swap puts in the cup.
 */
export interface Replacement {
    id: string | null;
    name: string;
    unit: string;
}

/**
 * The option a swap is charged over.
 */
export interface Over {
    id: string;
    name: string;
    price: number;
}

/**
 * The options carrying one recipe ingredient, in the server's order.
 */
export interface BaseCandidates {
    ingredient_id: string;
    candidates?: BaseCandidate[];
}

/**
 * The server's 400 message for a quantity it cannot convert.
 */
export interface UnitRefusal {
    error: string;
}

/**
 * What a slot admits: one item, or every `kind = 'item'` item of a category.
 */
export interface ChoiceView {
    id?: string | null;
    menu_item_id?: string | null;
    category_id?: string | null;
    /**
     * Per pick unit (C9's per-choice surcharge).
     */
    surcharge?: number;
    /**
     * The size P covers; `None` = the item's cheapest active size.
     */
    included_size_label?: string | null;
    /**
     * The owner's price for a bigger size; a size with no row costs its
     * usual difference over the included size.
     */
    size_surcharges?: SizeSurcharge[];
    sort?: number;
}

/**
 * What the system says one payment method took on a till.
 */
export interface TillTotal {
    method: string;
    payment_method_id: string | null;
    is_cash: boolean;
    system_total: number;
    order_count: number;
}

/**
 * What the teller said about one method: `checked` | `disagreed`.
 */
export interface TillInput {
    method: string;
    status: string;
    declared_amount: number | null;
    note: string | null;
}

/**
 * Where a food cost (cost ÷ price) sits; the margin badge uses the same
 * cut-offs.
 */
export type Band = "good" | "fair" | "poor";

/**
 * Whose location the caller must work at to take an action.
 */
export type Side = "source" | "destination";

/**
 * Why a combo line cannot be priced. [`ComboRefusal::code`] is the API's.
 */
export type ComboRefusal = { refusal: "unknown_slot"; slot_id: string } | { refusal: "too_few"; slot_id: string; min: number; got: number } | { refusal: "too_many"; slot_id: string; max: number; got: number } | { refusal: "not_allowed"; slot_id: string; menu_item_id: string } | { refusal: "bad_quantity"; slot_id: string } | { refusal: "price"; menu_item_id: string; error: PriceError };

/**
 * Why a line cannot be priced. The server answers the first with a 400 and
 * the second with a 404; the till drops an unknown option before it asks.
 */
export type PriceError = { error: "no_priced_size" } | { error: "unknown_option"; id: string };

/**
 * Why a live close's inputs were refused: `code` is the API's
 * (`RECONCILIATION_AMOUNT_REQUIRED`, `RECONCILIATION_NOTE_REQUIRED`), or
 * `null` for a status that is neither `checked` nor `disagreed`.
 */
export interface TillRefusal {
    code: string | null;
    method: string;
}

export interface ReplenishSuggestion {
    /**
     * What the branch is short of after what is already coming.
     */
    need: number;
    /**
     * What the warehouse can still promise.
     */
    available: number;
    /**
     * `min(need, available)`.
     */
    suggested: number;
}

export interface SizeSurcharge {
    size_label: string;
    surcharge: number;
}

export type Action = "edit" | "accept" | "decline" | "dispatch" | "receive" | "cancel";

export type ReceiveRefusal = "negative" | "over_needs_note";

export type TransferStatus = "requested" | "draft" | "dispatched" | "received" | "cancelled";


/**
 * Net sales over orders, rounded half up; 0 with no orders.
 */
export function average_ticket(net_sales: number, order_count: number): number;

/**
 * What a stored discount rule (`discount_type`, `value` as a decimal
 * string: `"0.10"` is 10 % off) takes off `subtotal`, clamped to
 * `[0, subtotal]` (madar-money `bill::rule_of` + `discount_on`).
 */
export function bill_discount(subtotal: number, discount_type: string | null | undefined, value: string): number;

/**
 * The branch-local business date of an instant (epoch ms).
 */
export function business_date(tz: string, at_ms: number): string;

/**
 * One received line, judged (a note of only whitespace is no note).
 */
export function check_receive_line(qty_sent: number, qty_received: number, note?: string | null): LineCheck | ReceiveRefusal;

/**
 * The choice of `slot` that admits an item: its own item choice first,
 * else the category choice; `null` when none does.
 */
export function combo_choice_for(slot: SlotView, menu_item_id: string, category_id?: string | null): ChoiceView | null;

/**
 * A combo line of `n` units (madar-catalog `combo::quote`).
 */
export function combo_quote(combo: ComboView, picks: PickIn[], n: number): ComboQuote | ComboRefusal;

/**
 * `qty` in `from_unit` as `to_unit`, 3 dp; across families a refusal.
 */
export function convert(qty: number, from_unit: string, to_unit: string): number | UnitRefusal;

/**
 * [`convert`], with mass↔volume bridged by a positive density (g/ml).
 */
export function convert_with_density(qty: number, from_unit: string, to_unit: string, density_g_per_ml?: number | null): number | UnitRefusal;

/**
 * A branch-local calendar day as `[start, end)` in epoch ms (DST days
 * are 23 or 25 hours).
 */
export function day_bounds(tz: string, date: string): [number, number];

/**
 * The order dialog's line estimate in piastres; `null` without a cost,
 * a quantity above 0, or units of one family.
 */
export function estimate_line_total(cost_per_stock_unit: number | null | undefined, qty: number, purchase_unit: string, stock_unit: string): number | null;

/**
 * The food-cost band of `cost` against `price`; `null` unless `price > 0`.
 */
export function food_cost_band(cost: number, price: number): Band | null;

/**
 * Whether a counted row needs a reason: off by at least `pct` % of the
 * book, or stock from zero.
 */
export function is_variance_flagged(book: number, counted: number, pct: number): boolean;

/**
 * One recipe line's cost in whole piastres.
 */
export function line_cost(qty: number, cost_per_unit: number): number;

/**
 * `(price − cost) / price`; `null` unless `price > 0`.
 */
export function margin(price: number, cost: number): number | null;

/**
 * What `option_id` alone is charged on a line of `size_label`; `null`
 * for an option not in the view.
 */
export function option_charge(view: CatalogView, size_label: string | null | undefined, option_id: string): number | null;

/**
 * The pay window `[start, end]` (inclusive dates) holding `day`;
 * `start_day` is clamped to 1–28.
 */
export function pay_period(day: string, start_day: number): [string, string];

/**
 * The canonical phone (E.164 digits, no `+`), or `null` when `raw` is
 * not a phone number.
 */
export function phone_canonical(raw: string): string | null;

/**
 * A menu-item line: its size price, then its options.
 */
export function price_line(view: CatalogView, selection: Selection): PricedLine | PriceError;

/**
 * A line's options and optional fields, priced without its size.
 */
export function price_options(view: CatalogView, selection: Selection): PricedOptions | PriceError;

/**
 * A quantity as `numeric(12,3)` holds it: 3 dp, half away from zero.
 */
export function quantity_dec(q: number): number;

/**
 * What a recipe line stores: converted to the base unit, grossed up by
 * the yield loss, 3 dp.
 */
export function recipe_base_qty(qty: number, unit: string, base_unit: string, density_g_per_ml?: number | null, yield_pct?: number | null): number | UnitRefusal;

/**
 * A recipe's cost: the known lines' exact sum, rounded once.
 */
export function recipe_cost(lines: CostLine[]): RecipeCost;

/**
 * How much a warehouse should send a branch.
 */
export function replenish_suggest(input: ReplenishInput): ReplenishSuggestion;

/**
 * The close's reconciliation lines (madar-till `reconcile::plan_lines`):
 * the cash line first, then each non-cash method used, then inputs
 * naming a method not used. `replay` never refuses.
 */
export function till_plan_lines(totals: TillTotal[], closing_cash_declared: number, closing_cash_system: number, cash_note: string | null | undefined, inputs: TillInput[], replay: boolean): TillLine[] | TillRefusal;

/**
 * What `action` needs and leads to in `status`; `null` when it is not
 * open there.
 */
export function transfer_step(status: TransferStatus, action: Action): TransferStep | null;

/**
 * The unit cost (8 dp) a typed line total implies; `null` unless
 * `line ≥ 0` and the 3 dp quantity is above 0.
 */
export function unit_cost_from_total(line: number, qty: number): number | null;

/**
 * One unit of the item at `size_label` before any option (madar-catalog
 * `unit_price`).
 */
export function unit_price(item: ItemView, size_label?: string | null): number | PriceError;

/**
 * A unit's `[family, factor to the family's canonical unit]`, or `null`.
 */
export function unit_spec(unit: string): [string, number] | null;

/**
 * The units a quantity stocked in `base` may be typed in.
 */
export function units_of(base: string): string[];

/**
 * The usable amount a stored recipe quantity stands for, 3 dp.
 */
export function usable_qty(stored: number, yield_pct?: number | null): number;

/**
 * The Saturday the week holding `date` starts on.
 */
export function week_start(date: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly average_ticket: (a: number, b: number) => [number, number, number];
    readonly bill_discount: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly business_date: (a: number, b: number, c: number) => [number, number, number, number];
    readonly check_receive_line: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly combo_choice_for: (a: any, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly combo_quote: (a: any, b: number, c: number, d: number) => [number, number, number];
    readonly convert: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly convert_with_density: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly day_bounds: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly estimate_line_total: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly food_cost_band: (a: number, b: number) => [number, number, number];
    readonly is_variance_flagged: (a: number, b: number, c: number) => number;
    readonly line_cost: (a: number, b: number) => number;
    readonly margin: (a: number, b: number) => [number, number, number];
    readonly option_charge: (a: any, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly pay_period: (a: number, b: number, c: number) => [number, number, number];
    readonly phone_canonical: (a: number, b: number) => [number, number, number];
    readonly price_line: (a: any, b: any) => [number, number, number];
    readonly price_options: (a: any, b: any) => [number, number, number];
    readonly quantity_dec: (a: number) => number;
    readonly recipe_base_qty: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly recipe_cost: (a: number, b: number) => [number, number, number];
    readonly replenish_suggest: (a: any) => [number, number, number];
    readonly till_plan_lines: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly transfer_step: (a: any, b: any) => [number, number, number];
    readonly unit_cost_from_total: (a: number, b: number) => [number, number, number];
    readonly unit_price: (a: any, b: number, c: number) => [number, number, number];
    readonly unit_spec: (a: number, b: number) => [number, number, number];
    readonly units_of: (a: number, b: number) => [number, number];
    readonly usable_qty: (a: number, b: number, c: number) => number;
    readonly week_start: (a: number, b: number) => [number, number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
