/**
 * A teller's sign-in: their PIN, against the branch the owner set this device
 * up for. No registered device is needed (the server takes the branch); the
 * per-browser id only feeds the wrong-PIN delay.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Delete } from "lucide-react";

import { Button } from "@/components/ui/button";
import { login } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";

import { type Session, type Setup, deviceId } from "./session";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinScreen({
  setup,
  onSignedIn,
  onReset,
}: {
  setup: Setup;
  onSignedIn: (s: Session) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const press = (d: string) => setPin((p) => (p.length < 6 ? p + d : p));
  const submit = async () => {
    if (pin.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const r = await login(
        { pin, branch_id: setup.branchId },
        { headers: { "X-Madar-Device-Id": deviceId() } },
      );
      onSignedIn({ token: r.token, name: r.user.name });
    } catch (e) {
      setError(getErrorMessage(e));
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-xs space-y-4 text-center">
      <h2 className="text-lg font-semibold">{t("rewardsTeller.pinTitle", "Enter your PIN")}</h2>
      <p className="text-sm text-muted-foreground">{setup.branchName}</p>
      <div aria-live="polite" className="flex justify-center gap-2" dir="ltr">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`size-3 rounded-full ${i < pin.length ? "bg-foreground" : "bg-muted"}`} />
        ))}
        <span className="sr-only">{t("rewardsTeller.pinDigits", "{{count}} digits entered", { count: pin.length })}</span>
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="grid grid-cols-3 gap-2" dir="ltr">
        {KEYS.map((k) => (
          <Button key={k} type="button" variant="outline" className="h-14 text-xl font-mono" onClick={() => press(k)}>
            {k}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-14"
          aria-label={t("rewardsTeller.pinDelete", "Delete a digit")}
          onClick={() => setPin((p) => p.slice(0, -1))}
        >
          <Delete className="size-5" />
        </Button>
        <Button type="button" variant="outline" className="h-14 text-xl font-mono" onClick={() => press("0")}>
          0
        </Button>
        <Button type="button" className="h-14" disabled={pin.length < 4} loading={busy} onClick={() => void submit()}>
          {t("rewardsTeller.pinGo", "Go")}
        </Button>
      </div>
      <Button type="button" variant="link" className="text-xs" onClick={onReset}>
        {t("rewardsTeller.setupAgain", "Set this device up again")}
      </Button>
    </section>
  );
}
