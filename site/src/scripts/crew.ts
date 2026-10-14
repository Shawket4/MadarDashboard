// The crew on the Free page (components/free): the badges drop in and swing, the Z-report
// prints, and the characters live a little: they breathe (CSS), blink and wave at their
// own uneven pace, follow the pointer with their eyes (or glance around on a phone), and
// hop when tapped or pointed at. All of it only with motion allowed, and only while on
// screen. Without this file everything is simply there, still (global.css "The crew").

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce) {
  // From here on the page may hold the badges and the receipt back until they scroll in.
  root.classList.add("crew-armed");

  const swings = Array.from(document.querySelectorAll<HTMLElement>("[data-swing]"));
  const figures = Array.from(document.querySelectorAll<SVGSVGElement>("svg[data-crew]"));
  const onScreen = new Set<Element>();

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          onScreen.add(e.target);
          // Into view once: the badge drops, a character pops up, the duties tick.
          e.target.setAttribute("data-in", "");
        } else onScreen.delete(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  const cols = Array.from(document.querySelectorAll<HTMLElement>(".crew-col"));
  for (const el of [...swings, ...figures, ...cols]) io.observe(el);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const live = (f: Element) => onScreen.has(f) && !document.hidden;

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

  // A badge is a pendulum on its lanyard: a damped spring (degrees), kicked when the drop lands,
  // by a breeze now and then, by a pointer passing over it, and held and flung by a finger or
  // the mouse. The CSS only drops it in; from `data-settled` on, this owns its rotation.
  const SWING_HZ = 0.42;
  const K = (2 * Math.PI * SWING_HZ) ** 2;
  const C = 1.1;
  for (const s of swings) {
    const badge = s.querySelector<HTMLElement>(".crew-badge");
    if (!badge) continue;
    let a = 0; // angle
    let v = 0; // degrees per second
    let held = false;
    let last = 0;
    let raf = 0;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      if (!held) {
        v += (-K * a - C * v) * dt;
        a = Math.max(-40, Math.min(40, a + v * dt));
      }
      badge.style.transform = `rotate(${a.toFixed(3)}deg)`;
      if (held || Math.abs(a) > 0.02 || Math.abs(v) > 0.05) raf = requestAnimationFrame(tick);
      else badge.style.transform = "";
    };
    const kick = (dv: number) => {
      v += dv;
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const settled = () => s.hasAttribute("data-settled");
    badge.addEventListener("animationend", (e) => {
      if ((e as AnimationEvent).animationName !== "crew-drop") return;
      s.setAttribute("data-settled", "");
      kick(rand(0, 1) < 0.5 ? 30 : -30); // the landing
    });
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
      // The pivot: the lanyard's top, straight above the card's centre.
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
