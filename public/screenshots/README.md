# public/screenshots/

Assets for the marketing landing page (`src/features/landing/`). Each frame on the
page renders a tasteful labeled placeholder until its file lands here, so the page
ships before every asset is captured.

All screenshots are **light mode** — they read better framed on the landing page.

## ✅ Already captured (dashboard — from the MSW mock harness)

Captured deterministically from `npm run dev:mock` via `scripts/capture-shots.mjs`
at 2880×1800 (16:10), so they're stable to re-generate. EN + AR variants where the
page swaps by language.

| File | Screen |
| ---- | ------ |
| `dash-overview-{en,ar}.png` | Dashboard overview — KPIs, revenue trend, payment mix, branches (hero + bilingual section) |
| `dash-orders-{en,ar}.png` | Orders — KPIs, delivery-by-channel split, ledger table |
| `dash-analytics-{en,ar}.png` | Analytics — KPIs + payment-method donut |
| `dash-recipes.png` | Menu & recipe costing editor |

## ✅ Already captured (customer surfaces — from the mock harness)

Captured at 402×874 (≈9:19.5 phone) for the phone frames.

| File | Screen |
| ---- | ------ |
| `order-menu-{en,ar}.png` | Public ordering entry — "Choose a branch" |
| `order-track-{en,ar}.png` | Live order tracker — `/track/:id` timeline |

## ⏳ To capture (POS — the SwiftUI app, `madar-pos/swift-app`)

The POS is now native SwiftUI (the Flutter app + its screenshots are deprecated).
The frame on the landing page is an **iPad (landscape, 4:3)**, so capture the wide
iPad/desktop layout. **Capture on an iPad Pro 13" simulator/device (2752×2064 or
similar 4:3), light mode.** Content area is `object-contain`, so off-aspect shots
letterbox (cream) rather than crop.

> Note: the app talks to the production backend (`api.madar-pos.cloud`), so a
> populated capture needs a real login (manager device-setup → teller PIN → open a
> shift → add items). That's why these are best captured by you on the live app
> rather than auto-generated. The iOS target isn't wired into `project.yml` yet —
> add an iOS target (framework dep + the MadarUI sources) to run on the simulator,
> or screenshot a device.

| File | Screen · what to show |
| ---- | --------------------- |
| `pos-order.png` | **Order screen** (`OrderView`) — catalog grid on the left, cart column on the right with a few items and live totals. This is the hero shot. |
| `pos-tender.png` | **Tender** (`TenderView`) — the checkout sheet mid-split (or cash with live change shown), a tip, ready to place. |
| `pos-kitchen.png` | **Kitchen display** (`KitchenDisplayView`) — the full-screen KDS board with a few outstanding tickets. |
| `pos-shift.png` | **Shift / Z-report** (`ShiftReportPreview` or `CloseShiftView`) — the payment-mix breakdown + drawer movements + totals. |

Drop the PNGs in with these exact names and the placeholders disappear — no code
change needed.

## Regenerating the captured shots

```bash
npm run dev:mock                 # MSW harness on :5180 (auto-seeds a demo session)
node scripts/capture-shots.mjs   # → dashboard PNGs into this folder
node scripts/verify-landing.mjs  # sanity-check the landing across locale × theme
```
