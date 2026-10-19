/**
 * Reading a QR code off the camera: platform I/O, so it is TypeScript, not
 * the shared Rust. What the decoded text MEANS is the shared rule
 * (`classifyScan`).
 *
 * The browser's own `BarcodeDetector` where it exists (Chrome on Android);
 * jsQR on a canvas frame everywhere else (iOS Safari has no BarcodeDetector).
 * jsQR runs on the main thread: no worker (the public CSP has no `blob:`
 * workers), no eval, no network.
 */
import jsQR from "jsqr";

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type DetectorCtor = {
  new (opts: { formats: string[] }): Detector;
  getSupportedFormats?: () => Promise<string[]>;
};

/** Frames wider than this are scaled down first: enough for a card held up to a tablet. */
const MAX_WIDTH = 640;

export type Decode = (video: HTMLVideoElement) => Promise<string | null>;

export async function makeDecoder(): Promise<Decode> {
  const Native = (globalThis as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (Native) {
    try {
      const formats = (await Native.getSupportedFormats?.()) ?? ["qr_code"];
      if (formats.includes("qr_code")) {
        const detector = new Native({ formats: ["qr_code"] });
        return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
      }
    } catch {
      /* fall through to jsQR */
    }
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth) return null;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}
