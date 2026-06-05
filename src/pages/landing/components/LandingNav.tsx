import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { LanguageToggle } from "@/widgets/language-toggle/language-toggle";

export function LandingNav() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-cream/80 backdrop-blur-md border-b border-navy/10 z-50 flex items-center justify-between px-4 md:px-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <img src="/Icon.svg" alt="Sufrix" className="h-8 w-auto" />
        <span className="text-xl font-bold text-navy font-sans hidden md:block">Sufrix</span>
      </div>

      <div className="hidden lg:flex items-center gap-8 text-sm font-bold tracking-tight text-navy/70">
        <a href="#pos-features" className="hover:text-navy transition-colors">{t("landing.nav.pos", "POS Features")}</a>
        <a href="#dashboard-features" className="hover:text-navy transition-colors">{t("landing.nav.dashboard", "Dashboard")}</a>
        <a href="#flexibility" className="hover:text-navy transition-colors">{t("landing.nav.flex", "Flexibility")}</a>
        <a href="#contact" className="hover:text-navy transition-colors">{t("landing.nav.contact", "Contact")}</a>
      </div>
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <Button onClick={() => navigate("/login")} className="bg-navy hover:bg-navy/90 text-white rounded-full px-6">
          {t("auth.signIn")}
        </Button>
      </div>
    </nav>
  );
}
