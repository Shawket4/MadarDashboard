/* tslint:disable */
/* eslint-disable */
/**
 * An item's use of a group, with the limits that apply on this item.
 */
export interface BulkLink {
    /**
     * A [`BulkGroup::key`].
     */
    group: string;
    min: number;
    max?: number | null;
}

/**
 * Something the reader skipped or changed. `line` is the file's line
 * (the header is line 1).
 */
export interface FoodicsWarning {
    file: FoodicsFile | null;
    line: number | null;
    issue: FoodicsIssue;
}

/**
 * The menu read from the files, every warning, and which files were read.
 */
export interface FoodicsParsed {
    menu: BulkMenu;
    files: FoodicsFile[];
    warnings: FoodicsWarning[];
}

/**
 * What a refusal is about.
 */
export type BulkThing = "category" | "item" | "group" | "option" | "size" | "link" | "optional";

/**
 * What a valid menu holds, for the preview and the server's answer.
 */
export interface BulkSummary {
    categories: number;
    items: number;
    sizes: number;
    groups: number;
    options: number;
    links: number;
    optionals: number;
}

/**
 * Which kind of choice a group is, the `legacy_addon_type` the POS reads.
 */
export type BulkFamily = "milk_type" | "coffee_type" | "extra";

/**
 * Why a bulk menu cannot be written. The first problem found; `within` names
 * the item or group the thing belongs to.
 */
export type BulkRefusal = { refusal: "unsupported_version"; got: number; supported: number } | { refusal: "empty" } | { refusal: "too_many"; what: BulkThing; max: number; got: number; within: string | null } | { refusal: "blank"; what: BulkThing; index: number; within: string | null } | { refusal: "too_long"; what: BulkThing; name: string; max: number } | { refusal: "bad_text"; what: BulkThing; name: string } | { refusal: "duplicate"; what: BulkThing; name: string; within: string | null } | { refusal: "unknown_category"; item: string; category: string } | { refusal: "unknown_group"; item: string; group: string } | { refusal: "bad_limits"; group: string; item: string | null; min: number; max: number | null; options: number } | { refusal: "bad_price"; what: BulkThing; name: string; price: number } | { refusal: "swap_not_single"; group: string; item: string | null } | { refusal: "no_active_size"; item: string } | { refusal: "reserved_label"; item: string; label: string };

/**
 * Why the files cannot be read at all.
 */
export type FoodicsError = { error: "unknown_file"; index: number } | { error: "duplicate_file"; kind: FoodicsFile } | { error: "missing_products" } | { error: "too_big"; index: number; max_bytes: number; max_rows: number } | { error: "bad_csv"; kind: FoodicsFile; line: number; message: string };

export interface BulkCategory {
    key: string;
    name: string;
    name_ar?: string | null;
}

export interface BulkGroup {
    key: string;
    name: string;
    name_ar?: string | null;
    /**
     * The group's own limits; an item's link may differ ([`BulkLink`]).
     */
    min: number;
    /**
     * `None`: as many as there are options.
     */
    max?: number | null;
    family: BulkFamily;
    options: BulkOption[];
}

export interface BulkItem {
    name: string;
    name_ar?: string | null;
    description?: string | null;
    description_ar?: string | null;
    /**
     * A [`BulkCategory::key`].
     */
    category: string;
    /**
     * The item's price; with no `sizes` it is the one price it sells at.
     */
    price: number;
    is_active: boolean;
    /**
     * Each size's full price (not a difference over `price`).
     */
    sizes?: BulkSize[];
    /**
     * The item's groups, in the order the till shows them.
     */
    groups?: BulkLink[];
    /**
     * Free-form extras the item alone offers.
     */
    optionals?: BulkOptional[];
}

export interface BulkMenu {
    version: number;
    categories?: BulkCategory[];
    groups?: BulkGroup[];
    items?: BulkItem[];
}

export interface BulkOption {
    name: string;
    name_ar?: string | null;
    price: number;
    is_active: boolean;
}

export interface BulkOptional {
    name: string;
    name_ar?: string | null;
    price: number;
}

export interface BulkSize {
    label: string;
    price: number;
    is_active: boolean;
}

export type FoodicsFile = "categories" | "products" | "product_modifiers" | "modifier_groups" | "modifier_options" | "product_optionals";

export type FoodicsIssue = { issue: "missing_file"; kind: FoodicsFile } | { issue: "blank_name" } | { issue: "duplicate"; name: string } | { issue: "duplicate_sku"; sku: string } | { issue: "uncategorized"; item: string } | { issue: "not_a_number"; column: string; value: string } | { issue: "not_yes_no"; column: string; value: string } | { issue: "unknown_sku"; sku: string } | { issue: "unknown_group"; group: string } | { issue: "duplicate_link"; item: string; group: string } | { issue: "empty_group"; group: string } | { issue: "min_lowered"; group: string; item: string; from: number; to: number } | { issue: "sizes_by_name"; group: string } | { issue: "looks_like_sizes"; group: string } | { issue: "second_sizes"; item: string; group: string } | { issue: "duplicate_group"; name: string } | { issue: "not_a_swap"; group: string };


/**
 * The server's checks on a bulk menu, for the preview.
 */
export function bulk_validate(menu: BulkMenu): BulkSummary | BulkRefusal;

/**
 * Whether `typed` is that sentence, in either language.
 */
export function confirms_replace(org_name: string, typed: string): boolean;

/**
 * A Foodics console export read into a bulk menu: each file's text, in
 * any order. A file that cannot be read is returned, not thrown.
 */
export function foodics_parse(files: string[]): FoodicsParsed | FoodicsError;

/**
 * The sentence an owner types to replace the whole menu, in `lang`.
 */
export function replace_sentence(org_name: string, lang: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly bulk_validate: (a: any) => [number, number, number];
    readonly confirms_replace: (a: number, b: number, c: number, d: number) => number;
    readonly foodics_parse: (a: number, b: number) => [number, number, number];
    readonly replace_sentence: (a: number, b: number, c: number, d: number) => [number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
