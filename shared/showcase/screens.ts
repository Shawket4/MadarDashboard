import { CanvasTexture, SRGBColorSpace } from "three";
import type { WebGLRenderer } from "three";

import { DAWAM_STROKES } from "./marks";
import { C } from "./palette";

/**
 * The artwork on the showcase's screens and paper, painted on 2D canvases and
 * used as textures. Each is an illustration of the real thing (Madar's own
 * layouts and palette) with bars where words would be and no figures at all, so
 * nothing on the sign-in page can read as someone's data.
 */

type Ctx = CanvasRenderingContext2D;
export type Painter = { width: number; height: number; paint: (ctx: Ctx, w: number, h: number) => void };

/** Paint a canvas and wrap it as a texture (sRGB, mipmapped, anisotropic for angled views). */
export function paintTexture(p: Painter, renderer?: WebGLRenderer): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = p.width;
  canvas.height = p.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    p.paint(ctx, p.width, p.height);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer?.capabilities.getMaxAnisotropy() ?? 1);
  return tex;
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function rrPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  rrPath(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

function outline(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, stroke: string, lw: number, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  rrPath(ctx, x + lw / 2, y + lw / 2, w - lw, h - lw, r);
  ctx.stroke();
  ctx.restore();
}

/** A line of "text": a rounded bar. */
function bar(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, alpha = 1) {
  box(ctx, x, y, w, h, h / 2, fill, alpha);
}

function dot(ctx: Ctx, cx: number, cy: number, r: number, fill: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function ring(ctx: Ctx, cx: number, cy: number, r: number, lw: number, stroke: string, alpha = 1, dash?: number[]) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function dashed(ctx: Ctx, x1: number, x2: number, y: number, stroke: string, lw = 3, alpha = 0.5) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.setLineDash([lw * 3, lw * 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

/** Madar's mark around (cx, cy); `r` is the ring's radius (proportions from the app icon). */
function madarMark(ctx: Ctx, cx: number, cy: number, r: number, ink: string, satellite: string) {
  ring(ctx, cx, cy, r, r * 0.192, ink);
  dot(ctx, cx, cy, r * 0.352, ink);
  dot(ctx, cx + r * 0.705, cy - r * 0.708, r * 0.235, satellite);
}

/** Dawam's heavy d, `size` tall, its box's top-left at (x, y). Monochrome by rule. */
function dawamMark(ctx: Ctx, x: number, y: number, size: number, ink: string) {
  const k = size / 84;
  ctx.save();
  ctx.translate(x - 15 * k, y - 8 * k);
  ctx.scale(k, k);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of DAWAM_STROKES) ctx.stroke(new Path2D(d));
  ctx.restore();
}

/** A takeaway cup glyph (the menu tiles' pictures), `s` tall, centred. */
function cupGlyph(ctx: Ctx, cx: number, cy: number, s: number, stroke: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = s * 0.085;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.36, cy - s * 0.26);
  ctx.lineTo(cx - s * 0.27, cy + s * 0.44);
  ctx.lineTo(cx + s * 0.27, cy + s * 0.44);
  ctx.lineTo(cx + s * 0.36, cy - s * 0.26);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, cy - s * 0.38);
  ctx.lineTo(cx + s * 0.42, cy - s * 0.38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.33, cy + s * 0.02);
  ctx.lineTo(cx + s * 0.33, cy + s * 0.02);
  ctx.stroke();
  ctx.restore();
}

/** A mug glyph, for variety among the tiles. */
function mugGlyph(ctx: Ctx, cx: number, cy: number, s: number, stroke: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = s * 0.085;
  rrPath(ctx, cx - s * 0.36, cy - s * 0.22, s * 0.56, s * 0.6, s * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.24, cy + s * 0.05, s * 0.15, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.48);
  ctx.lineTo(cx + s * 0.38, cy + s * 0.48);
  ctx.stroke();
  ctx.restore();
}

/** A deterministic PRNG, so the QR codes look the same on every visit. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A QR-like code (finder squares and modules), `size` square at (x, y), on `paper`. */
function qr(ctx: Ctx, x: number, y: number, size: number, ink: string, seed: number, paper = C.white) {
  const n = 25;
  const m = size / n;
  const rand = prng(seed);
  ctx.save();
  ctx.fillStyle = ink;
  // The finder squares: ink, a ring of paper, an ink centre.
  const finder = (fx: number, fy: number) => {
    ctx.fillStyle = ink;
    ctx.fillRect(x + fx * m, y + fy * m, 7 * m, 7 * m);
    ctx.fillStyle = paper;
    ctx.fillRect(x + (fx + 1) * m, y + (fy + 1) * m, 5 * m, 5 * m);
    ctx.fillStyle = ink;
    ctx.fillRect(x + (fx + 2) * m, y + (fy + 2) * m, 3 * m, 3 * m);
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const inFinder = (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
      if (!inFinder && rand() > 0.52) ctx.fillRect(x + i * m, y + j * m, m + 0.4, m + 0.4);
    }
  }
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  ctx.restore();
}

/** A phone's status bar: the island, a time-shaped bar, signal and battery. */
function statusBar(ctx: Ctx, w: number, ink: string) {
  box(ctx, w / 2 - 78, 22, 156, 46, 23, "#000000");
  bar(ctx, 52, 36, 58, 18, ink, 0.9);
  for (let i = 0; i < 4; i++) box(ctx, w - 152 + i * 11, 50 - i * 5, 7, 8 + i * 5, 2, ink, 0.9);
  outline(ctx, w - 98, 34, 42, 22, 7, ink, 2.5, 0.5);
  box(ctx, w - 94, 38, 30, 14, 4, ink, 0.9);
}

// ── The till: Madar's selling screen on the iPad ─────────────────────────────

export const TILL_SCREEN: Painter = {
  width: 1200,
  height: 818,
  paint(ctx, W, H) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    // The rail.
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, 92, H);
    madarMark(ctx, 46, 52, 17, C.paper, C.tealBright);
    for (let i = 0; i < 5; i++) {
      const y = 116 + i * 66;
      if (i === 0) box(ctx, 22, y - 4, 48, 48, 12, C.inkRaised);
      outline(ctx, 35, y + 9, 22, 22, 6, i === 0 ? C.paper : C.slate, 3.5, i === 0 ? 1 : 0.7);
    }
    dot(ctx, 46, H - 52, 18, C.inkRaised);

    // Header and the categories.
    bar(ctx, 124, 34, 210, 24, C.text);
    box(ctx, 470, 26, 330, 42, 21, C.white);
    outline(ctx, 470, 26, 330, 42, 21, C.hair, 2);
    ring(ctx, 494, 47, 8, 3, C.slate);
    bar(ctx, 512, 41, 120, 12, C.slate, 0.7);
    const chips = [116, 92, 128, 100, 86];
    let cx = 124;
    chips.forEach((cw, i) => {
      if (i === 0) {
        box(ctx, cx, 92, cw, 40, 20, C.ink);
        bar(ctx, cx + 22, 107, cw - 44, 10, C.paper);
      } else {
        box(ctx, cx, 92, cw, 40, 20, C.white);
        outline(ctx, cx, 92, cw, 40, 20, C.hair, 2);
        bar(ctx, cx + 22, 107, cw - 44, 10, C.slateDeep, 0.65);
      }
      cx += cw + 12;
    });

    // The menu tiles.
    const tints = ["#E3EEEF", "#EEE9E1", "#E6EBED", "#E1ECEB"];
    const gx = 124;
    const gy = 156;
    const tw = 162;
    const th = 196;
    const gap = 16;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 4 + c;
        const x = gx + c * (tw + gap);
        const y = gy + r * (th + gap);
        box(ctx, x, y, tw, th, 18, C.white);
        box(ctx, x + 10, y + 10, tw - 20, 104, 12, tints[i % tints.length]);
        const glyph = i % 3 === 1 ? mugGlyph : cupGlyph;
        glyph(ctx, x + tw / 2, y + 62, 58, i % 4 === 0 ? C.teal : C.slateDeep, 0.85);
        bar(ctx, x + 14, y + 130, [92, 112, 76, 104, 88, 118][i % 6], 13, C.text, 0.85);
        bar(ctx, x + 14, y + 158, 46, 12, C.teal, 0.9);
        if (i === 5) outline(ctx, x, y, tw, th, 18, C.teal, 4);
      }
    }

    // The order.
    const px = 852;
    const pw = 326;
    box(ctx, px, 22, pw, H - 44, 24, C.white);
    bar(ctx, px + 24, 50, 118, 20, C.text);
    box(ctx, px + pw - 76, 44, 52, 32, 16, C.sunk);
    const lines = [148, 116, 166, 98, 134];
    lines.forEach((lw, i) => {
      const y = 104 + i * 60;
      box(ctx, px + 24, y, 36, 36, 10, C.sunk);
      bar(ctx, px + 36, y + 13, 12, 10, C.slateDeep, 0.8);
      bar(ctx, px + 74, y + 6, lw, 13, C.text, 0.85);
      if (i % 2 === 0) bar(ctx, px + 74, y + 26, lw * 0.55, 9, C.slate);
      bar(ctx, px + pw - 24 - 52, y + 8, 52, 13, C.text, 0.85);
    });
    dashed(ctx, px + 24, px + pw - 24, 418, C.slate, 3, 0.6);
    bar(ctx, px + 24, 444, 92, 11, C.slate);
    bar(ctx, px + pw - 24 - 48, 444, 48, 11, C.slate);
    bar(ctx, px + 24, 470, 74, 11, C.slate);
    bar(ctx, px + pw - 24 - 40, 470, 40, 11, C.slate);
    bar(ctx, px + 24, 508, 104, 22, C.text);
    bar(ctx, px + pw - 24 - 84, 508, 84, 22, C.text);
    // Cash / card.
    box(ctx, px + 24, 572, (pw - 60) / 2, 54, 14, C.ink);
    bar(ctx, px + 24 + (pw - 60) / 4 - 30, 594, 60, 10, C.paper);
    box(ctx, px + 36 + (pw - 60) / 2, 572, (pw - 60) / 2, 54, 14, C.white);
    outline(ctx, px + 36 + (pw - 60) / 2, 572, (pw - 60) / 2, 54, 14, C.hair, 2);
    bar(ctx, px + 36 + (pw - 60) * 0.75 - 30, 594, 60, 10, C.slateDeep, 0.65);
    // Pay.
    box(ctx, px + 24, H - 132, pw - 48, 86, 22, C.teal);
    bar(ctx, px + pw / 2 - 58, H - 96, 116, 14, C.white, 0.95);
  },
};

// ── The kitchen display ───────────────────────────────────────────────────────

export const KITCHEN_SCREEN: Painter = {
  width: 1200,
  height: 684,
  paint(ctx, W, H) {
    ctx.fillStyle = C.inkDeep;
    ctx.fillRect(0, 0, W, H);

    // Top bar: the stations.
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, 74);
    madarMark(ctx, 42, 37, 13, C.paper, C.tealBright);
    const stations = [112, 128, 104];
    let sx = 82;
    stations.forEach((sw, i) => {
      box(ctx, sx, 17, sw, 40, 20, i === 0 ? C.tealBright : C.inkRaised);
      bar(ctx, sx + 24, 32, sw - 48, 10, i === 0 ? C.ink : C.slate, i === 0 ? 1 : 0.8);
      sx += sw + 10;
    });
    bar(ctx, W - 176, 30, 70, 14, C.slate, 0.7);
    dot(ctx, W - 76, 37, 13, C.inkRaised);

    // Tickets: [height, band colour, rows, dimmed].
    type Ticket = [number, string, number, boolean?];
    const columns: Ticket[][] = [
      [[292, C.teal, 4], [244, C.slateDeep, 3]],
      [[352, C.amber, 5], [190, C.teal, 2]],
      [[250, C.teal, 3], [288, C.slateDeep, 4]],
      [[214, C.green, 3, true], [276, C.teal, 4]],
    ];
    const pad = 22;
    const gap = 16;
    const cw = (W - pad * 2 - gap * 3) / 4;
    columns.forEach((col, ci) => {
      let y = 94;
      const x = pad + ci * (cw + gap);
      col.forEach(([th, band, rows, dim], ti) => {
        const a = dim ? 0.55 : 1;
        box(ctx, x, y, cw, th, 16, C.paper, a);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = band;
        rrPath(ctx, x, y, cw, 52, 16);
        ctx.fill();
        ctx.fillRect(x, y + 30, cw, 22);
        ctx.restore();
        bar(ctx, x + 18, y + 19, 68, 14, C.white, 0.95 * a);
        bar(ctx, x + cw - 64, y + 19, 46, 14, C.white, 0.7 * a);
        for (let r = 0; r < rows; r++) {
          const ry = y + 74 + r * 36;
          const done = dim || (ci + ti + r) % 4 === 0;
          if (done) {
            box(ctx, x + 18, ry, 20, 20, 6, C.ink, a);
          } else {
            outline(ctx, x + 18, ry, 20, 20, 6, C.slateDeep, 2.5, a);
          }
          bar(ctx, x + 50, ry + 4, [128, 96, 150, 112, 84][(r + ci) % 5], 12, C.text, 0.85 * a);
          if ((r + ti) % 3 === 1) bar(ctx, x + 64, ry + 22, 70, 8, C.slateDeep, 0.5 * a);
        }
        box(ctx, x + 18, y + th - 52, cw - 36, 34, 10, C.ink, a);
        bar(ctx, x + cw / 2 - 30, y + th - 40, 60, 10, C.paper, a);
        y += th + gap;
      });
    });
  },
};

// ── Rewards: the card in the wallet ──────────────────────────────────────────

export const REWARDS_SCREEN: Painter = {
  width: 600,
  height: 1292,
  paint(ctx, W, H) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    statusBar(ctx, W, C.text);
    bar(ctx, 40, 116, 150, 30, C.text);
    dot(ctx, W - 64, 131, 24, C.sunk);
    bar(ctx, W - 76, 129, 24, 5, C.text);
    bar(ctx, W - 66.5, 119, 5, 24, C.text);

    // The passes behind, then the card.
    box(ctx, 52, 182, W - 104, 90, 30, C.teal);
    box(ctx, 42, 206, W - 84, 90, 32, C.slateDeep);
    const x = 32;
    const y = 232;
    const w = W - 64;
    const h = 820;
    box(ctx, x, y, w, h, 36, C.ink);
    madarMark(ctx, x + 60, y + 64, 22, C.paper, C.tealBright);
    bar(ctx, x + 104, y + 52, 120, 24, C.paper);
    bar(ctx, x + w - 150, y + 44, 110, 11, C.slate, 0.8);
    bar(ctx, x + w - 110, y + 64, 70, 20, C.paper);

    // The stamps.
    box(ctx, x + 26, y + 128, w - 52, 300, 26, C.inkRaised);
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const sx = x + 26 + ((w - 52) / 5) * (col + 0.5);
      const sy = y + 128 + 300 * (row === 0 ? 0.28 : 0.72);
      if (i < 6) {
        dot(ctx, sx, sy, 36, C.tealBright);
        cupGlyph(ctx, sx, sy + 2, 34, C.ink);
      } else {
        ring(ctx, sx, sy, 34, 4, C.slate, 0.55, [8, 9]);
      }
    }

    // Fields, then the code.
    bar(ctx, x + 32, y + 468, 90, 11, C.slate, 0.8);
    bar(ctx, x + 32, y + 490, 150, 22, C.paper);
    bar(ctx, x + w - 32 - 90, y + 468, 90, 11, C.slate, 0.8);
    bar(ctx, x + w - 32 - 110, y + 490, 110, 22, C.paper);
    box(ctx, x + w / 2 - 128, y + 566, 256, 222, 20, C.white);
    qr(ctx, x + w / 2 - 92, y + 584, 184, C.ink, 7);

    dot(ctx, W / 2 - 14, y + h + 34, 5, C.text, 0.8);
    dot(ctx, W / 2 + 4, y + h + 34, 5, C.slate, 0.8);
    dot(ctx, W / 2 + 22, y + h + 34, 5, C.slate, 0.8);
    bar(ctx, W / 2 - 70, H - 30, 140, 8, C.text, 0.9);
  },
};

// ── Dawam: clocking in ───────────────────────────────────────────────────────

export const DAWAM_SCREEN: Painter = {
  width: 600,
  height: 1292,
  paint(ctx, W, H) {
    const paper = "#EFF3F4";
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);
    statusBar(ctx, W, C.ink);

    dawamMark(ctx, 46, 108, 44, C.ink);
    bar(ctx, 102, 120, 128, 22, C.ink);
    dot(ctx, W - 72, 130, 28, C.sunk);
    ring(ctx, W - 72, 130, 28, 3, C.ink, 0.15);

    bar(ctx, 46, 206, 264, 34, C.ink);
    bar(ctx, 46, 256, 176, 17, C.slateDeep, 0.6);

    // The branch zone, the shift's progress, the button.
    const cx = W / 2;
    const cy = 596;
    ring(ctx, cx, cy, 228, 3, C.slateDeep, 0.35, [4, 14]);
    ring(ctx, cx, cy, 176, 16, C.hair);
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, 176, -Math.PI / 2, Math.PI * 0.82);
    ctx.stroke();
    ctx.restore();
    dot(ctx, cx, cy, 136, C.ink);
    dawamMark(ctx, cx - 50, cy - 60, 120, paper);

    // The place, as a pill.
    outline(ctx, cx - 132, 860, 264, 58, 29, C.ink, 3);
    dot(ctx, cx - 92, 889, 9, C.ink);
    bar(ctx, cx - 66, 882, 170, 14, C.ink, 0.85);

    // The week.
    box(ctx, 32, 966, W - 64, 196, 28, C.white);
    const hours = [0.62, 0.84, 0.76, 0.9, 0.5, 0.3, 0.3];
    const colW = (W - 64 - 48) / 7;
    hours.forEach((v, i) => {
      const bx = 56 + i * colW + colW / 2 - 14;
      const top = 990 + (1 - v) * 116;
      const today = i === 4;
      const planned = i > 4;
      if (planned) {
        outline(ctx, bx, top, 28, 1106 - top, 10, C.slate, 3, 0.8);
      } else {
        box(ctx, bx, top, 28, 1106 - top, 10, today ? C.ink : C.slateDeep, today ? 1 : 0.55);
      }
      dot(ctx, bx + 14, 1132, 5, today ? C.ink : C.slate, today ? 1 : 0.8);
    });

    // Tab bar.
    for (let i = 0; i < 4; i++) {
      const tx = W / 8 + (i * W) / 4 - 16;
      box(ctx, tx, H - 106, 32, 32, 9, i === 0 ? C.ink : C.slate, i === 0 ? 1 : 0.6);
    }
    bar(ctx, W / 2 - 70, H - 30, 140, 8, C.ink, 0.9);
  },
};

// ── The receipt ──────────────────────────────────────────────────────────────

const RECEIPT_TEETH = 22;

/** The receipt's torn outline (zigzag top and bottom), as a path. */
function receiptOutline(ctx: Ctx, W: number, H: number) {
  const depth = 12;
  ctx.beginPath();
  ctx.moveTo(0, depth);
  for (let x = 0; x < W; x += RECEIPT_TEETH) {
    ctx.lineTo(x + RECEIPT_TEETH / 2, 0);
    ctx.lineTo(Math.min(x + RECEIPT_TEETH, W), depth);
  }
  ctx.lineTo(W, H - depth);
  for (let x = W; x > 0; x -= RECEIPT_TEETH) {
    ctx.lineTo(x - RECEIPT_TEETH / 2, H);
    ctx.lineTo(Math.max(x - RECEIPT_TEETH, 0), H - depth);
  }
  ctx.closePath();
}

export const RECEIPT_PAPER = "#FBFBF8";

export const RECEIPT_FRONT: Painter = {
  width: 520,
  height: 1196,
  paint(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.white;
    receiptOutline(ctx, W, H);
    ctx.fill();
    ctx.save();
    receiptOutline(ctx, W, H);
    ctx.clip();
    const print = "#1B2428";
    madarMark(ctx, W / 2, 96, 30, print, C.teal);
    bar(ctx, W / 2 - 70, 154, 140, 18, print);
    bar(ctx, W / 2 - 112, 192, 224, 10, C.slateDeep, 0.6);
    bar(ctx, W / 2 - 82, 212, 164, 10, C.slateDeep, 0.6);
    dashed(ctx, 40, W - 40, 252, print, 3, 0.45);
    const items = [150, 118, 176, 104, 142, 128];
    items.forEach((iw, i) => {
      const y = 286 + i * 56;
      bar(ctx, 44, y, iw, 14, print, 0.9);
      if (i % 2 === 1) bar(ctx, 60, y + 23, iw * 0.5, 9, C.slateDeep, 0.55);
      bar(ctx, W - 44 - 58, y, 58, 14, print, 0.9);
    });
    dashed(ctx, 40, W - 40, 640, print, 3, 0.45);
    bar(ctx, 44, 668, 104, 11, C.slateDeep, 0.6);
    bar(ctx, W - 44 - 50, 668, 50, 11, C.slateDeep, 0.6);
    bar(ctx, 44, 694, 84, 11, C.slateDeep, 0.6);
    bar(ctx, W - 44 - 42, 694, 42, 11, C.slateDeep, 0.6);
    bar(ctx, 44, 734, 128, 24, print);
    bar(ctx, W - 44 - 92, 734, 92, 24, print);
    dashed(ctx, 40, W - 40, 792, print, 3, 0.45);
    qr(ctx, W / 2 - 84, 826, 168, print, 31);
    bar(ctx, W / 2 - 96, 1030, 192, 11, C.slateDeep, 0.6);
    dot(ctx, W / 2, 1076, 7, C.teal);
    ctx.restore();
  },
};

/** The receipt's back: blank thermal paper in the same torn outline. */
export const RECEIPT_BACK: Painter = {
  width: 260,
  height: 598,
  paint(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.scale(W / RECEIPT_FRONT.width, H / RECEIPT_FRONT.height);
    ctx.fillStyle = C.white;
    receiptOutline(ctx, RECEIPT_FRONT.width, RECEIPT_FRONT.height);
    ctx.fill();
    ctx.restore();
  },
};

// ── The cup's sleeve ─────────────────────────────────────────────────────────

/** Wrapped around the cup, its centre facing the viewer. */
export const SLEEVE: Painter = {
  width: 1024,
  height: 256,
  paint(ctx, W, H) {
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.paper;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 14, W, 2);
    ctx.fillRect(0, H - 16, W, 2);
    ctx.globalAlpha = 1;
    madarMark(ctx, W / 2, H / 2, 52, C.paper, C.tealBright);
  },
};
