import { useTranslation } from "react-i18next";
import { Armchair } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScope } from "@/data/scope/use-scope";
import { FloorEditor } from "./floor-editor";
import { LiveBoard } from "./live-board";

export function FloorPage() {
  const { t } = useTranslation();
  const scope = useScope();
  const branchId = scope.branchId;

  return (
    <Page>
      <PageHeader
        title={t("floor.title", "Floor")}
        description={t("floor.pageSubtitle", "The live table map and the layout editor for this branch.")}
      />

      {!branchId ? (
        <EmptyState
          icon={Armchair}
          title={t("floor.pickBranch", "Select a branch in the top bar to see its floor")}
        />
      ) : (
        <Tabs defaultValue="board">
          <TabsList>
            <TabsTrigger value="board">{t("floor.tabBoard", "Live board")}</TabsTrigger>
            <TabsTrigger value="editor">{t("floor.tabEditor", "Editor")}</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="mt-4">
            <LiveBoard branchId={branchId} />
          </TabsContent>
          <TabsContent value="editor" className="mt-4">
            <FloorEditor branchId={branchId} />
          </TabsContent>
        </Tabs>
      )}
    </Page>
  );
}
