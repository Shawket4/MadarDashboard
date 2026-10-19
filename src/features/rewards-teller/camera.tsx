/**
 * The back camera, read for a QR code until one is found. Stops the stream
 * when it unmounts, so the tablet's camera light goes off with the view.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { makeDecoder } from "./camera-decoder";

/** How often a frame is decoded: often enough to feel instant, rarely enough to stay cool. */
const EVERY_MS = 200;

export function Camera({ onCode }: { onCode: (text: string) => void }) {
  const { t } = useTranslation();
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
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
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const decode = await makeDecoder();
        const tick = async () => {
          if (stopped || !video.current) return;
          const text = await decode(video.current).catch(() => null);
          if (text) latest.current(text);
          else timer = setTimeout(() => void tick(), EVERY_MS);
        };
        void tick();
      } catch {
        if (!stopped) setFailed(true);
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  if (failed) {
    return (
      <p role="alert" className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
        {t("rewardsTeller.cameraFailed", "The camera isn't available. Scan with a card reader, or type the phone number.")}
      </p>
    );
  }
  return (
    <video
      ref={video}
      muted
      playsInline
      aria-label={t("rewardsTeller.cameraLabel", "Camera: hold the card's QR code up to it")}
      className="aspect-square w-full max-w-sm rounded-2xl bg-black object-cover"
    />
  );
}
