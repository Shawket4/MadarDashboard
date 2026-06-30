import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDemoSession, resetDemo } from "@/data/api/demo/enable";

/* Slim, always-on banner for the public demo. Shows that data is temporary and
 * when the sandbox resets, with a one-click "Reset" to start fresh. Renders
 * nothing outside a demo build, so it's safe to mount unconditionally. */

const isDemoBuild = (() => {
  const f = (import.meta.env as Record<string, string | undefined>).VITE_DEMO;
  return f === "1" || f === "true";
})();

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "0m";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function DemoBanner() {
  const { t } = useTranslation();
  const [session] = useState(getDemoSession);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [session]);

  if (!isDemoBuild || !session) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-brand/20 bg-brand/5 px-4 py-2 text-sm">
      <span className="inline-flex items-center gap-2 font-medium text-foreground">
        <FlaskConical className="size-4 text-brand" aria-hidden="true" />
        {t("demo.title", "You're exploring a live demo")}
      </span>
      <span className="text-muted-foreground">
        {t("demo.body", { time: timeLeft(session.expires_at), defaultValue: `Changes are temporary and reset in ${timeLeft(session.expires_at)}.` })}
      </span>
      <Button size="xs" variant="outline" className="ms-auto" onClick={resetDemo}>
        <RotateCcw className="size-3.5" /> {t("demo.reset", "Reset")}
      </Button>
    </div>
  );
}
