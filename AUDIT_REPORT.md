# Sufrix Dashboard — Overnight Audit Report

**Branch:** `audit/overnight`. **Checks:** `tsc --noEmit` clean, `eslint` clean, `npm run test` (Vitest) → **3 passed** (was **broken — 0 could run**).

## Fixed

- **EGP→piastres rounding lost a piastre** (`src/lib/format.ts:23`, `components/app/editable-cards.tsx:64`, `features/menu/menu-items-page.tsx:199,453`).
  `egpToPiastres = Math.trunc(egp * 100)`. In IEEE-754, `19.99 * 100` is `1998.9999999999998`, so truncation produced **1998 instead of 1999** — a lost piastre on ~5.7% of two-decimal prices (and the same in the inline editable-card commit and the bulk/CSV price paths). **Fix:** `Math.round`.
  Guarded by `src/lib/format.test.ts`.

- **Broken Vitest harness** (`vitest.config.ts:8`). `setupFiles` referenced `./src/test/setup.ts`, which did not exist, and there were **zero** test files — so `npm run test` errored before running anything. **Fix:** added `src/test/setup.ts` (registers jest-dom matchers) + the first dashboard test (`format.test.ts`). The suite now runs green.

## Tax visibility (feature, on request)
- **Analytics**: added a "Tax" stat card (`total_tax`) next to Revenue.
- **Orders list**: added a Tax column (`order.tax_amount`); the order-detail sheet already showed tax.
- **Menu engineering**: subtitle now notes its figures are pre-tax (tax is order-level, not per-item, so no tax line belongs there).
- Regenerated the Orval client for the new `/auth/login` + `/auth/me` `tax_rate`/`currency_code` fields. tsc + eslint + vitest green.

## Findings reviewed but NOT changed (and why)

Logged rather than changed — they are UX/error-surfacing or design-level items that need app-level verification (RTL, server data, navigation) to change safely, which this pass couldn't exercise:

- **Read-query failures render as an empty state** (`components/app/data-table.tsx:165`) — a failed list load looks like "no data" rather than an error. **Recommended:** surface the query error (toast / inline error row) so users can retry.
- **403 branch-mismatch on a teller-bound GET is invisible** (`data/api/query.ts:10`) — the backend's V26 teller-binding 403 isn't shown. **Recommended:** map 403/409 to a readable banner.
- **Voiding leaves the order-detail cache stale** (`features/orders/void-order-dialog.tsx:44`) — list is invalidated but the detail key isn't. **Recommended:** invalidate the detail query too.
- **super_admin has no org switcher** (`data/stores/app.store.ts:34`) — `selectedOrgId` can be null, silently gating all org-scoped data. **Recommended:** add an org selector for super_admin.
- **`fmtMoney` suppresses trailing zeros** (`lib/format.ts:36`, e.g. `EGP 19.9`) — this is an **intentional design choice** (the code comment documents "no forced trailing zeros"), not a bug. Left as-is.
- Minor i18n: `tName` uses exact `lang === 'ar'` while the app uses `startsWith('ar')` (`features/analytics/lib.ts:11`); two language-persistence keys can desync (`i18n/index.ts:25`). Cosmetic; deferred.

(No runtime API-base / `.env` changes were made — this was a verification + fix pass, not a deployment-config change.)
