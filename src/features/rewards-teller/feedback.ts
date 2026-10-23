/**
 * What a teller feels and hears when the counter answers: a buzz where the
 * device has a motor (always), and a short tone when this device turned sound
 * on (off by default: a café has music on). Both fail silently.
 */
import { loadSound } from "./session";

let audio: AudioContext | null = null;

function tone(kind: "ok" | "fail"): void {
  try {
    audio ??= new AudioContext();
    const t0 = audio.currentTime;
    // Rising two notes for done, one low note for refused.
    const notes = kind === "ok" ? [660, 990] : [196];
    notes.forEach((f, i) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const start = t0 + i * 0.09;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.18, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, start + (kind === "ok" ? 0.16 : 0.32));
      o.connect(g).connect(audio!.destination);
      o.start(start);
      o.stop(start + 0.35);
    });
  } catch {
    /* no Web Audio */
  }
}

export function feedback(kind: "ok" | "fail"): void {
  try {
    navigator.vibrate?.(kind === "ok" ? 40 : [70, 50, 70]);
  } catch {
    /* no motor, or not allowed */
  }
  if (loadSound()) tone(kind);
}
