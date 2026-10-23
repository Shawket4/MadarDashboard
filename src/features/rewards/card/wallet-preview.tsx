/**
 * The card as each wallet lays it out. A pass is not a picture: the OS draws
 * the fields in its own font, the barcode and the logo's place; we draw only
 * the strip (Apple) or the hero (Google). So the mock writes the fields in the
 * system font and shows our SVG where the wallet puts our image. Arabic is
 * the `ar.lproj` card, mirrored as the phone shows it.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QrCode } from "lucide-react";

import { ErrorState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { previewLoyaltyCardDesign } from "@/data/api/generated/api";
import type { CardDesign, FieldSource } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import type { CardRules, CardState, Store } from "@/lib/rules/card";

import { luminance } from "./design-state";
import type { TrackInfo } from "./panels";
import { StripSvg } from "@/components/loyalty-card/strip-svg";

interface MockProps {
  rules: CardRules;
  design: CardDesign;
  state: CardState;
  tracks: TrackInfo[];
  programme: string;
  logoUrl?: string | null;
  photoUrl?: string | null;
}

/** A field's label and value as the wallet would print them for the sample balances. */
function useFieldText(rules: CardRules, state: CardState, tracks: TrackInfo[]) {
  const { i18n } = useTranslation();
  const tp = i18n.getFixedT(state.arabic ? "ar" : "en");
  return (f: FieldSource): { label: string; value: string } | null => {
    if (f.type === "member") return { label: tp("rewards.card.labelMember", "Member"), value: tp("rewards.card.sampleMember", "Sara") };
    const tr = tracks.find((x) => x.position === f.track);
    const balance = state.tracks.find((x) => x.position === f.track)?.balance ?? 0;
    const size = tr?.size ?? 1;
    const name = tr?.name ?? "";
    const step = rules.card_stepper(balance, size);
    if (f.type === "balance") return { label: name, value: String(balance) };
    if (f.type === "progress") return { label: name, value: step.progress };
    // No row while nothing is earned, as on the pass (wallet::design).
    if (!step.earned) return null;
    return { label: tp("rewards.card.labelRewards", { defaultValue: "{{name}} · reward ready", name }), value: step.earned };
  };
}

const Qr = () => (
  <div className="mx-auto grid size-24 place-items-center rounded-lg bg-white text-black" aria-hidden>
    <QrCode className="size-16" strokeWidth={1.25} />
  </div>
);

function Logo({ url, programme, round }: { url?: string | null; programme: string; round?: boolean }) {
  return url ? (
    <img src={url} alt="" className={round ? "size-9 rounded-full object-cover" : "h-8 max-w-28 object-contain"} />
  ) : (
    <span className="truncate text-sm font-semibold">{programme}</span>
  );
}

export function AppleMock({ rules, design, state, tracks, programme, logoUrl, photoUrl }: MockProps) {
  const { t } = useTranslation();
  const text = useFieldText(rules, state, tracks);
  const c = design.colours;
  const header = design.apple.header ?? [];
  const below = [...(design.apple.secondary ?? []), ...(design.apple.auxiliary ?? [])];
  const field = (f: FieldSource, i: number, big = false) => {
    const x = text(f);
    if (!x) return null;
    const { label, value } = x;
    return (
      <div key={i} className="min-w-0">
        <p className="truncate text-[10px] font-semibold tracking-wide uppercase" style={{ color: c.label }}>
          {label}
        </p>
        <p className={big ? "truncate text-3xl leading-tight" : "truncate text-sm"} style={{ color: c.foreground }}>
          {value}
        </p>
      </div>
    );
  };
  return (
    <div
      dir={state.arabic ? "rtl" : "ltr"}
      data-testid="apple-mock"
      aria-label={t("rewards.card.appleMock", "Apple Wallet preview")}
      role="img"
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl font-sans shadow-sm ring-1 ring-black/10"
      style={{ background: c.background, color: c.foreground }}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <Logo url={logoUrl} programme={programme} />
        <div className="flex gap-3 text-end">{header.map((f, i) => field(f, i))}</div>
      </div>
      <div className="relative">
        <StripSvg rules={rules} design={design} state={state} store="apple" scale={2} photoUrl={photoUrl} logoUrl={logoUrl} primaryField={design.apple.primary != null} />
        {design.apple.primary ? <div className="absolute start-0 top-0 max-w-[66%] p-3">{field(design.apple.primary, 0, true)}</div> : null}
      </div>
      {below.length ? <div className="flex justify-between gap-3 px-3 pt-2.5">{below.map((f, i) => field(f, i))}</div> : null}
      <div className="p-4">
        <Qr />
      </div>
    </div>
  );
}

export function GoogleMock({ rules, design, state, tracks, programme, logoUrl, photoUrl }: MockProps) {
  const { t } = useTranslation();
  const text = useFieldText(rules, state, tracks);
  const bg = design.colours.background;
  // Google picks the text colour itself, light or dark for the background.
  const ink = (luminance(bg) ?? 0) > 0.4 ? "#202124" : "#FFFFFF";
  const slots = [design.google.points, design.google.secondary].filter((f): f is FieldSource => !!f);
  return (
    <div
      dir={state.arabic ? "rtl" : "ltr"}
      data-testid="google-mock"
      aria-label={t("rewards.card.googleMock", "Google Wallet preview")}
      role="img"
      className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl font-sans shadow-sm ring-1 ring-black/10"
      style={{ background: bg, color: ink }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <Logo url={logoUrl} programme={programme} round />
        {logoUrl ? <span className="truncate text-sm">{programme}</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {slots
          .map((f) => text(f))
          .filter((x): x is { label: string; value: string } => !!x)
          .map(({ label, value }, i) => {
          return (
            <div key={i} className="min-w-0">
              <p className="truncate text-xs opacity-80">{label}</p>
              <p className={i === 0 ? "truncate text-2xl" : "truncate text-base"}>{value}</p>
            </div>
          );
        })}
      </div>
      <div className="p-5">
        <Qr />
      </div>
      <StripSvg rules={rules} design={design} state={state} store="google" scale={1} photoUrl={photoUrl} logoUrl={logoUrl} />
    </div>
  );
}

/** The server's own PNG for this design, fetched ~600 ms after the last change, only for a valid design. */
export function ServerPreview({ design, store, state, valid }: { design: CardDesign; store: Store; state: CardState; valid: boolean }) {
  const { t } = useTranslation();
  const body = useMemo(
    () => JSON.stringify({ design, store, arabic: state.arabic, balances: state.tracks.map((x) => ({ position: x.position, balance: x.balance })) }),
    [design, store, state],
  );
  const [result, setResult] = useState<{ body: string; url?: string; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!valid) return;
    let url: string | undefined;
    let live = true;
    const timer = setTimeout(() => {
      previewLoyaltyCardDesign(JSON.parse(body)).then(
        (blob) => {
          if (!live) return;
          url = URL.createObjectURL(blob);
          setResult({ body, url });
        },
        (e: unknown) => live && setResult({ body, error: getErrorMessage(e) }),
      );
    }, 600);
    return () => {
      live = false;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [body, valid, retry]);

  const current = result?.body === body ? result : null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("rewards.card.serverTitle", "As the wallet renders it")}</h3>
      <p className="text-xs text-muted-foreground">
        {t("rewards.card.serverHint", "The exact image the server sends to the wallet, drawn from this design.")}
      </p>
      {!valid ? (
        <p className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          {t("rewards.card.serverInvalid", "Fix the problems listed to see the server's image.")}
        </p>
      ) : current?.error ? (
        <ErrorState message={current.error} onRetry={() => setRetry((n) => n + 1)} />
      ) : current?.url ? (
        <img src={current.url} alt={t("rewards.card.serverAlt", "The card image from the server")} className="w-full rounded-xl border" />
      ) : (
        <Skeleton className="aspect-[375/144] w-full rounded-xl" />
      )}
    </div>
  );
}
