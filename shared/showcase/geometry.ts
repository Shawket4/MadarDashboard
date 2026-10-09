import { BufferGeometry, ExtrudeGeometry, PlaneGeometry, Shape, ShapeGeometry, Vector3 } from "three";

/** A rounded rectangle outline centred on the origin, with true circular corners. */
export function roundedRectShape(w: number, h: number, r: number): Shape {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const x = -w / 2;
  const y = -h / 2;
  const s = new Shape();
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - rr);
  s.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false);
  s.lineTo(x + rr, y + h);
  s.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + rr);
  s.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false);
  return s;
}

/**
 * A device body: a rounded slab `w × h × d` centred on the origin, its front
 * face toward +z, edges softened by `bevel`. Groups: 0 = the front and back
 * faces, 1 = the band around the sides (frame + bevel), so a device can have a
 * glass face and a metal frame.
 */
export function slab(w: number, h: number, d: number, r: number, bevel = Math.min(d * 0.35, 0.03)): BufferGeometry {
  const core = d - bevel * 2;
  const g = new ExtrudeGeometry(roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(r - bevel, 0.001)), {
    depth: core,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 20,
  });
  g.translate(0, 0, -core / 2);
  g.computeVertexNormals();
  return g;
}

/** A flat rounded rectangle facing +z, with UVs spanning 0..1 across its box (for screens). */
export function roundedPlane(w: number, h: number, r: number): BufferGeometry {
  const g = new ShapeGeometry(roundedRectShape(w, h, r), 20);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** A circle as a 1-pixel line in the xz plane (a hairline orbit on the floor). */
export function circleLine(radius: number, segments = 160): BufferGeometry {
  const pts: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new BufferGeometry().setFromPoints(pts);
}

/**
 * A strip of paper `w × h` (a receipt), gently waved and with its bottom rolled
 * back on itself, the way a receipt curls once it's torn off the printer.
 */
export function receiptGeometry(w: number, h: number): BufferGeometry {
  const g = new PlaneGeometry(w, h, 12, 140);
  const pos = g.attributes.position;
  const curlFrom = -h * 0.28; // where the roll starts, measured from the centre
  const radius = 0.2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // A soft lengthwise wave and a slight cup across the width.
    let z = 0.06 * Math.sin((y / h) * Math.PI * 1.6 + 0.6) - 0.05 * (x / w) ** 2;
    let yy = y;
    if (y < curlFrom) {
      // Roll the paper back around a cylinder below the curl line.
      const s = curlFrom - y; // arc length past the line
      const a = s / radius;
      yy = curlFrom - radius * Math.sin(a);
      z += -radius * (1 - Math.cos(a));
    }
    pos.setXYZ(i, x, yy, z);
  }
  g.computeVertexNormals();
  return g;
}
