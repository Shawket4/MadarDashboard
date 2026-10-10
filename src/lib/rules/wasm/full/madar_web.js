/* @ts-self-types="./madar_web.d.ts" */

/**
 * What `days_absent` absent days cost at `deduction_days` docked each,
 * for a monthly `salary` over `working_days` (madar-dawam
 * `ladder::absence_deduction_piastres`; the day's minutes do not enter).
 * @param {number} salary
 * @param {number} working_days
 * @param {number} days_absent
 * @param {number} deduction_days
 * @returns {number}
 */
export function absence_deduction_piastres(salary, working_days, days_absent, deduction_days) {
    const ret = wasm.absence_deduction_piastres(salary, working_days, days_absent, deduction_days);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Net sales over orders, rounded half up; 0 with no orders.
 * @param {number} net_sales
 * @param {number} order_count
 * @returns {number}
 */
export function average_ticket(net_sales, order_count) {
    const ret = wasm.average_ticket(net_sales, order_count);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * What a stored discount rule (`discount_type`, `value` as a decimal
 * string: `"0.10"` is 10 % off) takes off `subtotal`, clamped to
 * `[0, subtotal]` (madar-money `bill::rule_of` + `discount_on`).
 * @param {number} subtotal
 * @param {string | null | undefined} discount_type
 * @param {string} value
 * @returns {number}
 */
export function bill_discount(subtotal, discount_type, value) {
    var ptr0 = isLikeNone(discount_type) ? 0 : passStringToWasm0(discount_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.bill_discount(subtotal, ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * The branch-local business date of an instant (epoch ms).
 * @param {string} tz
 * @param {number} at_ms
 * @returns {string}
 */
export function business_date(tz, at_ms) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(tz, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.business_date(ptr0, len0, at_ms);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * What a cart line is charged: one unit × its quantity.
 * @param {CartLineShape} line
 * @returns {number}
 */
export function cart_line_total(line) {
    const ret = wasm.cart_line_total(line);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * One unit of a cart line: an item's unit price and its extras, or a
 * combo's price and what its picks add.
 * @param {CartLineShape} line
 * @returns {number}
 */
export function cart_line_unit(line) {
    const ret = wasm.cart_line_unit(line);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * A cart's items total, before any deal, discount, tax or fee (the
 * cart quote's `items_total`).
 * @param {CartLineShape[]} lines
 * @returns {number}
 */
export function cart_subtotal(lines) {
    const ptr0 = passArrayJsValueToWasm0(lines, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.cart_subtotal(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * One received line, judged (a note of only whitespace is no note).
 * @param {number} qty_sent
 * @param {number} qty_received
 * @param {string | null} [note]
 * @returns {LineCheck | ReceiveRefusal}
 */
export function check_receive_line(qty_sent, qty_received, note) {
    var ptr0 = isLikeNone(note) ? 0 : passStringToWasm0(note, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.check_receive_line(qty_sent, qty_received, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * What one unit of a pick adds to the combo's price, from the public
 * menu's choice (its surcharge plus its size's extra); `null` is the
 * included size.
 * @param {MenuChoice} choice
 * @param {string | null} [size_label]
 * @returns {number}
 */
export function combo_choice_extra(choice, size_label) {
    var ptr0 = isLikeNone(size_label) ? 0 : passStringToWasm0(size_label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.combo_choice_extra(choice, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * The choice of `slot` that admits an item: its own item choice first,
 * else the category choice; `null` when none does.
 * @param {SlotView} slot
 * @param {string} menu_item_id
 * @param {string | null} [category_id]
 * @returns {ChoiceView | null}
 */
export function combo_choice_for(slot, menu_item_id, category_id) {
    const ptr0 = passStringToWasm0(menu_item_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    var ptr1 = isLikeNone(category_id) ? 0 : passStringToWasm0(category_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    const ret = wasm.combo_choice_for(slot, ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * What a combo's picks add to ONE combo unit.
 * @param {PickShape[]} picks
 * @returns {number}
 */
export function combo_extras(picks) {
    const ptr0 = passArrayJsValueToWasm0(picks, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.combo_extras(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * A combo line of `n` units (madar-catalog `combo::quote`).
 * @param {ComboView} combo
 * @param {PickIn[]} picks
 * @param {number} n
 * @returns {ComboQuote | ComboRefusal}
 */
export function combo_quote(combo, picks, n) {
    const ptr0 = passArrayJsValueToWasm0(picks, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.combo_quote(combo, ptr0, len0, n);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * `qty` in `from_unit` as `to_unit`, 3 dp; across families a refusal.
 * @param {number} qty
 * @param {string} from_unit
 * @param {string} to_unit
 * @returns {number | UnitRefusal}
 */
export function convert(qty, from_unit, to_unit) {
    const ptr0 = passStringToWasm0(from_unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(to_unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.convert(qty, ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * [`convert`], with mass↔volume bridged by a positive density (g/ml).
 * @param {number} qty
 * @param {string} from_unit
 * @param {string} to_unit
 * @param {number | null} [density_g_per_ml]
 * @returns {number | UnitRefusal}
 */
export function convert_with_density(qty, from_unit, to_unit, density_g_per_ml) {
    const ptr0 = passStringToWasm0(from_unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(to_unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.convert_with_density(qty, ptr0, len0, ptr1, len1, !isLikeNone(density_g_per_ml), isLikeNone(density_g_per_ml) ? 0 : density_g_per_ml);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * A branch-local calendar day as `[start, end)` in epoch ms (DST days
 * are 23 or 25 hours).
 * @param {string} tz
 * @param {string} date
 * @returns {[number, number]}
 */
export function day_bounds(tz, date) {
    const ptr0 = passStringToWasm0(tz, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(date, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.day_bounds(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Piastres one delivery cost, not rounded: the invoice total if given,
 * else the per-unit price × the quantity, else the ordered line total
 * pro rata to the quantity received (the receive dialog's hint).
 * `quantity_ordered` is the stored column.
 * @param {number} quantity_received
 * @param {number | null | undefined} line_cost
 * @param {number | null | undefined} unit_cost
 * @param {number} ordered_line_cost
 * @param {number} quantity_ordered
 * @returns {number | PurchaseRefusal}
 */
export function delivery_cost(quantity_received, line_cost, unit_cost, ordered_line_cost, quantity_ordered) {
    const ret = wasm.delivery_cost(quantity_received, !isLikeNone(line_cost), isLikeNone(line_cost) ? 0 : line_cost, !isLikeNone(unit_cost), isLikeNone(unit_cost) ? 0 : unit_cost, ordered_line_cost, quantity_ordered);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The order dialog's line estimate in piastres; `null` without a cost,
 * a quantity above 0, or units of one family.
 * @param {number | null | undefined} cost_per_stock_unit
 * @param {number} qty
 * @param {string} purchase_unit
 * @param {string} stock_unit
 * @returns {number | null}
 */
export function estimate_line_total(cost_per_stock_unit, qty, purchase_unit, stock_unit) {
    const ptr0 = passStringToWasm0(purchase_unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(stock_unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.estimate_line_total(!isLikeNone(cost_per_stock_unit), isLikeNone(cost_per_stock_unit) ? 0 : cost_per_stock_unit, qty, ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The first pay of someone hired on `hire_date` at `monthly`, periods
 * opening on `start_day` (madar-dawam `salary::first_pay`).
 * @param {number} monthly
 * @param {string} hire_date
 * @param {number} start_day
 * @returns {FirstPay}
 */
export function first_pay(monthly, hire_date, start_day) {
    const ptr0 = passStringToWasm0(hire_date, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.first_pay(monthly, ptr0, len0, start_day);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The food-cost band of `cost` against `price`; `null` unless `price > 0`.
 * @param {number} cost
 * @param {number} price
 * @returns {Band | null}
 */
export function food_cost_band(cost, price) {
    const ret = wasm.food_cost_band(cost, price);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Whether a counted row needs a reason: off by at least `pct` % of the
 * book, or stock from zero.
 * @param {number} book
 * @param {number} counted
 * @param {number} pct
 * @returns {boolean}
 */
export function is_variance_flagged(book, counted, pct) {
    const ret = wasm.is_variance_flagged(book, counted, pct);
    return ret !== 0;
}

/**
 * What a rung costs in piastres for a monthly `salary`, `working_days` a
 * month and the day's `day_minutes` (madar-dawam
 * `ladder::late_deduction_piastres`).
 * @param {LateTier} tier
 * @param {number} salary
 * @param {number} working_days
 * @param {number} day_minutes
 * @returns {number}
 */
export function late_deduction_piastres(tier, salary, working_days, day_minutes) {
    const ret = wasm.late_deduction_piastres(tier, salary, working_days, day_minutes);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * One recipe line's cost in whole piastres.
 * @param {number} qty
 * @param {number} cost_per_unit
 * @returns {number}
 */
export function line_cost(qty, cost_per_unit) {
    const ret = wasm.line_cost(qty, cost_per_unit);
    return ret;
}

/**
 * `date` at `hour`:`minute` on `tz`'s wall clock, in epoch ms: a time
 * that happens twice is the earliest, one in a DST gap moves forward by
 * the gap, an hour or minute past its range rolls over.
 * @param {string} tz
 * @param {string} date
 * @param {number} hour
 * @param {number} minute
 * @returns {number}
 */
export function local_instant(tz, date, hour, minute) {
    const ptr0 = passStringToWasm0(tz, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(date, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.local_instant(ptr0, len0, ptr1, len1, hour, minute);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * An instant (epoch ms) read on `tz`'s wall clock.
 * @param {string} tz
 * @param {number} at_ms
 * @returns {LocalParts}
 */
export function local_parts(tz, at_ms) {
    const ptr0 = passStringToWasm0(tz, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.local_parts(ptr0, len0, at_ms);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The card for `balance` against `next_reward_cost`.
 * @param {number} balance
 * @param {number} next_reward_cost
 * @returns {LoyaltyCard}
 */
export function loyalty_card(balance, next_reward_cost) {
    const ret = wasm.loyalty_card(balance, next_reward_cost);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * How many steps of a `cost`-step stamp row `earned` fills; `null` when
 * the card has no row (a cost of 0 or less, or above 12).
 * @param {number} earned
 * @param {number} cost
 * @returns {number | null}
 */
export function loyalty_stamps(earned, cost) {
    const ret = wasm.loyalty_stamps(earned, cost);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * `(price − cost) / price`; `null` unless `price > 0`.
 * @param {number} price
 * @param {number} cost
 * @returns {number | null}
 */
export function margin(price, cost) {
    const ret = wasm.margin(price, cost);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * What `option_id` alone is charged on a line of `size_label`; `null`
 * for an option not in the view.
 * @param {CatalogView} view
 * @param {string | null | undefined} size_label
 * @param {string} option_id
 * @returns {number | null}
 */
export function option_charge(view, size_label, option_id) {
    var ptr0 = isLikeNone(size_label) ? 0 : passStringToWasm0(size_label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(option_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.option_charge(view, ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The pay window `[start, end]` (inclusive dates) holding `day`;
 * `start_day` is clamped to 1–28.
 * @param {string} day
 * @param {number} start_day
 * @returns {[string, string]}
 */
export function pay_period(day, start_day) {
    const ptr0 = passStringToWasm0(day, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.pay_period(ptr0, len0, start_day);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The canonical phone (E.164 digits, no `+`), or `null` when `raw` is
 * not a phone number.
 * @param {string} raw
 * @returns {string | null}
 */
export function phone_canonical(raw) {
    const ptr0 = passStringToWasm0(raw, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.phone_canonical(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * A menu-item line: its size price, then its options.
 * @param {CatalogView} view
 * @param {Selection} selection
 * @returns {PricedLine | PriceError}
 */
export function price_line(view, selection) {
    const ret = wasm.price_line(view, selection);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * A line's options and optional fields, priced without its size.
 * @param {CatalogView} view
 * @param {Selection} selection
 * @returns {PricedOptions | PriceError}
 */
export function price_options(view, selection) {
    const ret = wasm.price_options(view, selection);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * A quantity as `numeric(12,3)` holds it: 3 dp, half away from zero.
 * @param {number} q
 * @returns {number}
 */
export function quantity_dec(q) {
    const ret = wasm.quantity_dec(q);
    return ret;
}

/**
 * A quantity in whole thousandths, as `numeric(12,3)` stores it (half
 * away from zero; non-finite is 0).
 * @param {number} q
 * @returns {number}
 */
export function quantity_milli(q) {
    const ret = wasm.quantity_milli(q);
    return ret;
}

/**
 * The three rates from whichever one was typed (madar-dawam
 * `salary::rates`); `working_days` may be a fraction.
 * @param {TypedRate} typed
 * @param {number} working_days
 * @param {number} day_minutes
 * @returns {SalaryRates}
 */
export function rates(typed, working_days, day_minutes) {
    const ret = wasm.rates(typed, working_days, day_minutes);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * What a recipe line stores: converted to the base unit, grossed up by
 * the yield loss, 3 dp.
 * @param {number} qty
 * @param {string} unit
 * @param {string} base_unit
 * @param {number | null} [density_g_per_ml]
 * @param {number | null} [yield_pct]
 * @returns {number | UnitRefusal}
 */
export function recipe_base_qty(qty, unit, base_unit, density_g_per_ml, yield_pct) {
    const ptr0 = passStringToWasm0(unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(base_unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.recipe_base_qty(qty, ptr0, len0, ptr1, len1, !isLikeNone(density_g_per_ml), isLikeNone(density_g_per_ml) ? 0 : density_g_per_ml, !isLikeNone(yield_pct), isLikeNone(yield_pct) ? 0 : yield_pct);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * A recipe's cost: the known lines' exact sum, rounded once.
 * @param {CostLine[]} lines
 * @returns {RecipeCost}
 */
export function recipe_cost(lines) {
    const ptr0 = passArrayJsValueToWasm0(lines, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.recipe_cost(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * How much a warehouse should send a branch.
 * @param {ReplenishInput} input
 * @returns {ReplenishSuggestion}
 */
export function replenish_suggest(input) {
    const ret = wasm.replenish_suggest(input);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * A recipe quantity copied to another size × `factor`, 3 dp, half away
 * from zero.
 * @param {number} qty
 * @param {number} factor
 * @returns {number}
 */
export function scale_qty(qty, factor) {
    const ret = wasm.scale_qty(qty, factor);
    return ret;
}

/**
 * The index of the FIRST rung `late_minutes` falls on, or `null` (on
 * time, or past a ladder that stops).
 * @param {LateTier[]} tiers
 * @param {number} late_minutes
 * @returns {number | null}
 */
export function select_late_tier(tiers, late_minutes) {
    const ptr0 = passArrayJsValueToWasm0(tiers, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.select_late_tier(ptr0, len0, late_minutes);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The close's reconciliation lines (madar-till `reconcile::plan_lines`):
 * the cash line first, then each non-cash method used, then inputs
 * naming a method not used. `replay` never refuses.
 * @param {TillTotal[]} totals
 * @param {number} closing_cash_declared
 * @param {number} closing_cash_system
 * @param {string | null | undefined} cash_note
 * @param {TillInput[]} inputs
 * @param {boolean} replay
 * @returns {TillLine[] | TillRefusal}
 */
export function till_plan_lines(totals, closing_cash_declared, closing_cash_system, cash_note, inputs, replay) {
    const ptr0 = passArrayJsValueToWasm0(totals, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    var ptr1 = isLikeNone(cash_note) ? 0 : passStringToWasm0(cash_note, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayJsValueToWasm0(inputs, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.till_plan_lines(ptr0, len0, closing_cash_declared, closing_cash_system, ptr1, len1, ptr2, len2, replay);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * What `action` needs and leads to in `status`; `null` when it is not
 * open there.
 * @param {TransferStatus} status
 * @param {Action} action
 * @returns {TransferStep | null}
 */
export function transfer_step(status, action) {
    const ret = wasm.transfer_step(status, action);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The unit cost (8 dp) a typed line total implies; `null` unless
 * `line ≥ 0` and the 3 dp quantity is above 0.
 * @param {number} line
 * @param {number} qty
 * @returns {number | null}
 */
export function unit_cost_from_total(line, qty) {
    const ret = wasm.unit_cost_from_total(line, qty);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * One unit of the item at `size_label` before any option (madar-catalog
 * `unit_price`).
 * @param {ItemView} item
 * @param {string | null} [size_label]
 * @returns {number | PriceError}
 */
export function unit_price(item, size_label) {
    var ptr0 = isLikeNone(size_label) ? 0 : passStringToWasm0(size_label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.unit_price(item, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * A unit's `[family, factor to the family's canonical unit]`, or `null`.
 * @param {string} unit
 * @returns {[string, number] | null}
 */
export function unit_spec(unit) {
    const ptr0 = passStringToWasm0(unit, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.unit_spec(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The units a quantity stocked in `base` may be typed in.
 * @param {string} base
 * @returns {string[]}
 */
export function units_of(base) {
    const ptr0 = passStringToWasm0(base, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.units_of(ptr0, len0);
    var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * The usable amount a stored recipe quantity stands for, 3 dp.
 * @param {number} stored
 * @param {number | null} [yield_pct]
 * @returns {number}
 */
export function usable_qty(stored, yield_pct) {
    const ret = wasm.usable_qty(stored, !isLikeNone(yield_pct), isLikeNone(yield_pct) ? 0 : yield_pct);
    return ret;
}

/**
 * The Saturday the week holding `date` starts on.
 * @param {string} date
 * @returns {string}
 */
export function week_start(date) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(date, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.week_start(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_30c8987f7c2ed4e2: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_14af1003b8dd5ead: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_a2383202b9353e4c: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_5b446f51afd21013: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_4687d8d8c2017d52: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_92f62ee1427d9e49: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_b123553bed3bb382: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_1f9d30630b8b1d3d: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_3c45d4f2dde4e749: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_90b56bc79aad6f6c: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_8865fb403f8fe9d8: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_02babf21faa37971: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_677f21e468d6b461: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_2e0e7dee9f701a71: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_0380ccaa2f57f0d9: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_6137034ef55c9d0f: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_done_b41a1d26cdb37fb6: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_fb6397112b1de25f: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_get_658f6698067d9515: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_6c896e0571ddae51: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_unchecked_288889d017702237: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_a99f175873e5d9b8: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_828cef2aaacafc31: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_e15a2ff68ffdbef2: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_717808ad6a54bd9e: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_e3c31c892080e444: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_7f3c00c40364105e: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_d4bdea10311bd9cf: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_new_1dbf7428bba60a42: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_28744009d011f847: function() {
            const ret = new Map();
            return ret;
        },
        __wbg_new_617a8cdb8bb1130e: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_ee2291f50781bf1d: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_next_33784799010f1bbe: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_f4aac29c42af995c: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_prototypesetcall_bc27214492979395: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_set_6ae97e73113c4f0b: function(arg0, arg1, arg2) {
            const ret = arg0.set(arg1, arg2);
            return ret;
        },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_bea140a88be9b277: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_value_f3c585ee8f5ba40c: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbindgen_generic_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_generic_0000000000000004: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./madar_web_bg.js": import0,
    };
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('madar_web_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
