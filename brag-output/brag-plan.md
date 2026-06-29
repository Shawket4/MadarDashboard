# /brag — Plan & Storyboard

**Project:** Madar — bilingual platform for running a coffee shop end to end.
**This reel:** the customer ordering workflow, dramatized as a single beat-synced kinetic motion-reel — order → place → POS teller receives & accepts → prepared → delivered.
**Tone:** `POV: one year of motion design` — confident solo-dev reel, beat-synced, kinetic. (Mapped to the `cinematic`/`chaotic` pacing family: hard cuts on the beat, overshoot, whip-pans, motion blur.)
**Renderer:** Remotion (hand-built). `/brag` owns story + storyboard + copy only.
**Format:** 9:16 vertical · 1080×1920 · 30fps · **330 frames (~11s)**.

---

## Planning rubric

1. **What is it?** Madar's customer ordering surface (`/order/:orgId`) + fulfilment tracking (`/track/:id`), with the teller side living in the Madar POS. One tap-to-table loop.
2. **Who is it for?** Coffee-shop operators and their diners. The reel's audience is the operator/founder showing off the loop.
3. **The one thing to show:** a real order travels the whole pipeline — diner taps, teller accepts, kitchen makes it, rider delivers — with nothing falling on the floor.
4. **Hook (first 2s):** two dark blurred slabs breathing on a paper-white field, tension building under the music → they snap into the **Madar** wordmark on the drop.
5. **Proof / "show the thing":** stylized-but-authentic in-engine UI using real tokens, real flow steps, and the real status line (Accepted → Preparing → Ready → Out for delivery → Delivered).
6. **Punchline / payoff:** "From tap to table." stamp → handheld whip-tilt off the monitor to a blurry close-up of a phone reading **Delivered ✓**.
7. **Tone:** kinetic, beat-synced, premium. Navy/teal trust + warm hospitality. Not loud-neon delivery-app, not enterprise-grey.
8. **Music:** `happy-beats-business-moves-vol-1` (120.19 BPM, 163.96s). Trim the soft intro so a downbeat lands on the **frame-60 drop**; every major cut sits on a 15-frame beat. SFX layered for hits.
9. **Format & length:** 9:16, 1080×1920, 30fps, 330f — matches the reference reel mechanics, recreated (not copied).

---

## Palette & type (from `globals.css`)

| Token | Hex | Use |
|---|---|---|
| primary (teal deep) | `#0D6273` | primary actions, POS chrome |
| brand (teal light) | `#2E94A6` | highlights, CTA accent, wipe |
| ink | `#14181E` | text, build-up slabs |
| paper | `#EFF3F4` | background |
| slate | `#76828B` | muted text |
| card | `#FFFFFF` | surfaces |
| success | `#2E8B57`-ish (oklch 0.55 .1 160) | Accepted/Delivered |

Display serif **Fraunces** (wordmark, tagline). UI sans **Inter** (all chrome, numerals tabular).

---

## Beat sheet (frame numbers @30fps, beat = 15f)

Inner content plays on a **16:9 monitor inset**; an outer **practical-camera** layer (handheld drift, bezel, screen glow, vignette) wraps it. Banner **"POV: one year of Madar"** is pinned upper-center for all 330 frames.

| # | Frames | Beat | What happens (story) | Mechanics |
|---|---|---|---|---|
| 1 | 0–60 | BUILD-UP | Two ink slabs on paper, slow scale-in, Gaussian blur → sharpening. Tension. | linear scale + blur→0 |
| 2 | 60–90 | **DROP** | Hard cut on the beat — slabs snap to focus revealing the **Madar** wordmark + "ordering, end to end". | impact SFX, snap |
| 3 | 90–120 | POP-IN | Intro vanishes; **phone with the menu** scales in from 0% with spring overshoot (~110%→100%, bouncy). Coffee menu, "Spanish Latte" etc. | `spring()` overshoot |
| 4 | 120–150 | PUNCH-IN + WHIP | Fast Z punch-in into an item → **customizer** (size + extra-shot toggles flick on); high-velocity **whip-pan left** w/ motion blur bridging the cut to the cart. | interpolate + blur trail |
| 5 | 150–210 | UI FLOW | **Cart** total counts up → **phone keypad** types the number (keypress SFX) → **"Place order"** tap → success check. Rapid zoom-out + **Z-axis spin** swaps layout to the **POS teller**: incoming **order ticket** drops in (ping), teller taps **Accept** → turns green. | track-matte/alpha reveals, ease-out settle, Z-spin |
| 6 | 210–240 | WIPE | Solid **teal** rectangle descends top→bottom (fast linear vertical wipe) back to clean paper, revealing the **kitchen prep** stepper: Accepted → **Preparing** (ChefHat, steam) → Ready. | linear vertical wipe |
| 7 | 240–270 | RESOLVE | **Out for delivery → Delivered**: rider glides across; **Delivered** check stamps with a slight scale-down; tagline **"From tap to table."** fades in. Hard cut to brand mark. | stamp scale-down |
| 8 | 270–330 | PRACTICAL OUTRO | Cut from screen to the **outer camera**: sudden whip-tilt-down, heavy natural motion blur + focal shift, ending on a blurry extreme close-up of the phone reading **Delivered ✓**. Handheld, jarring. | camera tilt + blur + rack-focus |

**Music cue guidance:** beats land on the 120 BPM grid (every 15f). Major hits to align: f60 (drop), f90, f120, f150 (whip), f210 (wipe), f240, f270 (cut to camera). SFX: `interface/drop_001` on f60; `ui/switch`+blur whoosh on f150; keypress run f168–186; `interface/bong_001` success on Accept (~f200) and Delivered (~f258); low `interface/glitch`/whoosh on the f270 camera cut.
