# shared/

Code used by both the dashboard (this repository's root, React) and the marketing
site (`site/`, Astro). Plain TypeScript with no framework, so either can import it:
the dashboard as `@shared/…` (tsconfig paths + Vite alias), the site the same way
(its own `@shared` alias; Vite resolves `three` from the site's own install).

## showcase/: the family in 3D

Madar's products as 3D objects over a hairline orbit, one at a time, in the order
`keys.ts` gives (the only place it is set): the till (an iPad on a stand), Dawam on a
phone, a takeaway cup (ordering), a receipt (the one ledger), the kitchen screen and
the rewards card on a phone. Modelled in code (no model files), lit by a studio built
in the scene (no HDR file), the screens painted on 2D canvases as illustrations:
Madar's layouts, bars where words would be, no figures.

| File | What |
|---|---|
| `engine.ts` | `createShowcase(canvas, options)`: the scene, its loop and its `stage` |
| `models.ts` | the six objects |
| `screens.ts` | the screens' and the receipt's artwork |
| `keys.ts` | the objects and their order |
| `geometry.ts`, `studio.ts`, `palette.ts`, `marks.ts` | shapes, lighting, colours, the Dawam mark |

Two ways to drive it:

- **`play()`**: it plays by itself, object after object, and reports which one is
  showing (the dashboard's sign-in panel, `src/features/auth/showcase-3d.tsx`).
- **Animate `stage`** (`index`, `presence`, `leaving`, `turn`) from outside: the site
  does it with GSAP as the page scrolls (`site/src/scripts/family.ts`), passing its
  own `stage` so the scroll can move it before the 3D has even loaded.

`setActive(false)` stops drawing (off screen, panel hidden); `dispose()` frees the
GPU context. Both hosts load the engine lazily, keep a 2D fallback, and never load it
under reduced motion.
