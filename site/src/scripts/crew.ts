// The crew on the Free page (components/free): the badges drop in and swing, the Z-report
// prints, the steps' numbers rise, and the characters live a little: they pop in once,
// blink and wave at their own uneven pace, follow the pointer with their eyes (or glance
// around on a phone), and hop when tapped or pointed at; the joyful ones jump as they
// arrive. All of it only with motion allowed, and only while on screen: nothing loops or
// spends a frame out of sight. Without this file everything is simply there, still
// (global.css "The crew").

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce) {
  // From here on the page may hold the badges and the receipt back until they scroll in.
  root.classList.add("crew-armed");

  const swings = Array.from(document.querySelectorAll<HTMLElement>("[data-swing]"));
  const figures = Array.from(document.querySelectorAll<SVGSVGElement>("svg[data-crew]"));
  const onScreen = new Set<Element>();
  /** What carries on when it comes back on screen (a swing paused mid-swing). */
  const resume = new Map<Element, () => void>();
  /** What a joyful character does the first time it comes in: a jump. */
  const joys = new Map<Element, () => void>();

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target;
        if (e.isIntersecting) {
          onScreen.add(el);
          // Into view once: the badge drops, a character pops up, the duties tick.
          if (!el.hasAttribute("data-in")) {
            el.setAttribute("data-in", "");
            joys.get(el)?.();
          }
          resume.get(el)?.();
        } else onScreen.delete(el);
        // The endless bits (a sip, the steam) run only while on screen.
        if (el instanceof SVGSVGElement) el.toggleAttribute("data-live", e.isIntersecting);
      }
    },
    { rootMargin: "0px 0px -4% 0px" },
  );
  const cols = Array.from(document.querySelectorAll<HTMLElement>(".crew-col"));
  for (const el of [...swings, ...figures, ...cols]) io.observe(el);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const live = (f: Element) => onScreen.has(f) && !document.hidden;

  // The steps: each number rises and its rule draws on once seen.
  for (const el of document.querySelectorAll(".free-step")) io.observe(el);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) for (const go of resume.values()) go();
  });

  /** Set a flag for a while (a blink, a wave, a hop), then clear it. */
  const flash = (el: Element, attr: string, ms: number) => {
    el.setAttribute(attr, "");
    window.setTimeout(() => el.removeAttribute(attr), ms);
  };

  for (const [i, f] of figures.entries()) {
    // Blinks: every few seconds, now and then a double.
    const blink = () => {
      if (live(f)) {
        flash(f, "data-blink", 130);
        if (Math.random() < 0.25) window.setTimeout(() => flash(f, "data-blink", 120), 260);
      }
      window.setTimeout(blink, rand(2600, 6200));
    };
    window.setTimeout(blink, rand(900, 3000));

    // Waves: one soon after it arrives (staggered, so two never wave in step), then idly.
    const wave = () => {
      if (live(f)) flash(f, "data-wave", 1700);
      window.setTimeout(wave, rand(6500, 12000));
    };
    window.setTimeout(wave, 1600 + i * 900);

    // Pointed at or tapped: a hop, a big smile and a wave.
    const cheer = () => {
      if (f.hasAttribute("data-cheer")) return;
      flash(f, "data-cheer", 760);
      flash(f, "data-wave", 1700);
    };
    const target = f.closest("[data-crew-host]") ?? f;
    target.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType === "mouse") cheer();
    });
    target.addEventListener("click", cheer);
    // A joyful one jumps once it has popped in; a pair jumps one after the other.
    if (f.hasAttribute("data-joy")) {
      const delay = 650 + 170 * joys.size;
      joys.set(f, () => window.setTimeout(cheer, delay));
    }
  }

  // Eyes: they follow a mouse; on touch screens they glance around now and then.
  const pupils = figures.map((f) => ({ f, els: Array.from(f.querySelectorAll<SVGGElement>(".crew-pupil")) }));
  const look = (f: SVGSVGElement, els: SVGGElement[], dx: number, dy: number) => {
    // dx, dy in -1…1; the pupils travel at most 3 units of the artwork inside the eye.
    for (const el of els) el.style.transform = `translate(${(dx * 3).toFixed(2)}px, ${(dy * 2.4).toFixed(2)}px)`;
    f.toggleAttribute("data-looking", dx !== 0 || dy !== 0);
  };
  let pointer: { x: number; y: number } | null = null;
  let frame = 0;
  const follow = () => {
    frame = 0;
    if (!pointer) return;
    for (const { f, els } of pupils) {
      if (!onScreen.has(f)) continue;
      const r = f.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.45;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      // Full travel from about a character's width away; closer, the eyes ease to centre.
      const k = Math.min(1, d / Math.max(r.width, 80));
      look(f, els, (dx / d) * k, (dy / d) * k);
    }
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(follow);
    },
    { passive: true },
  );
  // The mouse leaves the window: eyes back to the middle.
  document.addEventListener("mouseout", (e) => {
    if (e.relatedTarget) return;
    pointer = null;
    for (const { f, els } of pupils) look(f, els, 0, 0);
  });

  const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasMouse) {
    const glance = () => {
      for (const { f, els } of pupils) {
        if (!live(f) || Math.random() < 0.4) continue;
        const a = rand(0, Math.PI * 2);
        look(f, els, Math.cos(a), Math.sin(a) * 0.7);
        window.setTimeout(() => look(f, els, 0, 0), rand(700, 1400));
      }
      window.setTimeout(glance, rand(2500, 4500));
    };
    window.setTimeout(glance, 2000);
  }

  // A badge hangs on its lanyard like a pendulum, and everything about it is physics (no
  // keyframes): it falls in from above the screen on a stiff spring, and the instant it lands
  // it swings (a damped pendulum, in degrees). A breeze, a passing mouse, or a hand that
  // holds it and lets go keep it swinging. It starts the moment it is on screen.
  const SWING_HZ = 0.42;
  const K = (2 * Math.PI * SWING_HZ) ** 2;
  const C = 1.1;
  for (const s of swings) {
    const badge = s.querySelector<HTMLElement>(".crew-badge");
    if (!badge) continue;
    let a = 0; // angle, degrees
    let v = 0; // degrees per second
    let y = 0; // vertical offset, px (negative = above its place)
    let vy = 0;
    let falling = false;
    let held = false;
    let last = 0;
    let raf = 0;
    const settled = () => s.hasAttribute("data-settled");
    const tick = (now: number) => {
      raf = 0;
      // Off screen the swing waits where it is, spending no frames; it carries on when back.
      if (!falling && !held && !live(s)) return;
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      if (falling) {
        // A stiff, slightly underdamped spring to 0: arrives fast, one small bounce.
        vy += (-170 * y - 13 * vy) * dt;
        y += vy * dt;
        if (y >= 0 && vy > 0) {
          falling = false;
          y = 0;
          vy = 0;
          s.setAttribute("data-settled", "");
          v += Math.random() < 0.5 ? 62 : -62; // the landing sets it swinging
        }
      }
      if (!held) {
        v += (-K * a - C * v) * dt;
        a = Math.max(-40, Math.min(40, a + v * dt));
      }
      badge.style.transform = `translateY(${y.toFixed(1)}px) rotate(${a.toFixed(3)}deg)`;
      if (falling || held || Math.abs(a) > 0.02 || Math.abs(v) > 0.05) raf = requestAnimationFrame(tick);
      else badge.style.transform = "";
    };
    const run = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const kick = (dv: number) => {
      v += dv;
      run();
    };
    resume.set(s, () => {
      if (Math.abs(a) > 0.02 || Math.abs(v) > 0.05) run();
    });
    // Start: from just above the top of the screen, as soon as it is in view.
    new MutationObserver((_, mo) => {
      if (!s.hasAttribute("data-in")) return;
      mo.disconnect();
      y = -(badge.getBoundingClientRect().bottom + 60);
      falling = true;
      badge.style.transform = `translateY(${y.toFixed(1)}px)`;
      run();
    }).observe(s, { attributes: true, attributeFilter: ["data-in"] });
    // A breeze, only while it is on screen.
    const breeze = () => {
      if (settled() && live(s) && !held && Math.abs(a) < 1) kick(rand(14, 26) * (Math.random() < 0.5 ? -1 : 1));
      window.setTimeout(breeze, rand(3200, 6000));
    };
    window.setTimeout(breeze, 4500);
    s.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse" && settled() && !held) kick(rand(30, 40) * (Math.random() < 0.5 ? -1 : 1));
    });
    // Hold it: the card follows the pointer around the lanyard's top; let go and it swings.
    badge.addEventListener("pointerdown", (e) => {
      if (!settled()) return;
      held = true;
      s.setAttribute("data-held", "");
      badge.setPointerCapture(e.pointerId);
      const r = badge.getBoundingClientRect();
      const lanyard = parseFloat(getComputedStyle(s).getPropertyValue("--lanyard")) * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const px = r.left + r.width / 2;
      const py = r.top - lanyard;
      let prev = a;
      let prevT = performance.now();
      const move = (m: PointerEvent) => {
        const ang = (Math.atan2(m.clientX - px, m.clientY - py) * 180) / Math.PI;
        a = Math.max(-38, Math.min(38, ang));
        const t = performance.now();
        v = ((a - prev) / Math.max(1, t - prevT)) * 1000;
        prev = a;
        prevT = t;
      };
      const up = () => {
        held = false;
        s.removeAttribute("data-held");
        badge.removeEventListener("pointermove", move);
        badge.removeEventListener("pointerup", up);
        badge.removeEventListener("pointercancel", up);
        v = Math.max(-110, Math.min(110, v));
        kick(0);
      };
      badge.addEventListener("pointermove", move);
      badge.addEventListener("pointerup", up);
      badge.addEventListener("pointercancel", up);
      kick(0);
    });
  }
}
