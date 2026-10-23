/**
 * A teller's sign-in: their PIN, against the branch the owner set this device
 * up for. No registered device is needed (the server takes the branch); the
 * per-browser id only feeds the wrong-PIN delay.
 *
 * A phone-sized keypad that also takes a keyboard's digits, Backspace and
 * Enter. Six digits (every new PIN) sign in on their own; a shorter, older PIN
 * signs in with the Go key. A wrong PIN shakes the dots and buzzes.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { Delete, MapPin, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { login } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useShake } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { CounterConfirm } from "./counter-confirm";
import { feedback } from "./feedback";
import { type Session, type Setup, deviceId } from "./session";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const PIN_MAX = 6;
const PIN_MIN = 4;

const keyClass =
  "h-16 rounded-2xl border bg-card font-mono text-[28px] font-medium shadow-xs hover:bg-accent sm:h-[4.5rem]";

export function PinScreen({
  setup,
  expired,
  onSignedIn,
  onReset,
}: {
  setup: Setup;
  /** The last session ended on its own (the server's 12 h, or signed out elsewhere). */
  expired?: boolean;
  onSignedIn: (s: Session) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrong, setWrong] = useState(0);
  const [askReset, setAskReset] = useState(false);
  const dots = useRef<HTMLDivElement>(null);
  useShake(dots, wrong);

  const submit = async (value: string) => {
    if (value.length < PIN_MIN || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await login(
        { pin: value, branch_id: setup.branchId },
        { headers: { "X-Madar-Device-Id": deviceId() } },
      );
      onSignedIn({ token: r.token, name: r.user.name });
    } catch (e) {
      // A 401 here is the PIN, not an ended session (the generic sentence for it).
      setError(
        e instanceof AxiosError && e.response?.status === 401
          ? t("rewardsTeller.pinWrong", "Wrong PIN. Try again.")
          : getErrorMessage(e),
      );
      setPin("");
      setWrong((n) => n + 1);
      feedback("fail");
    } finally {
      setBusy(false);
    }
  };

  const press = (d: string) => {
    if (busy) return;
    setError(null);
    const next = pin.length < PIN_MAX ? pin + d : pin;
    setPin(next);
    if (next.length === PIN_MAX && next !== pin) void submit(next);
  };
  const back = () => setPin((p) => p.slice(0, -1));

  // A keyboard (a tablet's, or a desktop's) types the PIN too.
  const keys = useRef({ press, back, submit: () => void submit(pin) });
  useEffect(() => {
    keys.current = { press, back, submit: () => void submit(pin) };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof Element && e.target.closest("input, [role=alertdialog]"))) return;
      // Arabic-Indic digits from an Arabic keyboard count as the same digit.
      const d = "٠١٢٣٤٥٦٧٨٩".indexOf(e.key);
      if (/^[0-9]$/.test(e.key) || d >= 0) keys.current.press(d >= 0 ? String(d) : e.key);
      else if (e.key === "Backspace") keys.current.back();
      else if (e.key === "Enter") keys.current.submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col items-center text-center" aria-labelledby="pin-title">
      <h1 id="pin-title" className="text-2xl font-semibold">
        {t("rewardsTeller.pinTitle", "Enter your PIN")}
      </h1>
      <p className="mt-1 inline-flex items-center gap-1.5 text-base text-muted-foreground">
        <MapPin className="size-4" aria-hidden />
        {setup.branchName}
      </p>

      <div ref={dots} className="mt-7 flex justify-center gap-3" dir="ltr" aria-hidden>
        {Array.from({ length: PIN_MAX }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-4 rounded-full transition-colors",
              i < pin.length ? "bg-foreground" : "bg-transparent ring-2 ring-inset ring-muted-foreground/45",
              error && "ring-destructive",
            )}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {t("rewardsTeller.pinDigits", "{{count}} digits entered", { count: pin.length })}
      </p>
      <div className="mt-4 min-h-12" aria-live="assertive">
        {error ? (
          <p role="alert" className="text-base font-medium text-[color-mix(in_oklab,var(--color-destructive)_55%,var(--color-foreground))]">
            {error}
          </p>
        ) : expired ? (
          <p role="status" className="text-base text-muted-foreground">
            {t("rewardsTeller.expired", "Signed out. Enter your PIN again.")}
          </p>
        ) : null}
      </div>

      <div className="mt-2 grid w-full grid-cols-3 gap-3" dir="ltr">
        {KEYS.map((k) => (
          <Button key={k} type="button" variant="ghost" className={keyClass} disabled={busy} onClick={() => press(k)}>
            {k}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-16 rounded-2xl sm:h-[4.5rem]"
          aria-label={t("rewardsTeller.pinDelete", "Delete a digit")}
          disabled={busy || pin.length === 0}
          onClick={back}
        >
          <Delete className="size-7" aria-hidden />
        </Button>
        <Button type="button" variant="ghost" className={keyClass} disabled={busy} onClick={() => press("0")}>
          0
        </Button>
        <Button
          type="button"
          className="h-16 rounded-2xl text-xl font-semibold sm:h-[4.5rem]"
          disabled={pin.length < PIN_MIN}
          loading={busy}
          onClick={() => void submit(pin)}
        >
          {t("rewardsTeller.pinGo", "Go")}
        </Button>
      </div>

      <Button type="button" variant="link" className="mt-6 h-11 text-sm text-muted-foreground" onClick={() => setAskReset(true)}>
        {t("rewardsTeller.setupAgain", "Set this device up again")}
      </Button>
      <CounterConfirm
        ask={
          askReset
            ? {
                figure: <RotateCcw className="mx-auto size-14" strokeWidth={1.5} />,
                title: t("rewardsTeller.resetTitle", "Set this device up again?"),
                body: t("rewardsTeller.resetBody", "The shop owner will need to sign in with their email and password before staff can use it."),
                yes: t("rewardsTeller.resetYes", "Set up again"),
              }
            : null
        }
        onAnswer={(yes) => {
          setAskReset(false);
          if (yes) onReset();
        }}
      />
    </section>
  );
}
