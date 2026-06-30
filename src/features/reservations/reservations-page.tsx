import { useTranslation } from "react-i18next";
import { CalendarCheck } from "lucide-react";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScope } from "@/data/scope/use-scope";
import { HostBoard } from "./host-board";
import { FloorEditor } from "./floor-editor";
import { SettingsForm } from "./settings-form";

export function ReservationsPage() {
  const { t } = useTranslation();
  const scope = useScope();
  const branchId = scope.branchId;

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("reservations.title", "Reservations")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("reservations.pageSubtitle", "Floor plan, reservations & waitlist, and smart-nudge settings for this branch.")}
        </p>
      </div>

      {!branchId ? (
        <EmptyState icon={CalendarCheck} title={t("reservations.pickBranch", "Select a branch in the top bar to manage its reservations")} />
      ) : (
        <Tabs defaultValue="board">
          <TabsList>
            <TabsTrigger value="board">{t("reservations.tabBoard", "Board")}</TabsTrigger>
            <TabsTrigger value="floor">{t("reservations.tabFloor", "Floor plan")}</TabsTrigger>
            <TabsTrigger value="settings">{t("reservations.tabSettings", "Settings")}</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="mt-4">
            <HostBoard branchId={branchId} />
          </TabsContent>
          <TabsContent value="floor" className="mt-4">
            <FloorEditor branchId={branchId} />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <SettingsForm branchId={branchId} />
          </TabsContent>
        </Tabs>
      )}
    </Page>
  );
}
