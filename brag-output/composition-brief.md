# Composition brief — Remotion (`brag-output/composition/`)

Single `<Composition id="MadarReel">`, 1080×1920, fps 30, durationInFrames **330**.

## Layer stack (back → front)
1. **PracticalCamera** — paper-toned room, soft vignette, subtle handheld drift (position/rotation noise from a deterministic seed). Owns the frame-270→330 whip-tilt-down + rack-focus.
2. **Monitor** — rounded-bezel screen holding a 16:9 inset (`InnerReel`) centered in the upper ~two-thirds; faint screen glow + scanline/reflection overlay at low opacity.
3. **InnerReel (16:9, 1920×1080 logical, scaled to fit)** — the 7 content beats below, hard-cut and beat-synced.
4. **Banner** — semi-transparent ink pill, white Inter text "POV: one year of Madar", pinned upper-center third, frames 0–330.
5. **Audio** — `<Audio>` music bed (trimmed) + per-hit `<Sequence><Audio></Sequence>` SFX.

## InnerReel beats (frames are global)
- `BuildUp` 0–60 · `Drop` 60–90 · `PopInMenu` 90–120 · `PunchWhip` 120–150 · `UIFlow` 150–210 (cart→keypad→place→**spin to POS**→Accept) · `Wipe` 210–240 (→ kitchen prep stepper) · `Resolve` 240–270 (delivery + tagline). Beat 8 (270–330) is the PracticalCamera takeover; InnerReel freezes on the Delivered card underneath.

## Mechanics map
- **Overshoot:** `spring({fps, frame, config:{damping:9, stiffness:120, mass:0.8}})` scaled to settle ~110%→100%.
- **Whip + motion blur:** fast `interpolate` X translate with `Easing.bezier`, plus a stacked semi-transparent "trail" (2–3 ghost copies offset along travel) + CSS `filter: blur()` ramped with velocity.
- **Alpha / track-matte reveals:** elements appear via an animated clip/mask threshold (`clipPath` inset or a wiping gradient mask), not by sliding from screen edges.
- **Z punch-in:** scale 1→2.2 with slight perspective; **Z-spin swap:** `rotateY` 0→90 (hide) cut to 90→0 of the POS layout (`transformStyle: preserve-3d`, perspective ~1200px).
- **Wipe:** full-width teal rect, `translateY(-100%→0→0→100%)` linear, covering then revealing the next layer.
- **Stamp:** opacity 0→1 with scale 1.15→1.0 ease-out.
- **Practical outro:** rotateX/translateY tilt with large `blur()` + brightness rack, deterministic handheld noise.

## Asset map (`public/`)
- `audio/track.mp3` ← `happy-beats-business-moves-vol-1`. `<Audio trimBefore≈30>` so a downbeat hits f60.
- `sfx/drop.ogg` (interface/drop_001), `sfx/whoosh.ogg` (interface/switch_005), `sfx/key.wav` (keyboard/keypress-004), `sfx/chime.ogg` (interface/bong_001), `sfx/cut.ogg` (interface/glitch_002).

## Audio sync table
| frame | event | sfx |
|---|---|---|
| 60 | drop / wordmark | drop.ogg |
| 90 | menu pop | — |
| 120 | punch-in | whoosh (soft) |
| 150 | whip to cart | whoosh.ogg |
| 168–186 | keypad typing | key.wav ×N |
| ~196 | spin to POS | whoosh.ogg |
| ~204 | Accept | chime.ogg |
| 210 | wipe | whoosh.ogg |
| ~258 | Delivered | chime.ogg |
| 270 | camera takeover | cut.ogg |

## Constraints
- `prefers-reduced-motion` is not applicable to a rendered video; motion is intentional.
- Deterministic only (`random(seed)` from Remotion) — no `Math.random`/`Date.now`.
- Frame-accurate to the beat sheet above.
