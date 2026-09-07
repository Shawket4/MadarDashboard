import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarCheck,
  Check,
  Copy,
  Download,
  Link2,
  QrCode,
  RefreshCw,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { downloadUrl } from "@/lib/download";
import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branchBookingQr, branchQr, orgBookingQr, orgQr } from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { QrPreviewDialog } from "./qr-preview-dialog";

/**
 * Every scannable code the product makes, on one page.
 *
 * It used to be three mutually exclusive layouts chosen by scope — an org card,
 * an empty state, or a two-tab branch view — each carrying its own copy of the
 * render options and its own `result`/`busy` state pair. You could not discover
 * that in-mall codes existed without first selecting a branch, and adding a
 * fifth kind meant a fourth duplicated triplet.
 *
 * Now one `QrKind` list drives one generator. Every kind is always visible;
 * the ones that need a branch say so instead of disappearing.
 */

// ── Render options ───────────────────────────────────────────────────────────

interface RenderOpts {
  card: boolean;
  dpi: number;
}

/** Applies to every code on the page — hence one bar at the top, not one per card. */
function RenderOptions({ opts, onChange }: { opts: RenderOpts; onChange: (o: RenderOpts) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <Switch
          id="card-toggle"
          checked={opts.card}
          onCheckedChange={(v) => onChange({ ...opts, card: v })}
        />
        <Label htmlFor="card-toggle" className="cursor-pointer text-sm">
          {t("qr.opts.brandedCard", "Branded card")}
        </Label>
      </div>
      {opts.card && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">{t("qr.opts.dpiLabel", "DPI")}</Label>
          <Select
            value={String(opts.dpi)}
            onValueChange={(v) => onChange({ ...opts, dpi: Number(v) })}
          >
            <SelectTrigger size="sm" className="w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="150">150</SelectItem>
              <SelectItem value="300">300</SelectItem>
              <SelectItem value="600">600</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {t("qr.opts.hint", "Applies to every code on this page.")}
      </p>
    </div>
  );
}

// ── One generated code ───────────────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
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
    <Button variant="outline" size="sm" onClick={copy} aria-label={t("common.copy", "Copy")}>
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {copied ? t("qr.copied", "Copied") : t("qr.copyLink", "Copy link")}
    </Button>
  );
}

/// A URL rendered so it can never widen its container.
///
/// This is the whole reason the QR cards overflowed on a phone. `truncate` sets
/// `white-space: nowrap`, which makes an element's MIN-CONTENT width the entire
/// string — and flex and grid items default to `min-width: auto`, so they refuse
/// to shrink below that. The card was then forced wider than the screen no
/// matter what width was put on the QR image itself.
///
/// `break-anywhere` lets the string break at any character, so its min-content
/// width is one character. That holds regardless of what any ancestor does,
/// which `min-w-0` sprinkled up the tree does not.
function UrlText({
  url,
  className,
  mono = true,
}: {
  url: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "block [overflow-wrap:anywhere]",
        mono && "font-mono",
        className,
      )}
    >
      {url}
    </span>
  );
}

function QrResult({
  qr,
  title,
  onPreview,
}: {
  qr: QrResponse;
  title: string;
  onPreview: () => void;
}) {
  const { t } = useTranslation();
  const isSvg = qr.qr_data_url.startsWith("data:image/svg");

  return (
    // `min-w-0` so this card may shrink inside its grid track, and
    // `overflow-hidden` so nothing inside can paint past the rounded border.
    <div className="flex min-w-0 flex-col items-center gap-3 overflow-hidden rounded-xl border bg-card p-4">
      {/* The QR scales with the card. `aspect-square` is load-bearing, not
          decorative: a QR stretched on one axis stops scanning. */}
      <button
        type="button"
        onClick={onPreview}
        className="w-full max-w-52 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        aria-label={t("qr.enlarge", "Enlarge QR code")}
      >
        {/* White quiet-zone wrapper so the raster reads cleanly on any theme */}
        <span className="block rounded bg-white p-1">
          <img
            src={qr.qr_data_url}
            alt={t("qr.imageAlt", "QR code for {{title}}", { title })}
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
        <Link2 className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
        <UrlText url={qr.short_url} className="min-w-0 flex-1" />
      </a>

      {/* Where the short link actually lands. Worth showing: a misconfigured
          PUBLIC_*_BASE_URL is invisible until someone scans a printed card. */}
      <UrlText
        url={qr.long_url}
        className="w-full text-center text-[11px] text-muted-foreground"
      />

      {/* Stacked on a phone: two buttons side by side leave neither readable. */}
      <div className="flex w-full flex-col gap-2 sm:flex-row [&>*]:flex-1">
        <CopyLinkButton url={qr.short_url} />
        <Button
          size="sm"
          onClick={() => downloadUrl(qr.qr_data_url, `qr-${qr.short_code}.${isSvg ? "svg" : "png"}`)}
        >
          <Download className="size-4" />
          {t("common.download", "Download")}
        </Button>
      </div>
    </div>
  );
}

// ── The catalogue ────────────────────────────────────────────────────────────

type InMallValues = { place_name: string; floor: string; unit_number: string };

interface QrKind {
  id: string;
  scope: "org" | "branch";
  icon: LucideIcon;
  title: string;
  description: string;
  /** Only the in-mall kind collects fields before it can generate. */
  form?: true;
  run: (ids: { orgId: string; branchId: string }, params: RenderOpts) => Promise<QrResponse>;
}

export function QrPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, isAllBranches } = useScope();

  const [renderOpts, setRenderOpts] = useState<RenderOpts>({ card: true, dpi: 600 });
  const [results, setResults] = useState<Record<string, QrResponse>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ qr: QrResponse; title: string } | null>(null);

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

  const kinds: QrKind[] = [
    {
      id: "org_order",
      scope: "org",
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
      icon: UtensilsCrossed,
      form: true,
      title: t("qr.inMall.title", "In-mall delivery"),
      description: t(
        "qr.inMall.description",
        "A code per shop or unit inside the mall — the location is pre-filled for the customer.",
      ),
      run: ({ branchId: b }, p) =>
        branchQr(b, { ...p, ...(inMallForm.getValues() as InMallValues) }),
    },
  ];

  const generate = useCallback(
    async (kind: QrKind) => {
      if (!orgId) return;
      if (kind.scope === "branch" && !branchId) return;
      setBusyId(kind.id);
      setResults((r) => {
        const { [kind.id]: _dropped, ...rest } = r;
        return rest;
      });
      setErrors((e) => {
        const { [kind.id]: _dropped, ...rest } = e;
        return rest;
      });
      try {
        const qr = await kind.run({ orgId, branchId: branchId ?? "" }, renderOpts);
        setResults((r) => ({ ...r, [kind.id]: qr }));
      } catch (e) {
        // Inline, not a toast: "bookings are switched off for this branch" is
        // a 409 the operator has to go and fix, and it belongs beside the
        // button that produced it.
        setErrors((prev) => ({ ...prev, [kind.id]: getErrorMessage(e) }));
      } finally {
        setBusyId(null);
      }
    },
    [orgId, branchId, renderOpts],
  );

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("qr.title", "QR Codes")} />
        <EmptyState icon={QrCode} title={t("branches.pickOrg", "Select an organization")} />
      </Page>
    );
  }

  const renderKind = (kind: QrKind) => {
    const available = kind.scope === "org" ? isAllBranches : Boolean(branchId);
    const unavailableHint =
      kind.scope === "org"
        ? t("qr.needsAllBranches", "Switch the scope bar to All branches to make this code.")
        : t("qr.needsBranch", "Select a branch in the scope bar to make this code.");
    const result = results[kind.id];
    const error = errors[kind.id];
    const busy = busyId === kind.id;
    const Icon = kind.icon;

    const generateButton = (
      <Button
        onClick={() => void generate(kind)}
        disabled={!available || busy}
        className="self-start"
      >
        {busy ? (
          <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <QrCode className="size-4" />
        )}
        {t("qr.generate", "Generate QR")}
      </Button>
    );

    return (
      <Card key={kind.id} className={available ? undefined : "opacity-70"}>
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
                  onSubmit={inMallForm.handleSubmit(() => void generate(kind))}
                  className="flex flex-col gap-3"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormField
                      control={inMallForm.control}
                      name="place_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("qr.inMall.placeName", "Shop name")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!available} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={inMallForm.control}
                      name="floor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("qr.inMall.floor", "Floor")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!available} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={inMallForm.control}
                      name="unit_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("qr.inMall.unitNumber", "Unit number")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!available} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={!available || busy} className="self-start">
                    {busy ? (
                      <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <QrCode className="size-4" />
                    )}
                    {t("qr.generate", "Generate QR")}
                  </Button>
                </form>
              </Form>
            ) : (
              generateButton
            )}

            {error && (
              <p role="status" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          {result && (
            <div className="w-full lg:w-64">
              <QrResult
                qr={result}
                title={kind.title}
                onPreview={() => setPreview({ qr: result, title: kind.title })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const orgKinds = kinds.filter((k) => k.scope === "org");
  const branchKinds = kinds.filter((k) => k.scope === "branch");

  return (
    <Page>
      <PageHeader
        title={t("qr.title", "QR Codes")}
        description={t(
          "qr.subtitle",
          "Scannable codes for your ordering pages and your booking pages.",
        )}
      />

      <RenderOptions opts={renderOpts} onChange={setRenderOpts} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("qr.section.org", "For the whole organization")}
        </h2>
        <div className="grid gap-4 xl:grid-cols-2">{orgKinds.map(renderKind)}</div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("qr.section.branch", "For one branch")}
        </h2>
        <div className="grid gap-4">{branchKinds.map(renderKind)}</div>
      </section>

      <QrPreviewDialog
        open={preview !== null}
        onOpenChange={(o) => !o && setPreview(null)}
        qr={preview?.qr ?? null}
        title={preview?.title ?? ""}
      />
    </Page>
  );
}
