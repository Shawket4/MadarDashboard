/**
 * Settings › Links page — the editor for the shop's own address.
 *
 * What the page ADDS is edited here: which buttons show and in what order, the
 * shop's own links, a line under its name, whether the card image is the
 * cover, and the "Visit us" branches. Whether a module CAN show is not: that is
 * the module's own switch (ordering channels, bookings, the rewards
 * programme), and this pane says where to find it rather than growing a second
 * one. The socials are the same fields the Brand pane edits — one map on the
 * organisation, saved from either place.
 *
 * The preview beside the form is the public page itself (`LinksPage`), reading
 * what is saved: the same component a customer gets, so it cannot drift.
 */
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getGetLinksPageQueryKey,
  getPublicOrgLinksQueryKey,
  orgLinksQr,
  useGetLinksPage,
  usePutLinksPage,
} from "@/data/api/generated/api";
import type {
  LinksPageBranchInput,
  LinksPageItem,
  LinksPageSettings,
  QrResponse,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import {
  SocialLinksFields,
  socialLinksPatch,
  socialLinksSchema,
  socialLinksToForm,
  isHttpsUrl,
} from "@/features/orgs/social-links";
import { PaneHeader } from "@/features/settings/pane-header";
import { QrPreviewDialog } from "@/features/qr/qr-preview-dialog";
import { LinksPage } from "@/features/links/public/links-page";

const MAX_TAGLINE = 160;
const MAX_TITLE = 60;

const formSchema = (t: (k: string, d?: string) => string) =>
  z.object({
    tagline_en: z.string().max(MAX_TAGLINE),
    tagline_ar: z.string().max(MAX_TAGLINE),
    show_cover: z.boolean(),
    show_branches: z.boolean(),
    social: socialLinksSchema(t as never),
  });
type FormValues = z.infer<ReturnType<typeof formSchema>>;

/** A branch row as edited: the settings plus what the list shows. */
interface BranchDraft extends LinksPageBranchInput {
  name: string;
  address?: string | null;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : undefined;

export function LinksPane() {
  const { t } = useTranslation();
  const orgId = useOrgId() ?? "";
  const q = useGetLinksPage(orgId, { query: { enabled: !!orgId } });

  if (q.isPending || !q.data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  return <LinksEditor key={orgId} orgId={orgId} saved={q.data} t={t} />;
}

function LinksEditor({
  orgId,
  saved,
  t,
}: {
  orgId: string;
  saved: LinksPageSettings;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<LinksPageItem[]>(saved.items);
  const [branches, setBranches] = useState<BranchDraft[]>(() =>
    saved.branches.map((b) => ({
      branch_id: b.id,
      visible: b.visible,
      maps_url: b.maps_url ?? "",
      name: b.name,
      address: b.address,
    })),
  );
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  // Bumped after a save so the preview re-reads the public page.
  const [previewKey, setPreviewKey] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(t as never)),
    defaultValues: {
      tagline_en: saved.tagline_en ?? "",
      tagline_ar: saved.tagline_ar ?? "",
      show_cover: saved.show_cover,
      show_branches: saved.show_branches,
      social: socialLinksToForm(saved.social_links as never),
    },
  });

  // The server mints ids for new custom links; keep the draft in step after
  // a save so a second save does not duplicate them.
  useEffect(() => setItems(saved.items), [saved.items]);

  const modules = useMemo(
    () => new Map(saved.modules.map((m) => [m.kind, m])),
    [saved.modules],
  );

  const put = usePutLinksPage();

  const move = (i: number, by: -1 | 1) =>
    setItems((list) => {
      const j = i + by;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const patchItem = (i: number, patch: Partial<LinksPageItem>) =>
    setItems((list) => list.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems((list) => list.filter((_, k) => k !== i));
  const addCustom = () =>
    setItems((list) => [
      ...list,
      { kind: "custom", visible: true, id: newId(), title_en: "", title_ar: "", url: "" },
    ]);

  const customProblem = items.some(
    (it) =>
      it.kind === "custom" &&
      (!(it.title_en ?? "").trim() ||
        (it.title_en ?? "").length > MAX_TITLE ||
        (it.title_ar ?? "").length > MAX_TITLE ||
        !isHttpsUrl((it.url ?? "").trim())),
  );
  const mapsProblem = branches.some((b) => (b.maps_url ?? "").trim() && !isHttpsUrl((b.maps_url ?? "").trim()));

  const save = form.handleSubmit(async (values) => {
    if (customProblem || mapsProblem) {
      toast.error(t("links.editor.fixLinks", "Every link needs a title and a full https:// address."));
      return;
    }
    try {
      await put.mutateAsync({
        id: orgId,
        data: {
          items: items.map((it) =>
            it.kind === "custom"
              ? {
                  ...it,
                  title_en: (it.title_en ?? "").trim(),
                  title_ar: (it.title_ar ?? "").trim() || null,
                  url: (it.url ?? "").trim(),
                }
              : { kind: it.kind, visible: it.visible },
          ),
          tagline_en: values.tagline_en.trim() || null,
          tagline_ar: values.tagline_ar.trim() || null,
          show_cover: values.show_cover,
          show_branches: values.show_branches,
          branches: branches.map((b) => ({
            branch_id: b.branch_id,
            visible: b.visible,
            maps_url: (b.maps_url ?? "").trim() || null,
          })),
          social_links: socialLinksPatch(values.social, saved.social_links as never),
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetLinksPageQueryKey(orgId) }),
        queryClient.invalidateQueries({ queryKey: getPublicOrgLinksQueryKey({ org_id: orgId }) }),
      ]);
      setPreviewKey((k) => k + 1);
      toast.success(t("links.editor.saved", "Links page saved"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  });

  const showQr = async () => {
    setQrBusy(true);
    try {
      setQr(await orgLinksQr(orgId, {}, {}));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setQrBusy(false);
    }
  };

  const title = (it: LinksPageItem) =>
    it.kind === "custom"
      ? it.title_en?.trim() || t("links.editor.newLink", "New link")
      : t(`links.module.${it.kind}.title`);

  return (
    <div className="space-y-6">
      <PaneHeader
        title={t("links.editor.title", "Links page")}
        description={t(
          "links.editor.desc",
          "The page your address opens on — for your Instagram bio, a QR on the counter, or a receipt.",
        )}
        actions={
          <Button onClick={() => void save()} disabled={put.isPending}>
            {put.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("common.save", "Save")}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Form {...form}>
          <form onSubmit={(e) => void save(e)} className="space-y-6">
            {/* Where it lives */}
            <Card className="py-0">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                {saved.public_url ? (
                  <>
                    <code
                      dir="ltr"
                      className="min-w-0 flex-1 truncate rounded-lg border bg-secondary px-3 py-2 text-sm"
                    >
                      {saved.public_url}
                    </code>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          void navigator.clipboard
                            .writeText(saved.public_url!)
                            .then(() => toast.success(t("links.editor.copied", "Address copied")))
                        }
                      >
                        <Copy className="size-4" />
                        {t("links.editor.copy", "Copy")}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void showQr()} disabled={qrBusy}>
                        {qrBusy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
                        {t("links.editor.qr", "QR code")}
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <a href={saved.public_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-4" />
                          {t("links.editor.open", "Open")}
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "links.editor.noAddress",
                      "Your own address comes with the branding plan. The page is ready — it goes live the moment you have one.",
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Under the name */}
            <Card className="py-0">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tagline_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("links.editor.taglineEn", "Line under your name (English)")}</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={MAX_TAGLINE} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tagline_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("links.editor.taglineAr", "Line under your name (Arabic)")}</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={MAX_TAGLINE} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="show_cover"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
                      <div>
                        <FormLabel>{t("links.editor.cover", "Use your card image as the cover")}</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {saved.card_image_url
                            ? t("links.editor.coverHint", "The wide photo from your Brand settings. Off, the band is your colour.")
                            : t("links.editor.coverNone", "Upload a card image under Brand to use one.")}
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* The buttons */}
            <Card className="py-0">
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="text-sm font-medium">{t("links.editor.buttons", "Buttons")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "links.editor.buttonsHint",
                      "In the order they show. The first one that's on is the big button.",
                    )}
                  </p>
                </div>
                <ul className="divide-y rounded-lg border">
                  {items.map((it, i) => {
                    const status = it.kind === "custom" ? null : modules.get(it.kind);
                    const unavailable = status ? !status.available : false;
                    return (
                      <li key={it.id ?? it.kind} className="flex flex-col gap-3 p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={t("links.editor.up", "Move up")}
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={t("links.editor.down", "Move down")}
                              disabled={i === items.length - 1}
                              onClick={() => move(i, 1)}
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{title(it)}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {it.kind === "custom"
                                ? it.url || t("links.editor.customHint", "Your own link")
                                : unavailable
                                  ? t(`links.editor.off.${it.kind}`)
                                  : status?.branch_names.length
                                    ? status.branch_names.join(" · ")
                                    : t("links.editor.available", "On")}
                            </p>
                          </div>
                          {it.kind === "custom" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("links.editor.remove", "Remove link")}
                              onClick={() => removeItem(i)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                          <Switch
                            checked={it.visible && !unavailable}
                            disabled={unavailable}
                            onCheckedChange={(v) => patchItem(i, { visible: v })}
                            aria-label={t("links.editor.show", { name: title(it), defaultValue: "Show {{name}}" })}
                          />
                        </div>
                        {it.kind === "custom" ? (
                          <div className="grid gap-2 sm:grid-cols-3">
                            <Input
                              value={it.title_en ?? ""}
                              maxLength={MAX_TITLE}
                              placeholder={t("links.editor.titleEn", "Title (English)")}
                              onChange={(e) => patchItem(i, { title_en: e.target.value })}
                              dir="ltr"
                            />
                            <Input
                              value={it.title_ar ?? ""}
                              maxLength={MAX_TITLE}
                              placeholder={t("links.editor.titleAr", "Title (Arabic)")}
                              onChange={(e) => patchItem(i, { title_ar: e.target.value })}
                              dir="rtl"
                            />
                            <Input
                              value={it.url ?? ""}
                              placeholder="https://"
                              inputMode="url"
                              spellCheck={false}
                              onChange={(e) => patchItem(i, { url: e.target.value })}
                              dir="ltr"
                              aria-invalid={!!(it.url ?? "").trim() && !isHttpsUrl((it.url ?? "").trim())}
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <Button type="button" variant="outline" onClick={addCustom}>
                  <Plus className="size-4" />
                  <Link2 className="size-4" />
                  {t("links.editor.addLink", "Add your own link")}
                </Button>
              </CardContent>
            </Card>

            {/* Socials — the organisation's one map, shared with Brand. */}
            <Card className="py-0">
              <CardContent className="p-4">
                <SocialLinksFields />
              </CardContent>
            </Card>

            {/* Visit us */}
            <Card className="py-0">
              <CardContent className="space-y-3 p-4">
                <FormField
                  control={form.control}
                  name="show_branches"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-3">
                      <div>
                        <FormLabel>{t("links.editor.visit", "Show “Visit us”")}</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {t("links.editor.visitHint", "Your branches, with directions and a call button.")}
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch("show_branches") && branches.length > 0 ? (
                  <ul className="divide-y rounded-lg border">
                    {branches.map((b, i) => (
                      <li key={b.branch_id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{b.name}</p>
                          {b.address ? (
                            <p className="truncate text-xs text-muted-foreground">{b.address}</p>
                          ) : null}
                        </div>
                        <Input
                          className="sm:w-64"
                          value={b.maps_url ?? ""}
                          placeholder={t("links.editor.maps", "Google Maps link (optional)")}
                          inputMode="url"
                          spellCheck={false}
                          dir="ltr"
                          aria-invalid={!!(b.maps_url ?? "").trim() && !isHttpsUrl((b.maps_url ?? "").trim())}
                          onChange={(e) =>
                            setBranches((list) =>
                              list.map((x, k) => (k === i ? { ...x, maps_url: e.target.value } : x)),
                            )
                          }
                        />
                        <Switch
                          checked={b.visible}
                          aria-label={t("links.editor.show", { name: b.name, defaultValue: "Show {{name}}" })}
                          onCheckedChange={(v) =>
                            setBranches((list) => list.map((x, k) => (k === i ? { ...x, visible: v } : x)))
                          }
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* The page itself, as saved. */}
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("links.editor.preview", "Preview (as saved)")}
          </p>
          <div className="relative h-[720px] overflow-y-auto overflow-x-hidden rounded-[28px] border-[6px] border-foreground/10 bg-background">
            <LinksPage key={previewKey} orgId={orgId} />
          </div>
        </aside>
      </div>

      <QrPreviewDialog
        qr={qr}
        open={!!qr}
        onOpenChange={(o) => !o && setQr(null)}
        title={t("links.editor.qrTitle", "Links page code")}
      />
    </div>
  );
}
