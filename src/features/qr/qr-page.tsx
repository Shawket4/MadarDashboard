import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Download, Link2, QrCode, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { branchQr, orgQr } from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { QrPreviewDialog } from "./qr-preview-dialog";

// ── In-mall form schema ───────────────────────────────────────────────────────

const inMallSchema = z.object({
  place_name: z.string().min(1, "Required").max(80),
  floor: z.string().min(1, "Required").max(40),
  unit_number: z.string().min(1, "Required").max(40),
});
type InMallValues = z.infer<typeof inMallSchema>;

// ── Render options state ──────────────────────────────────────────────────────

interface RenderOpts {
  card: boolean;
  dpi: number;
}

function RenderOptions({ opts, onChange }: { opts: RenderOpts; onChange: (o: RenderOpts) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
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
          <Label className="text-xs text-muted-foreground">DPI</Label>
          <select
            className="rounded border bg-background px-2 py-0.5 text-xs"
            value={opts.dpi}
            onChange={(e) => onChange({ ...opts, dpi: Number(e.target.value) })}
          >
            <option value={150}>150</option>
            <option value={300}>300</option>
            <option value={600}>600</option>
          </select>
        </div>
      )}
    </div>
  );
}

// ── QR result display ─────────────────────────────────────────────────────────

function QrResult({ qr, title }: { qr: QrResponse; title: string }) {
  const { t } = useTranslation();
  const isSvg = qr.qr_data_url.startsWith("data:image/svg");

  const download = () => {
    const ext = isSvg ? "svg" : "png";
    const a = document.createElement("a");
    a.href = qr.qr_data_url;
    a.download = `qr-${qr.short_code}.${ext}`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-4">
      <img src={qr.qr_data_url} alt="QR code" className="size-52 object-contain" />
      <div className="flex w-full items-center gap-2 rounded-lg bg-muted px-2 py-1.5">
        <Link2 className="size-3 shrink-0 text-muted-foreground" />
        <a
          href={qr.short_url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate font-mono text-xs hover:underline"
        >
          {qr.short_url}
        </a>
      </div>
      <Button className="w-full" onClick={download}>
        <Download className="size-4" />
        {t("common.download", "Download")} {title}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function QrPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, isAllBranches } = useScope();

  const [renderOpts, setRenderOpts] = useState<RenderOpts>({ card: true, dpi: 600 });

  // Standard branch QR state
  const [branchQrResult, setBranchQrResult] = useState<QrResponse | null>(null);
  const [branchBusy, setBranchBusy] = useState(false);

  // In-mall QR state
  const [inMallResult, setInMallResult] = useState<QrResponse | null>(null);
  const [inMallBusy, setInMallBusy] = useState(false);

  // Org QR state
  const [orgQrResult, setOrgQrResult] = useState<QrResponse | null>(null);
  const [orgBusy, setOrgBusy] = useState(false);

  // Preview dialog
  const [preview, setPreview] = useState<{ qr: QrResponse; title: string } | null>(null);

  const inMallForm = useForm<InMallValues>({
    resolver: zodResolver(inMallSchema),
    defaultValues: { place_name: "", floor: "", unit_number: "" },
  });

  const renderParams = {
    card: renderOpts.card,
    dpi: renderOpts.dpi,
  };

  const generateBranchQr = async () => {
    if (!branchId) return;
    setBranchBusy(true);
    setBranchQrResult(null);
    try {
      const result = await branchQr(branchId, renderParams);
      setBranchQrResult(result);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBranchBusy(false);
    }
  };

  const generateInMallQr = async (values: InMallValues) => {
    if (!branchId) return;
    setInMallBusy(true);
    setInMallResult(null);
    try {
      const result = await branchQr(branchId, {
        ...renderParams,
        place_name: values.place_name,
        floor: values.floor,
        unit_number: values.unit_number,
      });
      setInMallResult(result);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setInMallBusy(false);
    }
  };

  const generateOrgQr = async () => {
    if (!orgId) return;
    setOrgBusy(true);
    setOrgQrResult(null);
    try {
      const result = await orgQr(orgId, renderParams);
      setOrgQrResult(result);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setOrgBusy(false);
    }
  };

  if (!orgId) {
    return (
      <Page>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {t("qr.title", "QR Codes")}
        </h1>
        <EmptyState icon={QrCode} title={t("branches.pickOrg", "Select an organization")} />
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {t("qr.title", "QR Codes")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("qr.subtitle", "Generate scannable QR codes for your online ordering page")}
        </p>
      </div>

      {/* Org-level all-branches QR */}
      {isAllBranches ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              {t("qr.org.title", "All-branches QR")}
            </CardTitle>
            <CardDescription>
              {t(
                "qr.org.description",
                "One QR that lets customers browse and pick any of your branches, then place an order.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-3">
              <RenderOptions opts={renderOpts} onChange={setRenderOpts} />
              <Button onClick={() => void generateOrgQr()} disabled={orgBusy} className="self-start">
                {orgBusy ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <QrCode className="size-4" />
                )}
                {t("qr.generate", "Generate QR")}
              </Button>
            </div>
            {orgQrResult && (
              <div className="w-full sm:w-64">
                <QrResult qr={orgQrResult} title={t("qr.org.title", "All-branches QR")} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : !branchId ? (
        <EmptyState icon={Store} title={t("qr.pickBranch", "Select a branch from the scope bar above")} />
      ) : (
        <Tabs defaultValue="standard">
          <TabsList>
            <TabsTrigger value="standard">{t("qr.tabs.standard", "Standard menu")}</TabsTrigger>
            <TabsTrigger value="in_mall">{t("qr.tabs.inMall", "In-mall delivery")}</TabsTrigger>
          </TabsList>

          {/* Standard branch QR */}
          <TabsContent value="standard" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="size-4" />
                  {t("qr.standard.title", "Branch menu QR")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "qr.standard.description",
                    "Customers scan this to open your branch's ordering page. Works for both in-mall and outside delivery.",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex flex-1 flex-col gap-3">
                  <RenderOptions opts={renderOpts} onChange={setRenderOpts} />
                  <Button
                    onClick={() => void generateBranchQr()}
                    disabled={branchBusy}
                    className="self-start"
                  >
                    {branchBusy ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <QrCode className="size-4" />
                    )}
                    {t("qr.generate", "Generate QR")}
                  </Button>
                </div>
                {branchQrResult && (
                  <div className="w-full sm:w-64">
                    <QrResult
                      qr={branchQrResult}
                      title={t("qr.standard.title", "Branch menu QR")}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* In-mall delivery QR */}
          <TabsContent value="in_mall" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  {t("qr.inMall.title", "In-mall delivery QR")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "qr.inMall.description",
                    "Place this QR at a specific spot inside the mall. When customers scan it, the delivery type is locked to in-mall and the location is pre-filled.",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...inMallForm}>
                  <form
                    onSubmit={inMallForm.handleSubmit(generateInMallQr)}
                    className="flex flex-col gap-4 sm:flex-row sm:items-start"
                  >
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <FormField
                          control={inMallForm.control}
                          name="place_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("qr.inMall.placeName", "Shop / company name")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("qr.inMall.placeNamePlaceholder", "Starbucks Kiosk 3")} />
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
                                <Input {...field} placeholder={t("qr.inMall.floorPlaceholder", "Ground Floor")} />
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
                              <FormLabel>{t("qr.inMall.unit", "Unit / office")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("qr.inMall.unitPlaceholder", "Unit 42")} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <RenderOptions opts={renderOpts} onChange={setRenderOpts} />
                      <Button type="submit" disabled={inMallBusy} className="self-start">
                        {inMallBusy ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <QrCode className="size-4" />
                        )}
                        {t("qr.generate", "Generate QR")}
                      </Button>
                    </div>
                    {inMallResult && (
                      <div className="w-full sm:w-64">
                        <QrResult
                          qr={inMallResult}
                          title={t("qr.inMall.title", "In-mall delivery QR")}
                        />
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <QrPreviewDialog
        qr={preview?.qr ?? null}
        title={preview?.title}
        open={!!preview}
        onOpenChange={(o) => { if (!o) setPreview(null); }}
      />
    </Page>
  );
}
