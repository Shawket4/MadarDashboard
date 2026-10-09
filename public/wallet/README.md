# Wallet badges

Apple and Google both publish official "Add to Wallet" artwork with brand
guidelines that forbid altering it. The two SVGs here are now the **official
files, unmodified** (placed 2026-09-25; the hand-made recreations are gone):

- `add-to-apple-wallet.svg` = Apple's `Add_to_Apple_Wallet_badge.svg` (English), viewBox 110.095 × 34.016.
- `add-to-google-wallet.svg` = Google's `enGB_add_to_google_wallet_add-wallet-badge.svg` (English), viewBox 199 × 55.

Never edit them: to update, replace the file and change nothing else. The button
component renders these by path at a fixed height with `w-auto`, so each badge keeps
its own aspect ratio:

| File | Official source |
|---|---|
| `add-to-apple-wallet.svg` | developer.apple.com → Wallet → *Add to Apple Wallet Guidelines* (badge artwork, per locale) |
| `add-to-google-wallet.svg` | developers.google.com/wallet → Brand guidelines → *Add to Google Wallet* buttons |

Both are localised by the vendors; the Arabic badges exist too, and dropping in
`add-to-apple-wallet-ar.svg` alongside would be the way to carry that through.

Rules both vendors share, worth honouring whichever artwork is in place: do not
recolour, do not stretch (lock the aspect ratio), keep clear space around it,
and respect the minimum height — which is why the component sets a height and
lets width follow.
