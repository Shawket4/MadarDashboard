# Wallet badges

Apple and Google both publish official "Add to Wallet" artwork with brand
guidelines that forbid altering it. The two SVGs here follow the documented
specification — black pill, the platform mark, the exact wording each requires —
but they are **recreations, not the official files**.

**To use the real ones, replace the file and change nothing else.** The button
component renders these by path and does not care what is inside them:

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
