import React from "react";
import { interpolate, random, Easing } from "remotion";

// Smooth in/out helper with clamped extrapolation.
export const ease = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing: (n: number) => number = Easing.bezier(0.22, 1, 0.36, 1),
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Deterministic handheld camera shake (no Math.random — Remotion's seeded random).
export const handheld = (frame: number, seed: string, amp = 1) => {
  const t = frame / 12;
  const r = (k: string) => random(seed + k);
  const x =
    (Math.sin(t * 1.3 + r("x") * 6) + Math.sin(t * 0.7 + r("x2") * 6) * 0.5) *
    amp;
  const y =
    (Math.cos(t * 1.1 + r("y") * 6) + Math.sin(t * 0.5 + r("y2") * 6) * 0.5) *
    amp;
  const rot =
    (Math.sin(t * 0.6 + r("r") * 6) + Math.cos(t * 0.9 + r("r2") * 6) * 0.4) *
    amp *
    0.12;
  return { x, y, rot };
};

// A motion-blur "trail": stacks N ghost copies offset along a travel vector.
export const Trail: React.FC<{
  dx: number;
  dy?: number;
  count?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ dx, dy = 0, count = 5, opacity = 0.5, children }) => {
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2)
    return <>{children}</>;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const f = (i + 1) / (count + 1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              transform: `translate(${-dx * f}px, ${-dy * f}px)`,
              opacity: (opacity * (1 - f)) / 1.2,
              filter: "blur(2px)",
            }}
          >
            {children}
          </div>
        );
      })}
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </>
  );
};

// Tabular numeral string with fixed decimals.
export const money = (n: number) => n.toFixed(2);
