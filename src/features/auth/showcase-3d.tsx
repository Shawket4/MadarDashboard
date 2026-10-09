import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { createShowcase, type ShowcaseKey } from "@shared/showcase/engine";

/**
 * The sign-in panel's 3D showcase (lazy-loaded; see `brand-showcase.tsx`): the
 * shared engine (`shared/showcase`, also used by the marketing site) playing by
 * itself, with a caption under each object. This component only hosts it: it
 * makes the canvas, starts the engine, shows the captions and disposes of it all.
 */

const CAPTIONS: Record<ShowcaseKey, { title: string; line: string }> = {
  till: { title: "The till", line: "Every pay-in and pay-out, with its reason and its person." },
  dawam: { title: "Dawam", line: "Staff clock in on their phones; the hours become payslips." },
  ordering: { title: "Your own ordering page", line: "Guests order from your menu, in Arabic or English." },
  receipt: { title: "One ledger", line: "Counter sales and deliveries close into the same books." },
  kitchen: { title: "The kitchen screen", line: "Each station gets its own screen, live." },
  rewards: { title: "Rewards", line: "Points or stamps, in Apple Wallet and Google Wallet." },
};

export type Showcase3DProps = {
  /** Shaders compiled and the first frame drawn: the caller fades it in. */
  onReady: () => void;
  /** No GPU context, or it was lost: the caller shows the 2D orbit instead. */
  onFail: () => void;
};

export default function Showcase3D({ onReady, onFail }: Showcase3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const [caption, setCaption] = useState<ShowcaseKey | null>(null);
  // The latest callbacks, without rebuilding the scene when they change.
  const callbacks = useRef({ onReady, onFail });
  useEffect(() => {
    callbacks.current = { onReady, onFail };
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // A fresh canvas per mount: a GPU context that was let go can't be had again
    // from the same element (StrictMode mounts twice in development).
    const canvas = document.createElement("canvas");
    canvas.className = "block size-full";
    el.appendChild(canvas);
    let live = true;
    let showcase: ReturnType<typeof createShowcase>;
    try {
      showcase = createShowcase(canvas, { onLost: () => live && callbacks.current.onFail() });
    } catch {
      canvas.remove();
      callbacks.current.onFail();
      return;
    }
    showcase.play(setCaption);
    showcase.setActive(true);
    showcase.ready.then(() => live && callbacks.current.onReady());
    return () => {
      live = false;
      showcase.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div className="flex size-full flex-col">
      <div ref={host} className="relative min-h-0 flex-1" />
      <Caption showing={caption} />
    </div>
  );
}

function Caption({ showing }: { showing: ShowcaseKey | null }) {
  const { t } = useTranslation();
  return (
    <div className="relative h-16 shrink-0">
      <AnimatePresence mode="wait">
        {showing && (
          <motion.div
            key={showing}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-0 text-center"
          >
            <p className="text-sm font-semibold">{t(`auth.showcase.${showing}.title`, CAPTIONS[showing].title)}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-sidebar-muted">
              {t(`auth.showcase.${showing}.line`, CAPTIONS[showing].line)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
