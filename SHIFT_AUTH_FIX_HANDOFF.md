# Dashboard Handoff — Teller Shift / Login Race Fix

> For the dashboard agent. A money-affecting race was fixed in the backend: a teller assigned to
> multiple branches could hold an **open shift at more than one branch at once**, and a device
> could ring up revenue/inventory against the wrong branch. The backend now enforces **one open
> shift per teller** and binds a teller's session to the branch they signed into. No request/response
> **shapes** changed — only new **409 / 403** outcomes and one new operational need (force-close).
> Re-run `npm run generate:api` for the inventory module regardless; this fix needs no model changes.

---

## What changed in the backend (behavior, not shapes)

1. **One open shift per teller** — DB-enforced (`unique index on shifts(teller_id) where status='open'`).
   `POST /shifts/branches/{id}/open` now returns **409** if the teller already has an open shift
   (here or at another branch).
2. **Login blocks any open shift** — `POST /auth/login` returns **409** when the authenticating user
   already has an open shift. Message: *"You already have an open shift. It must be closed before
   signing in again."* (Mostly a POS/teller concern; an org-admin who never opens shifts is unaffected.)
3. **Teller token is branch-bound** — a teller token minted for branch A is rejected (**403**,
   *"This device is signed in to a different branch."*) on `shifts/*` and `orders/*` for any other
   branch. Org-admin / super-admin tokens are **not** branch-bound, so the dashboard is unaffected.
4. **Orders attach only to an open shift that belongs to the teller** at the token's branch
   (`create_order` hardened). Dashboard order *reads* are unaffected.

## What the dashboard must do

### A. The operational unblock (most important — this is new responsibility)
Because a teller cannot log in or open a new shift while they have an open one, **an admin needs a
way to close/force-close a teller's open shift** from the dashboard — otherwise a teller who lost
their device/session is stuck. Build (or confirm) a **Shifts** management view:

| Need | Endpoint |
|---|---|
| List shifts for a branch (filter open) | `GET /shifts/branches/{branch_id}` |
| See the branch's current open shift | `GET /shifts/branches/{branch_id}/current` |
| Shift detail / report | `GET /shifts/{shift_id}` · `GET /shifts/{shift_id}/report` |
| Close a shift (with declared cash) | `POST /shifts/{shift_id}/close` |
| **Force-close** (admin override, cash may be unreconciled) | `POST /shifts/{shift_id}/force-close` |

Surface, per branch, "open shifts" and a **Force-close** action with a reason. This is also the
**deploy pre-step**: before the `20260613011000` migration runs, an admin must close any teller who
somehow has more than one open shift (see `MadarRust/DEPLOY_INSTRUCTIONS.md` §2). A small "tellers
with an open shift" list on the Shifts screen makes that a one-click cleanup.

### B. Handle the new error responses gracefully
Anywhere the dashboard calls `/auth/login` (admin/manager sign-in) or shift endpoints, show the
`error` message from a **409** (open-shift conflict) and **403** (branch mismatch) rather than a
generic failure. The body is the usual `{ "error": "<message>" }`.

### C. Reports / shift attribution are now trustworthy
With orders bound to the teller's own open shift at their token branch, branch-scoped sales/shift
reports no longer mix branches. No dashboard change required — just be aware the data is now clean.

## What the dashboard does NOT need
- No model/type changes (no new fields; `npm run generate:api` only matters for the inventory module).
- Org-admin sessions are not branch-bound and not shift-blocked (unless an admin personally has an
  open shift, which is unusual).

## Cross-references
- Inventory module build: `INVENTORY_FRONTEND_HANDOFF.md`
- Deploy + migration order + pre-step: `MadarRust/DEPLOY_INSTRUCTIONS.md`,
  `MadarRust/INVENTORY_PROD_MIGRATION_RUNBOOK.md`
- POS app is being updated in the same release (login error state + fetched branch name).
