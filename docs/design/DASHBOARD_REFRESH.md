# Dashboard refresh — audit and rules

Branch `dashboard-refresh`. Brings the dashboard onto the POS design system
(`madar/docs/design/SPEC.md`). Screenshots: `docs/design/shots/before/` and
`docs/design/shots/after/` (`node scripts/capture-refresh.mjs <dir> --langs=en,ar
--themes=light,dark --sizes=desktop,tablet,phone`, against `npm run dev:mock`).

## Audit — inconsistencies, ranked

1. **Title position moves page to page.** Four header patterns: `PageHeader`
   (24 pages), hand-rolled `<h1>` blocks (Purchasing, Inventory reports, Menu —
   larger type, different top offset), a Settings shell with a second pane title,
   and section tabs rendered *above* the title (Access), which pushed the title
   down 40px. Nothing reserved a leading slot.
2. **Content widths are random.** `Page` centred a 1400px island; Permissions and
   Analytics sat in narrower centred blocks; Settings panes floated in the middle
   of the leftover width.
3. **Status by colour alone.** Order, PO, count, user and bundle statuses were
   tinted text chips with no glyph (Completed, Ordered, Partially received,
   Finalized, Draft). Several washes failed AA (amber text on amber).
4. **Money reads differently everywhere.** `EGP 18`, `EGP 187.5`, `EGP 8,448.9`;
   Arabic rendered Eastern-Arabic digits (`٤٦`, `١٦٦٬٠٠٠ ج.م.`), a hyphen-minus for
   negatives, 12-hour `am/pm` times while the POS shows 24-hour.
5. **Two primaries.** Teal filled buttons, teal active tabs, teal focus, teal
   sidebar selection — the brand colour doing the job of the action colour, so a
   brand mark and a Save button looked the same. Disabled buttons were a faded teal.
6. **Tables drift.** `DataTable` for 21 lists, raw `Table` for 14, cards for the
   rest; header styles, row heights (40–64px) and action placement differed;
   loading was a stack of grey bars outside the grid; no error state — a failed
   load rendered as "No results".
7. **Stat cards shout.** Coloured icon tiles on every KPI (a template tell);
   dashboard figures proportional, so columns of numbers wobbled.
8. **Empty states** in dashed boxes of different heights (`h-64`, `h-72`, none);
   some say "Nothing here".
9. **Segmented controls** had three selected styles (white pill with shadow,
   underline, filled).
10. **Phone**: wide tables scroll sideways; header actions wrap under the title
    unpredictably; stat cards stack 1-up with huge figures.

## Decisions

- **Colour**: POS tokens. Work surface = paper, chrome (sidebar) = ink in both
  themes, primary = rail ink (light) / pale slate (dark). Teal (`--brand`) only for
  brand marks; customer bundles set `.brand-surface` on `<html>` so their primary
  stays teal. Disabled = `--disabled` neutral grey.
- **Header** (`components/app/page.tsx`): `Page width="full|reading|form"` +
  `PageHeader title subtitle actions back icon below`. The 44px leading slot is
  always reserved (page nav glyph, or back). Section route tabs come from
  `SectionTabsProvider` and render in `below`. Filters/segments/search go in `below`.
- **Widths**: `full` (tables, analytics, canvases) cap 1600; `reading` 880
  (settings panes, detail pages); `form` 560. Always start-aligned to the gutter.
- **Tables** (`DataTable`): column `meta: { label, numeric, align, phone, className }`;
  pass `loading`, `error` + `onRetry`, `emptyState`; `rowActions`, `renderExpanded`,
  `selectedRowId`, `loadMore`. Raw `components/ui/table` is restyled to match for
  the few matrix-like grids that need it.
- **Status**: `StatusPill tone` (glyph + label). `toneFor(status)` has defaults.
- **Stat cards**: quiet label with a small glyph, mono figure, tint only for states
  that mean something.
- **Lists**: `ListRow` (nav / ledger / item / pick) inside `ListCard`; `SummaryLine`.
- **Sections**: `SectionHeader` (16/600 sentence case, never repeats the title).
- **States**: `EmptyState` (a sentence that says what will appear), `ErrorState`
  (names what failed, Retry). Loading = skeletons in the content's own geometry.
- **Confirm**: `useConfirm()` for every destructive action, `destructive: true`,
  title names what is lost, description states the consequence.
- **Formats** (`lib/format.ts`): `fmtMoney` (EGP 1,234.50 / ⁦1,234.50⁩ ج.م, U+2212,
  `signed`, `maxFractionDigits: 0` for tight KPIs), `fmtStamp`, `fmtDateTime`,
  `fmtDuration`/`fmtElapsedMs`, `fmtNumber` — all in `getActiveTz()`, Western digits,
  24-hour. No `toLocaleString`, no `date-fns format()` for display.
- **Arabic copy**: drawer = الخزنة, till = الوردية where shared copy is touched.
- **Motion**: 150–220ms ease-out colour/opacity; `motion-reduce:` variants on
  every transition; page fade only.

## Left for the tills rework

Not restyled or restructured here (only shared components flow into them):
`features/shifts`, `features/tills`, payment-methods settings, the permissions
page's resource lists, and the orders page's till/shift filter and export presets.
