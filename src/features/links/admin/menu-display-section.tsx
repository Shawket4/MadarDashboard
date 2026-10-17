/**
 * "Menu (no prices)" — the settings of the shop's menu without prices.
 *
 * Self-contained (its own query, form and save), so it can sit on the Links
 * page for every plan: a Free shop has no links page, but it has this. It is
 * NOT one of the links page's buttons and has no switch to become one; the
 * page lives at its own address, shown here with Copy, Open and its QR code
 * (the links page's own code endpoint, `target=menu_display`).
 */
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getGetMenuDisplayQueryKey,
  orgLinksQr,
  useGetMenuDisplay,
  usePutMenuDisplay,
} from "@/data/api/generated/api";
import type { MenuDisplaySettings, QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { usePop, useShake } from "@/lib/motion";
import { QrPreviewDialog } from "@/features/qr/qr-preview-dialog";

/** Matches the server's limit (`orgs::menu_display::MAX_TITLE_CHARS`). */
export const MAX_MENU_TITLE = 60;
/** The branch picker's "no pick" value: the shop's first branch. */
const DEFAULT_BRANCH = "__default__";

const schema = z.object({
  enabled: z.boolean(),
  title_en: z.string().max(MAX_MENU_TITLE),
  title_ar: z.string().max(MAX_MENU_TITLE),
  branch: z.string(),
});
type Values = z.infer<typeof schema>;

const toForm = (s: MenuDisplaySettings): Values => ({
  enabled: s.enabled,
  title_en: s.title_en ?? "",
  title_ar: s.title_ar ?? "",
  branch: s.branch_id ?? DEFAULT_BRANCH,
});

export function MenuDisplaySection({ orgId }: { orgId: string }) {
  const q = useGetMenuDisplay(orgId, { query: { enabled: !!orgId } });
  if (q.isPending || !q.data) {
    return <Skeleton className="h-56 w-full rounded-2xl" data-testid="menu-display-loading" />;
  }
  return <MenuDisplayForm orgId={orgId} saved={q.data} />;
}

function MenuDisplayForm({ orgId, saved }: { orgId: string; saved: MenuDisplaySettings }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const put = usePutMenuDisplay();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toForm(saved) });
  useEffect(() => form.reset(toForm(saved)), [form, saved]);

  const [qr, setQr] = useState<QrResponse | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  // Save answers "did it save?" itself, as the links page's Save does.
  const saveRef = useRef<HTMLButtonElement>(null);
  const [savedN, setSavedN] = useState(0);
  const [failed, setFailed] = useState(0);
  usePop(saveRef, savedN);
  useShake(saveRef, failed);

  const firstBranch = saved.branches[0]?.name;

  const save = form.handleSubmit(
    async (v) => {
      try {
        const next = await put.mutateAsync({
          id: orgId,
          data: {
            enabled: v.enabled,
            title_en: v.title_en.trim() || null,
            title_ar: v.title_ar.trim() || null,
            branch_id: v.branch === DEFAULT_BRANCH ? null : v.branch,
          },
        });
        queryClient.setQueryData(getGetMenuDisplayQueryKey(orgId), next);
        toast.success(t("menuDisplay.editor.saved", "Menu settings saved"));
        setSavedN((n) => n + 1);
      } catch (e) {
        toast.error(getErrorMessage(e));
        setFailed((n) => n + 1);
      }
    },
    () => setFailed((n) => n + 1),
  );

  const showQr = async () => {
    setQrBusy(true);
    try {
      setQr(await orgLinksQr(orgId, { target: "menu_display" }, {}));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setQrBusy(false);
    }
  };

  const url = saved.public_url;
  const live = saved.enabled;

  return (
    <Card className="py-0" data-testid="menu-display-section">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-sm font-semibold">{t("menuDisplay.editor.title", "Menu (no prices)")}</h2>
            <p className="text-xs text-muted-foreground">
              {t(
                "menuDisplay.editor.hint",
                "Your menu at its own address with no prices anywhere: for a screen, a table card or your bio. Customers can build a list to show your staff; nothing is ordered from it.",
              )}
            </p>
          </div>
          <Button ref={saveRef} type="button" onClick={() => void save()} disabled={put.isPending}>
            {put.isPending ? <Spinner /> : null}
            {t("common.save", "Save")}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => void save(e)} className="grid gap-4">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <FormLabel>{t("menuDisplay.editor.enabled", "Show the menu without prices")}</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      {t("menuDisplay.editor.enabledHint", "Off, its address shows nothing.")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("menuDisplay.editor.titleEn", "Title (English, optional)")}</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={MAX_MENU_TITLE} placeholder={t("menuDisplay.title", "Menu")} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("menuDisplay.editor.titleAr", "Title (Arabic, optional)")}</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={MAX_MENU_TITLE} placeholder="المنيو" dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("menuDisplay.editor.branch", "Which branch's menu")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-80">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={DEFAULT_BRANCH}>
                        {firstBranch
                          ? t("menuDisplay.editor.branchDefaultNamed", {
                              name: firstBranch,
                              defaultValue: "Your first branch ({{name}})",
                            })
                          : t("menuDisplay.editor.branchDefault", "Your first branch")}
                      </SelectItem>
                      {saved.branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "menuDisplay.editor.branchHint",
                      "Items switched off at that branch are left out.",
                    )}
                  </p>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">{t("menuDisplay.editor.address", "Its address")}</p>
          {url ? (
            <>
              <p
                dir="ltr"
                data-testid="menu-display-url"
                className="break-all rounded-lg border bg-secondary px-3 py-2.5 font-mono text-sm"
              >
                {url}
              </p>
              {!live ? (
                <p className="text-xs text-muted-foreground">
                  {t("menuDisplay.editor.offNote", "Switch it on and save, and the address opens your menu.")}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success(t("links.editor.copied", "Address copied")))
                  }
                >
                  <Copy className="size-4" />
                  {t("links.editor.copy", "Copy")}
                </Button>
                <Button type="button" variant="outline" onClick={() => void showQr()} disabled={qrBusy}>
                  {qrBusy ? <Spinner /> : <QrCode className="size-4" />}
                  {t("links.editor.qr", "QR code")}
                </Button>
                {live ? (
                  <Button type="button" variant="outline" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      {t("links.editor.open", "Open")}
                    </a>
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("menuDisplay.editor.noAddress", "This server has no public address set up yet.")}
            </p>
          )}
        </div>
      </CardContent>

      <QrPreviewDialog
        qr={qr}
        open={!!qr}
        onOpenChange={(o) => !o && setQr(null)}
        title={t("menuDisplay.editor.qrTitle", "Menu (no prices) code")}
      />
    </Card>
  );
}
