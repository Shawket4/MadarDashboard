import type { ReactNode } from "react";
import { Check, X, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";
import { useTranslation } from "react-i18next";

export interface SuggestionCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  tags?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }[];
  content: ReactNode;
  
  onAccept?: () => void;
  onReject?: () => void;
  onIgnore?: () => void;
  
  isAccepting?: boolean;
  isRejecting?: boolean;
  isIgnoring?: boolean;
  
  decision?: "accepted" | "rejected" | "ignored" | null;
  className?: string;
  hideActions?: boolean;
}

export function SuggestionCard({
  title, 
  subtitle, 
  tags = [], 
  content, 
  onAccept, 
  onReject, 
  onIgnore, 
  isAccepting, 
  isRejecting, 
  isIgnoring, 
  decision, 
  className,
  hideActions = false
}: SuggestionCardProps) {
  const { t } = useTranslation();
  const isDecided = !!decision;
  const isPending = isAccepting || isRejecting || isIgnoring;

  return (
    <Card className={cn("transition-all", isDecided && "opacity-60 grayscale-[0.2]", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              {title}
              {tags.map((tag, i) => (
                <Badge key={i} variant={tag.variant} className="text-[10px] uppercase tracking-wider px-1.5 py-0">
                  {tag.label}
                </Badge>
              ))}
            </CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          
          {isDecided && (
            <Badge 
              variant={
                decision === "accepted" ? "success" : 
                decision === "rejected" ? "destructive" : "secondary"
              }
              className="shrink-0 capitalize"
            >
              {decision}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {content}
      </CardContent>

      {!hideActions && !isDecided && (
        <CardFooter className="pt-0 flex gap-2 justify-end">
          {onIgnore && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onIgnore} 
              disabled={isPending}
              loading={isIgnoring}
            >
              <EyeOff className="w-4 h-4 me-1" />
              {t("common.ignore", "Ignore")}
            </Button>
          )}
          {onReject && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReject}
              disabled={isPending}
              loading={isRejecting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4 me-1" />
              {t("common.reject", "Reject")}
            </Button>
          )}
          {onAccept && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onAccept}
              disabled={isPending}
              loading={isAccepting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 me-1" />
              {t("common.accept", "Accept")}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
