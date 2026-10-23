/* tslint:disable */
/* eslint-disable */
/**
 * A pixel rectangle on an image.
 */
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * A rectangle of whole cells: `col`/`row` from the leading top corner,
 * `w`×`h` cells.
 */
export interface Cell {
    col: number;
    row: number;
    w: number;
    h: number;
}

/**
 * A track as the owner defines it.
 */
export interface Track {
    /**
     * 1 to 4, in order. Track 1 is the programme's own counter.
     */
    position: number;
    /**
     * Shown on the pass and the teller page; required from track 2 on.
     */
    name_en?: string;
    name_ar?: string;
    /**
     * Stamps that fill this track's card. `None` on track 1, whose size is
     * the programme's card size (one number, one place).
     */
    size?: number | null;
    /**
     * This track's stamp, else the design's.
     */
    shape?: StampShape | null;
    /**
     * This track's colour (`#RRGGBB`), else the pass's foreground.
     */
    colour?: string | null;
    /**
     * Tracks 2–4: the menu items (ids) a sale earns on and a completed card
     * covers. Empty = a counter-only track. Always empty on track 1, whose
     * items are the programme's earning list and reward catalogue.
     */
    items?: string[];
    /**
     * Tracks 2–4: a stamp per unit of its items (default), or one per sale
     * holding any. Track 1 follows the programme's own setting.
     */
    per_item?: boolean;
    /**
     * Tracks 2–4: the balance ceiling (a stamp past it is trimmed); at least
     * the track's size. `None` = no ceiling.
     */
    cap?: number | null;
}

/**
 * A track as the strip draws it.
 */
export interface TrackState {
    position: number;
    size: number;
    balance: number;
    colour?: string | null;
    shape?: StampShape | null;
}

/**
 * A wallet a member may hold the card in.
 */
export type Wallet = "apple" | "google" | "none";

/**
 * A wallet.
 */
export type Store = "apple" | "google";

/**
 * Alignment in reading order (`start` is the right edge on an Arabic pass).
 */
export type TextAlign = "start" | "centre" | "end";

/**
 * An image to draw on: its size in pixels, and how many pixels make one of
 * Apple's points (1, 2 or 3 for the strip; Google's hero counts as 2.75,
 * its width over the strip's).
 */
export interface Canvas {
    w: number;
    h: number;
    scale: number;
}

/**
 * Apple's store-card field groups. The back of the card is not designed: it
 * carries how it works, branches, terms and links, as today.
 */
export interface AppleFields {
    /**
     * Top right beside the logo, and the only thing a stacked wallet shows.
     */
    header?: FieldSource[];
    /**
     * Written over the strip's leading top two thirds.
     */
    primary?: FieldSource | null;
    secondary?: FieldSource[];
    auxiliary?: FieldSource[];
}

/**
 * Every member (no rules), or those matching all of `rules`.
 */
export interface Audience {
    rules?: Rule[];
}

/**
 * Google's two slots on the face of the card.
 */
export interface GoogleFields {
    /**
     * `loyaltyPoints`, the largest text on the card.
     */
    points: FieldSource;
    /**
     * `secondaryLoyaltyPoints`.
     */
    secondary?: FieldSource | null;
}

/**
 * How a stamp not yet earned looks.
 */
export type EmptyStyle = "outline" | "faint";

/**
 * How a track's stamps are arranged in their box.
 */
export interface StampGrid {
    rows: number;
    per_row: number;
    /**
     * Each stamp's width, in the canvas's pixels.
     */
    diameter: number;
}

/**
 * One rule.
 */
export type Rule = { type: "balance_at_least"; track: number; value: number } | { type: "balance_at_most"; track: number; value: number } | { type: "reward_ready"; track: number } | { type: "visited_within"; days: number } | { type: "not_visited_for"; days: number } | { type: "joined_within"; days: number } | { type: "birthday_month"; month: number } | { type: "has_wallet"; wallet: Wallet };

/**
 * One thing on the strip, and where.
 */
export interface Element {
    kind: ElementKind;
    cell: Cell;
}

/**
 * One thing wrong, by a stable code the dashboards translate, and where.
 */
export interface Problem {
    code: string;
    /**
     * `elements[2]`, `apple.header`, `colours.foreground`, `tracks[1]`, …
     */
    path: string;
    severity: Severity;
}

/**
 * The fixed numbers the editor and the composer show.
 */
export interface CardRules {
    cols: number;
    rows: number;
    apple_primary_zone: Cell;
    footer_cell: Cell;
    template_ids: string[];
    max_elements: number;
    max_stamps: number;
    text_max: number;
    max_header: number;
    max_secondary_and_auxiliary: number;
    min_contrast: number;
    max_tracks: number;
    max_track_size: number;
    track_name_max: number;
    audience_max_rules: number;
    audience_max_days: number;
    message: Limits;
}

/**
 * The kinds of thing a strip can hold. Each is drawn by [`crate::render`].
 */
export type ElementKind = { type: "stamps"; track: number } | { type: "bar"; track: number } | { type: "count"; track: number } | { type: "text"; en?: string; ar?: string; size: TextSize; align: TextAlign } | { type: "logo" };

/**
 * The limits, for the composer to show.
 */
export interface Limits {
    line_max: number;
    daily_limit: number;
    member_gap_hours: number;
    schedule_min_minutes: number;
    schedule_max_days: number;
}

/**
 * The member's card as the strip shows it.
 */
export interface CardState {
    tracks: TrackState[];
    /**
     * The Arabic strip (`ar.lproj`): mirrored, Arabic words.
     */
    arabic: boolean;
}

/**
 * The message, in either or both languages.
 */
export interface Message {
    en?: string;
    ar?: string;
}

/**
 * The pass's colours, `#RRGGBB`. Apple writes field values in `foreground`
 * and labels in `label` on `background`; Google takes `background` only.
 */
export interface Colours {
    background: string;
    foreground: string;
    label: string;
}

/**
 * The stamp's shape.
 */
export type StampShape = "circle" | "square" | "star" | "heart" | "cup" | "gift" | "check";

/**
 * The whole design.
 */
export interface CardDesign {
    version: number;
    /**
     * The template it started from (informational: `classic`, `stamps`, …).
     */
    template?: string;
    colours: Colours;
    ground: Ground;
    /**
     * What the strip (Apple) and the hero (Google) show, on the grid.
     */
    elements?: Element[];
    stamp: StampStyle;
    apple: AppleFields;
    google: GoogleFields;
}

/**
 * What [`layout`] places, for a caller that composites raster layers.
 */
export type Placed = "element" | "logo" | "footer" | "primary_zone";

/**
 * What a programme collects. One track only for points.
 */
export type Mode = "points" | "visits";

/**
 * What an OS-drawn field shows.
 */
export type FieldSource = { type: "balance"; track: number } | { type: "progress"; track: number } | { type: "rewards"; track: number } | { type: "member" };

/**
 * What lies under the elements.
 */
export type GroundKind = "colour" | "photo" | "pattern";

/**
 * What rendering and validation need of a track: where it is and how big a
 * card it fills.
 */
export interface TrackRef {
    position: number;
    size: number;
}

/**
 * What the caller draws itself, and where its pictures are.
 */
export interface SvgOpts {
    /**
     * The photograph under a `photo` ground (the dashboard); `None` leaves
     * that ground transparent for the server to composite beneath.
     */
    photo_href?: string | null;
    logo_href?: string | null;
    footer_href?: string | null;
    /**
     * Approximate the server's measured scrim under Apple's primary field (the
     * dashboard's live preview; the server scrims the photograph itself).
     */
    scrim_preview?: boolean;
    /**
     * Apple's primary field is written on this strip (Google's hero has none).
     */
    primary_field?: boolean;
}

/**
 * What the design is checked against: the shop's programme as it stands.
 */
export interface Ctx {
    mode: Mode;
    /**
     * Every track with its card size (track 1's is the programme's).
     */
    tracks: TrackRef[];
    /**
     * The shop has a card photograph uploaded.
     */
    has_photo: boolean;
}

export interface Ground {
    kind: GroundKind;
    /**
     * Which pattern, when `kind` is `pattern`.
     */
    pattern?: Pattern | null;
}

export interface Placement {
    what: Placed;
    /**
     * The element's index, for `element` and `logo`.
     */
    index: number | null;
    rect: Rect;
}

export interface StampStyle {
    shape: StampShape;
    empty: EmptyStyle;
}

export interface Stepper {
    progress: string;
    earned: string | undefined;
}

export interface TrackCard {
    rewards_ready: number;
    progress_to_next: number;
    points_to_next_reward: number;
    can_redeem: boolean;
}

export type Pattern = "dots" | "lines" | "grid";

export type Severity = "error" | "warning";

export type TextSize = "small" | "medium" | "large";


/**
 * The problems with an audience for a shop of `track_count` tracks.
 */
export function audience_validate(audience: Audience, track_count: number): Problem[];

/**
 * The design a shop starts from (today's look, or a row per track).
 */
export function card_default(colours: Colours, ctx: Ctx, tracks: Track[]): CardDesign;

/**
 * The first free spot of `w`x`h` cells, or `null`.
 */
export function card_first_free(design: CardDesign, w: number, h: number): Cell | null;

/**
 * Where each element lands on a wallet's image.
 */
export function card_layout(design: CardDesign, store: Store, scale: number, arabic: boolean, primary_field: boolean): Placement[];

export function card_rules(): CardRules;

/**
 * What one unit of the card counts: `points`, `order`, `item` or `stamp`.
 */
export function card_stamp_unit(points: boolean, per_item: boolean, standalone: boolean): string;

/**
 * A track's figures as the wallet fields print them.
 */
export function card_stepper(balance: number, size: number): Stepper;

/**
 * The strip (Apple, at `scale`) or the hero (Google) as SVG.
 */
export function card_svg(design: CardDesign, state: CardState, store: Store, scale: number, opts: SvgOpts): string;

/**
 * Every template this shop can use, built for it.
 */
export function card_templates(colours: Colours, ctx: Ctx, tracks: Track[]): CardDesign[];

/**
 * The server's checks on a design, for this shop.
 */
export function card_validate(design: CardDesign, ctx: Ctx): Problem[];

/**
 * The line a member reading Arabic (or not) gets.
 */
export function message_line_for(message: Message, arabic: boolean): string;

/**
 * The problems with a message.
 */
export function message_validate(message: Message): Problem[];

/**
 * One track's card for its balance.
 */
export function track_card(balance: number, size: number): TrackCard;

/**
 * The problems with a set of tracks.
 */
export function tracks_validate(tracks: Track[], mode: Mode): Problem[];

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly audience_validate: (a: any, b: number) => [number, number, number];
    readonly card_default: (a: any, b: any, c: number, d: number) => [number, number, number];
    readonly card_first_free: (a: any, b: number, c: number) => [number, number, number];
    readonly card_layout: (a: any, b: any, c: number, d: number, e: number) => [number, number, number];
    readonly card_rules: () => [number, number, number];
    readonly card_stamp_unit: (a: number, b: number, c: number) => [number, number];
    readonly card_stepper: (a: number, b: number) => [number, number, number];
    readonly card_svg: (a: any, b: any, c: any, d: number, e: any) => [number, number, number, number];
    readonly card_templates: (a: any, b: any, c: number, d: number) => [number, number, number];
    readonly card_validate: (a: any, b: any) => [number, number, number];
    readonly message_line_for: (a: any, b: number) => [number, number, number, number];
    readonly message_validate: (a: any) => [number, number, number];
    readonly track_card: (a: number, b: number) => [number, number, number];
    readonly tracks_validate: (a: number, b: number, c: any) => [number, number, number];
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
