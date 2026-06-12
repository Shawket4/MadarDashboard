import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ImageUploader } from "@/shared/ui/image-uploader";
import {
  useGetOrg, useUpdateOrg, useUploadOrgLogo, getListOrgsQueryKey, getGetOrgQueryKey,
} from "@/shared/api/generated/api";
import { useAppStore } from "@/shared/auth/app-store";
import { getErrorMessage } from "@/shared/api/errors";
import type { OnboardingStatus } from "@/shared/api/generated/models";
import { StepFrame } from "./step-frame";
import { firstIncompleteRequiredStep, hasAnyProgress } from "./use-onboarding";

/** Welcome — org name + logo, reusing the org settings mutations. */
export function StepWelcome({
  orgId,
  status,
  onJumpToResume,
}: {
  orgId: string;
  status: OnboardingStatus | undefined;
  onJumpToResume: (step: number) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: org } = useGetOrg(orgId, { query: { enabled: !!orgId } });
  const setSelectedOrg = useAppStore((s) => s.setSelectedOrg);
  const [name, setName] = useState<string | null>(null); // null = untouched

  const invalidateOrg = () => {
    qc.invalidateQueries({ queryKey: getListOrgsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetOrgQueryKey(orgId) });
  };

  const updateOrg = useUpdateOrg({
    mutation: {
      onSuccess: () => {
        invalidateOrg();
        toast.success(t("common.save"));
        setName(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const uploadLogo = useUploadOrgLogo({
    mutation: {
      onSuccess: (updated) => {
        invalidateOrg();
        setSelectedOrg(updated.id, updated.logo_url);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const resume = hasAnyProgress(status);

  return (
    <StepFrame title={t("onboarding.welcome.title")} description={t("onboarding.welcome.description")}>
      {resume && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles size={16} className="text-primary shrink-0" />
              {t("onboarding.welcome.pickingUp")}
            </div>
            <Button size="sm" variant="outline" onClick={() => onJumpToResume(firstIncompleteRequiredStep(status))}>
              {t("onboarding.welcome.jumpToNext")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("onboarding.welcome.orgName")}</label>
          <Input
            value={name ?? org?.name ?? ""}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("onboarding.welcome.orgNamePh")}
          />
          {name !== null && name.trim() && name !== org?.name && (
            <Button
              size="sm"
              loading={updateOrg.isPending}
              onClick={() => updateOrg.mutate({ id: orgId, data: { name: name.trim() } })}
            >
              {t("common.save")}
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("onboarding.welcome.logo")}</label>
          <ImageUploader
            value={org?.logo_url}
            onUpload={async (file) => {
              const updated = await uploadLogo.mutateAsync({ id: orgId, data: { logo: file } });
              return updated.logo_url ?? "";
            }}
            hint={t("orgs.logoHint")}
          />
        </div>
      </div>
    </StepFrame>
  );
}
