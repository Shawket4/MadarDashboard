# public/screenshots/

The portfolio expects these PNGs to land here. Until you drop them in,
each device frame renders a clean labeled placeholder so you can see
where they'll go and at what aspect ratio.

## iPad (4:3 landscape — capture at native iPad Pro 12.9" resolution: 2732 × 2048)

| Filename                 | Page · Use                                    |
| ------------------------ | --------------------------------------------- |
| `teller-hero.png`        | Page 5 — hero shot of the teller app          |
| `teller-detail-1.png`    | Page 6 — first detail iPad (split payments)   |
| `teller-detail-2.png`    | Page 6 — second detail iPad (shift open/close)|

## Dashboard (16:10 content-only, no browser chrome — target 1920 × 1200 minimum, 2400 × 1500 better)

| Filename                       | Page · Use                                  |
| ------------------------------ | ------------------------------------------- |
| `dashboard-hero.png`           | Page 7 — main analytics overview            |
| `dashboard-inventory.png`      | Page 8 — inventory / recipes detail         |
| `dashboard-shifts.png`         | Page 8 — shift report detail                |

The Browser frames render their own chrome (traffic-light dots and URL pill).
**Capture content-only** — not the whole browser window. Otherwise you'll get two
chromes stacked.

## Notes

- All screenshots should be **light mode** — reads better on the cream page background.
- iPad screenshots fit 4:3 exactly; the iPad frame is engineered around that ratio
  with `object-contain` as a safety net so nothing crops.
- Dashboard screenshots at 16:10 fit the Browser frame cleanly; off-aspect captures
  will letterbox (with cream visible) instead of cropping.
- For Arabic, you can ship the same screenshots for both locales or add `-ar`
  variants and update the page components to swap by language. Same set works for v1.
