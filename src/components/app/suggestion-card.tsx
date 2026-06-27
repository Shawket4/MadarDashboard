import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, EyeOff, X } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SuggestionTag { label: string; className?: string }

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  tags?: SuggestionTag[];
  content: ReactNode;
  onAccept?: () => void;
  onReject?: () => void;
  onIgnore?: () => void;
  pending?: boolean;
  decision?: string | null;
  className?: string;
}

const DECISION_TINT: Record<string, string> = {
  accepted: "border-transparent bg-success/15 text-success",
  rejected: "border-transparent bg-destructive/15 text-destructive",
  ignored: "bg-muted text-muted-foreground",
};

export function SuggestionCard({ title, subtitle, tags = [], content, onAccept, onReject, onIgnore, pending, decision, className }: Props) {
  const { t } = useTranslation();
  const decided = !!decision;

  return (
    <Card className={cn("transition-opacity", decided && "opacity-70", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {title}
              {tags.map((tg, i) => (
                <Badge key={i} variant="outline" className={cn("px-1.5 py-0 text-xs font-medium", tg.className)}>{tg.label}</Badge>
              ))}
            </CardTitle>
            {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
          </div>
          {decided ? <Badge variant="outline" className={cn("shrink-0 capitalize", DECISION_TINT[decision] ?? "")}>{decision}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
      {!decided && (onAccept || onReject || onIgnore) ? (
        <CardFooter className="justify-end gap-2">
          {onIgnore ? <Button variant="ghost" size="sm" disabled={pending} onClick={onIgnore}><EyeOff className="size-4" /> {t("common.ignore", "Ignore")}</Button> : null}
          {onReject ? <Button variant="outline" size="sm" disabled={pending} onClick={onReject} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><X className="size-4" /> {t("common.reject", "Reject")}</Button> : null}
          {onAccept ? <Button size="sm" loading={pending} onClick={onAccept}><Check className="size-4" /> {t("common.accept", "Accept")}</Button> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
