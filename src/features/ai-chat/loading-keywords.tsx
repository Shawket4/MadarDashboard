import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * A rotating status line shown while an answer computes — cycles through the
 * real steps of the pipeline (read → match a report → run → format), so the
 * wait doubles as a plain-language explanation of what the algorithm is doing.
 */
export function LoadingKeywords() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const words = t("aiChat.loading", { returnObjects: true });
  const list = Array.isArray(words) && words.length ? (words as string[]) : ["Working…"];
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % list.length), 1500);
    return () => clearInterval(id);
  }, [list.length]);

  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((d) => (
          <motion.span
            key={d}
            className="size-1.5 rounded-full bg-primary/70"
            animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18, ease: "easeInOut" }}
          />
        ))}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={list[i]}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {list[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
