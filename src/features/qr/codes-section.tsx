/**
 * Every scannable code the shop has, on one page: the Links & QR codes page's
 * codes section.
 *
 * One `QrKind` list drives one generator. Every kind is always visible; the
 * ones that need a scope say so instead of disappearing. The links page and
 * the menu without prices have their codes here too — the same codes the
 * "QR code" buttons beside their addresses open — so every code lives in one
 * list under one set of output switches.
 *
 * Each code is LIVE (`useLiveQr`): it is fetched when asked for, and re-renders
 * whenever an output switch changes, so the switches above are previewed on
 * the codes themselves.
 *
 * Plans: the paid plan has every kind. A Free shop has the menu without
 * prices; the ordering, booking and table codes are shown locked, and nothing
 * behind the lock is fetched.
 */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  Check,
  Copy,
  Download,
  Link2,
  Printer,
  QrCode,
  RefreshCw,
  Store,
  UtensilsCrossed,
} from "lucide-react";

import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { Reveal, usePop } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { downloadUrl } from "@/lib/download";
import { SectionHeader } from "@/components/app/section-header";
import { PaidFeatureLock } from "@/components/app/paid-feature-lock";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  branchBookingQr,
  branchQr,
  orgBookingQr,
  orgLinksQr,
  orgQr,
  useGetLinksPage,
} from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import type { Feature } from "@/generated/plans";
import { useHasFeature } from "@/hooks/use-plan";

import { qrFileName, useLiveQr } from "./live";
import type { QrRenderParams, QrShape } from "./output";
import { QrOutputControls } from "./output-controls";
import { QrOutputPanel } from "./output-panel";
import { printCodes } from "./print";
import { missingLogo } from "./qr-dialog";
import { QrPreviewDialog } from "./qr-preview-dialog";
import { TableCodes } from "./table-codes";

// ── One generated code ───────────────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  usePop(ref, copied);
  const copy = () => {
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => toast.error(t("qr.copyFailed", "Could not copy the link")));
  };
  return (
    <Button ref={ref} variant="outline" size="sm" onClick={copy} aria-label={t("common.copy", "Copy")}>
      {copied ? <Check className="size-4 text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]" /> : <Copy className="size-4" />}
      {copied ? t("qr.copied", "Copied") : t("qr.copyLink", "Copy link")}
    </Button>
  );
}

/// A URL rendered so it can never widen its container.
///
/// `truncate` sets `white-space: nowrap`, which makes an element's MIN-CONTENT
/// width the entire string — and flex and grid items default to
/// `min-width: auto`, so they refuse to shrink below that. `break-anywhere`
/// lets the string break at any character, so its min-content width is one
/// character, whatever any ancestor does.
function UrlText({ url, className }: { url: string; className?: string }) {
  return <span className={cn("block font-mono [overflow-wrap:anywhere]", className)}>{url}</span>;
}

function QrResult({
  qr,
  title,
  shape,
  busy,
  onPreview,
}: {
  qr: QrResponse;
  title: string;
  shape: QrShape;
  busy: boolean;
  onPreview: () => void;
}) {
  const { t } = useTranslation();
  return (
    // `min-w-0` so this card may shrink inside its grid track, and
    // `overflow-hidden` so nothing inside can paint past the rounded border.
    <div className="flex min-w-0 flex-col items-center gap-3 overflow-hidden rounded-xl border bg-card p-4" data-testid="qr-result">
      {/* `aspect-square` is load-bearing, not decorative: a QR stretched on
          one axis stops scanning. */}
      <button
        type="button"
        onClick={onPreview}
        className="w-full max-w-52 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        aria-label={t("qr.enlarge", "Enlarge QR code")}
      >
        {/* White quiet-zone wrapper so the raster reads cleanly on any theme */}
        <span className={cn("block rounded bg-white p-1 transition-opacity duration-fast", busy && "opacity-50")}>
          <img
            src={qr.qr_data_url}
            alt={t("qr.imageAlt", "QR code for {{title}}", { title })}
            data-shape={shape}
            className="aspect-square w-full cursor-zoom-in object-contain"
          />
        </span>
      </button>

      <a
        href={qr.short_url}
        target="_blank"
        rel="noreferrer"
        className="flex w-full min-w-0 items-start gap-2 rounded-lg bg-muted px-2 py-1.5 text-xs hover:underline"
      >
        <Link2 className="mt-0.5 size-3 shrink-0 text-muted-foreground" aria-hidden />
        <UrlText url={qr.short_url} className="min-w-0 flex-1" />
      </a>

      {/* Where the short link actually lands. Worth showing: a misconfigured
          PUBLIC_*_BASE_URL is invisible until someone scans a printed card. */}
      <UrlText url={qr.long_url} className="w-full text-center text-[11px] text-muted-foreground" />

      <div className="flex w-full flex-col gap-2 [&>*]:flex-1">
        <CopyLinkButton url={qr.short_url} />
        <div className="flex gap-2 [&>*]:flex-1">
          <Button size="sm" variant="outline" onClick={() => void printCodes([{ src: qr.qr_data_url }], shape)}>
            <Printer className="size-4" />
            {t("qr.print", "Print")}
          </Button>
          <Button size="sm" onClick={() => downloadUrl(qr.qr_data_url, qrFileName(qr, shape === "plain"))}>
            <Download className="size-4" />
            {t("common.download", "Download")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── The catalogue ────────────────────────────────────────────────────────────

type InMallValues = { place_name: string; floor: string; unit_number: string };

interface QrKind {
  id: string;
  /** `shop`: any scope; `org`: needs All branches; `branch`: needs one branch. */
  scope: "shop" | "org" | "branch";
  /** The plan feature this code needs (the server refuses it without). */
  feature?: Feature;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Only the in-mall kind collects fields before it can generate. */
  form?: true;
  run: (
    ids: { orgId: string; branchId: string },
    params: QrRenderParams,
    inMall: InMallValues | null,
  ) => Promise<QrResponse>;
}

function KindCard({
  kind,
  orgId,
  branchId,
  isAllBranches,
}: {
  kind: QrKind;
  orgId: string;
  branchId: string | null;
  isAllBranches: boolean;
}) {
  const { t } = useTranslation();
  const available = kind.scope === "shop" ? true : kind.scope === "org" ? isAllBranches : Boolean(branchId);
  const unavailableHint =
    kind.scope === "org"
      ? t("qr.needsAllBranches", "Switch the scope bar to All branches to make this code.")
      : t("qr.needsBranch", "Select a branch in the scope bar to make this code.");

  // A code belongs to the scope it was made for: switching branches must not
  // leave the previous branch's code on screen, nor mint the new one unasked.
  const scopeKey = kind.scope === "branch" ? (branchId ?? "") : orgId;
  const [requestedFor, setRequestedFor] = useState<string | null>(null);
  const [inMall, setInMall] = useState<InMallValues | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const requested = available && requestedFor === scopeKey;

  const live = useLiveQr({
    id: kind.id,
    scope: [orgId, scopeKey, inMall],
    fetch: (p) => kind.run({ orgId, branchId: branchId ?? "" }, p, inMall),
    enabled: requested,
  });
  const result = requested ? live.data : undefined;
  const error = requested && live.isError ? getErrorMessage(live.error) : null;
  const busy = requested && live.isFetching;

  const generate = () => {
    if (requestedFor === scopeKey) void live.refetch();
    else setRequestedFor(scopeKey);
  };

  // Built inside the component so validation messages can use t().
  const inMallSchema = z.object({
    place_name: z.string().min(1, t("common.requiredField")).max(80),
    floor: z.string().min(1, t("common.requiredField")).max(40),
    unit_number: z.string().min(1, t("common.requiredField")).max(40),
  });
  const inMallForm = useForm<z.input<typeof inMallSchema>, unknown, InMallValues>({
    resolver: zodResolver(inMallSchema),
    defaultValues: { place_name: "", floor: "", unit_number: "" },
  });

  const Icon = kind.icon;
  const button = (type: "button" | "submit") => (
    <Button
      type={type}
      onClick={type === "button" ? generate : undefined}
      disabled={!available || (busy && !result)}
      className="self-start"
    >
      {busy && !result ? <Spinner icon={RefreshCw} /> : <QrCode className="size-4" />}
      {t("qr.generate", "Generate QR")}
    </Button>
  );

  return (
    <Card className={available ? undefined : "opacity-70"} data-testid={`qr-kind-${kind.id}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4" />
          {kind.title}
        </CardTitle>
        <CardDescription>{kind.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-3">
          {!available && <p className="text-sm text-muted-foreground">{unavailableHint}</p>}

          {kind.form ? (
            <Form {...inMallForm}>
              <form
                onSubmit={inMallForm.handleSubmit((v) => {
                  setInMall({ ...v });
                  setRequestedFor(scopeKey);
                  if (requested && JSON.stringify(v) === JSON.stringify(inMall)) void live.refetch();
                })}
                className="flex flex-col gap-3"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["place_name", t("qr.inMall.placeName", "Shop name")],
                      ["floor", t("qr.inMall.floor", "Floor")],
                      ["unit_number", t("qr.inMall.unitNumber", "Unit number")],
                    ] as const
                  ).map(([name, label]) => (
                    <FormField
                      key={name}
                      control={inMallForm.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!available} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                {button("submit")}
              </form>
            </Form>
          ) : (
            button("button")
          )}

          {error && (
            <Reveal asChild>
              {/* Inline, not a toast: "bookings are switched off for this
                  branch" is a 409 the operator has to go and fix, and it
                  belongs beside the button that produced it. */}
              <p role="status" className="text-sm text-destructive">
                {error}
              </p>
            </Reveal>
          )}
        </div>

        {/* The code arrives beside the button that made it. */}
        {result && (
          <Reveal className="w-full lg:w-64">
            <QrResult
              qr={result}
              title={kind.title}
              shape={live.shape}
              busy={busy}
              onPreview={() => setPreviewOpen(true)}
            />
          </Reveal>
        )}
      </CardContent>

      <QrPreviewDialog
        open={previewOpen && !!result}
        onOpenChange={(o) => !o && setPreviewOpen(false)}
        qr={result ?? null}
        title={kind.title}
        busy={busy}
        shape={live.shape}
        controls={<QrOutputControls noLogo={missingLogo(live)} />}
      />
    </Card>
  );
}

/** What a Free shop sees in place of the paid codes: their names, nothing behind them. */
function LockedKinds({ kinds }: { kinds: QrKind[] }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-2" data-testid="qr-locked-kinds">
      {kinds.map((k) => (
        <div key={k.id} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium">
          <k.icon className="size-4" aria-hidden />
          {k.title}
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium">
        <QrCode className="size-4" aria-hidden />
        {t("qr.tables.title", "Table codes")}
      </div>
    </div>
  );
}

export function QrCodesSection({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const { branchId, isAllBranches } = useScope();
  const has = {
    branding: useHasFeature("branding"),
    online: useHasFeature("online"),
    bookings: useHasFeature("bookings"),
  } as const;

  const kinds: QrKind[] = [
    {
      id: "org_links",
      scope: "shop",
      feature: "branding",
      icon: Link2,
      title: t("qr.links.title", "Links page"),
      description: t(
        "qr.links.description",
        "Your shop's own address, where everything else is one tap away. For your bio, the counter and your receipts.",
      ),
      run: ({ orgId: o }, p) => orgLinksQr(o, p, {}),
    },
    {
      id: "org_menu_display",
      scope: "shop",
      icon: BookOpen,
      title: t("qr.menuDisplay.title", "Menu (no prices)"),
      description: t(
        "qr.menuDisplay.description",
        "Your menu with no prices, at its own address: for a screen, a table card or your bio.",
      ),
      run: ({ orgId: o }, p) => orgLinksQr(o, { ...p, target: "menu_display" }, {}),
    },
    {
      id: "org_order",
      scope: "org",
      feature: "online",
      icon: Building2,
      title: t("qr.org.title", "All-branches ordering"),
      description: t(
        "qr.org.description",
        "One code that lets customers browse and pick any of your branches, then place an order.",
      ),
      run: ({ orgId: o }, p) => orgQr(o, p),
    },
    {
      id: "org_booking",
      scope: "org",
      feature: "bookings",
      icon: CalendarCheck,
      title: t("qr.orgBooking.title", "All-branches bookings"),
      description: t(
        "qr.orgBooking.description",
        "Guests pick a branch, then a time. Needs at least one branch with bookings switched on.",
      ),
      run: ({ orgId: o }, p) => orgBookingQr(o, p),
    },
    {
      id: "branch_order",
      scope: "branch",
      feature: "online",
      icon: Store,
      title: t("qr.standard.title", "Branch menu"),
      description: t(
        "qr.standard.description",
        "Customers scan this to open this branch's ordering page. Works for in-mall and outside delivery.",
      ),
      run: ({ branchId: b }, p) => branchQr(b, p),
    },
    {
      id: "branch_booking",
      scope: "branch",
      feature: "bookings",
      icon: CalendarCheck,
      title: t("qr.branchBooking.title", "Branch bookings"),
      description: t(
        "qr.branchBooking.description",
        "Straight to this branch's free times — for the table tent or the door. Bookings must be switched on for the branch.",
      ),
      run: ({ branchId: b }, p) => branchBookingQr(b, p),
    },
    {
      id: "branch_order_in_mall",
      scope: "branch",
      feature: "online",
      icon: UtensilsCrossed,
      form: true,
      title: t("qr.inMall.title", "In-mall delivery"),
      description: t(
        "qr.inMall.description",
        "A code per shop or unit inside the mall — the location is pre-filled for the customer.",
      ),
      run: ({ branchId: b }, p, inMall) => branchQr(b, { ...p, ...(inMall ?? {}) }),
    },
  ];

  // The links page's code exists only where the page has an address: the
  // shop's own host, which takes custom branding and a slug on top of the plan
  // (the server answers 409 otherwise). The links editor offered its code on
  // the same condition, and so does this list.
  const links = useGetLinksPage(orgId, { query: { enabled: !!orgId && has.branding } });
  const hasAddress = !!links.data?.public_url;
  const held = (k: QrKind) =>
    (!k.feature || has[k.feature as keyof typeof has]) && (k.id !== "org_links" || hasAddress);
  const locked = kinds.filter((k) => !held(k) && k.feature !== "branding");
  const card = (k: QrKind) => (
    <KindCard key={k.id} kind={k} orgId={orgId} branchId={branchId ?? null} isAllBranches={isAllBranches} />
  );
  const shopKinds = kinds.filter((k) => k.scope !== "branch" && held(k));
  const branchKinds = kinds.filter((k) => k.scope === "branch" && held(k));

  return (
    <div className="space-y-6">
      <QrOutputPanel orgId={orgId} />

      <section className="flex flex-col gap-3">
        <SectionHeader as="h3" title={t("qr.section.org", "For the whole organization")} />
        <div className="grid gap-4">{shopKinds.map(card)}</div>
      </section>

      {branchKinds.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeader as="h3" title={t("qr.section.branch", "For one branch")} />
          <div className="grid gap-4">{branchKinds.map(card)}</div>
        </section>
      ) : null}

      {/* Its own section: these are not ONE code but one per table, and a room
          full of them is printed together rather than made one at a time. */}
      {has.online ? (
        <section className="flex flex-col gap-3">
          <SectionHeader as="h3" title={t("qr.section.tables", "For each table")} />
          <TableCodes branchId={branchId ?? null} />
        </section>
      ) : null}

      {locked.length > 0 ? (
        <PaidFeatureLock
          feature="online"
          title={t("qr.locked.title", "Ordering, booking and table codes")}
          preview={<LockedKinds kinds={locked} />}
        />
      ) : null}
    </div>
  );
}
