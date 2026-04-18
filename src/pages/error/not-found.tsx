import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coffee, Home } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 brand-gradient rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <Coffee size={32} className="text-white" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight text-primary">404</h1>
      <p className="text-lg font-semibold mt-4">{t("common.noResults")}</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="rtl:rotate-180" /> {t("common.back")}
        </Button>
        <Button onClick={() => navigate("/")}>
          <Home /> {t("nav.dashboard")}
        </Button>
      </div>
    </div>
  );
}
