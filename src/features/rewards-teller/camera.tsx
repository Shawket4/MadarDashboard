/**
 * The back camera, read for a QR code until one is found. Stops the stream
 * when it unmounts, so the tablet's camera light goes off with the view.
 *
 * Drawn as a viewfinder: the video fills the panel and four corner marks show
 * where the card goes. A refused or missing camera says so in the same panel,
 * with the two other ways to find a member and a retry (after the teller
 * allows it in the browser's settings).
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CameraOff, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { makeDecoder } from "./camera-decoder";

/** How often a frame is decoded: often enough to feel instant, rarely enough to stay cool. */
const EVERY_MS = 200;

type CameraState = "starting" | "live" | "denied" | "missing";

export function Camera({ onCode }: { onCode: (text: string) => void }) {
  const { t } = useTranslation();
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(onCode);
  useEffect(() => {
    latest.current = onCode;
  }, [onCode]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new DOMException("no camera", "NotFoundError");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        setState("live");
        const decode = await makeDecoder();
        const tick = async () => {
          if (stopped || !video.current) return;
          const text = await decode(video.current).catch(() => null);
          if (text) latest.current(text);
          else timer = setTimeout(() => void tick(), EVERY_MS);
        };
        void tick();
      } catch (e) {
        if (stopped) return;
        const name = e instanceof DOMException ? e.name : "";
        setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "missing");
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [attempt]);

  if (state === "denied" || state === "missing") {
    return (
      <div role="alert" className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-white/10">
          <CameraOff className="size-7" aria-hidden />
        </span>
        <p className="text-lg font-semibold">
          {state === "denied"
            ? t("rewardsTeller.cameraBlocked", "The camera is blocked")
            : t("rewardsTeller.cameraMissing", "No camera here")}
        </p>
        <p className="max-w-xs text-sm text-pretty opacity-80">
          {state === "denied"
            ? t("rewardsTeller.cameraBlockedHint", "Allow the camera in the browser's settings, or scan with a card reader or type the phone number.")
            : t("rewardsTeller.cameraFailed", "The camera isn't available. Scan with a card reader, or type the phone number.")}
        </p>
        <Button
          variant="outline"
          className="mt-1 h-12 border-white/25 bg-transparent px-5 text-base text-inherit hover:bg-white/10 hover:text-inherit"
          onClick={() => {
            setState("starting");
            setAttempt((n) => n + 1);
          }}
        >
          <RotateCcw className="size-5" aria-hidden />
          {t("rewardsTeller.tryAgain", "Try again")}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative size-full">
      <video
        ref={video}
        muted
        playsInline
        aria-label={t("rewardsTeller.cameraLabel", "Camera: hold the card's QR code up to it")}
        className="size-full object-cover"
      />
      {/* The frame: four corners around the middle, where the code reads best. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative aspect-square w-[62%] max-w-72">
          <span className="absolute start-0 top-0 size-9 rounded-ss-2xl border-s-4 border-t-4 border-white" />
          <span className="absolute end-0 top-0 size-9 rounded-se-2xl border-e-4 border-t-4 border-white" />
          <span className="absolute bottom-0 start-0 size-9 rounded-es-2xl border-b-4 border-s-4 border-white" />
          <span className="absolute bottom-0 end-0 size-9 rounded-ee-2xl border-b-4 border-e-4 border-white" />
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-3 text-center text-sm font-medium text-white">
        {state === "live"
          ? t("rewardsTeller.cameraHint", "Hold the card's QR code inside the frame")
          : t("rewardsTeller.cameraStarting", "Starting the camera…")}
      </p>
    </div>
  );
}
