import { Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CTA() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  
  return (
    <section className="py-24 bg-navy text-cream flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("landing.cta.title", "Ready to upgrade your operations?")}</h2>
      <p className="text-lg md:text-xl text-cream/70 max-w-2xl mb-12">
        {t("landing.cta.subtitle", "Sufrix is built to flex with your business. Contact our creator today to get started.")}
      </p>
      
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta mb-4">
            <Phone size={24} />
          </div>
          <p className="text-sm text-cream/50 mb-1">{t("landing.cta.creator", "Creator")}</p>
          <p className="font-bold text-lg">{isAr ? "شوكت إبراهيم" : "Shawket Ibrahim"}</p>
          <a href="tel:+201061856523" className="text-terracotta hover:text-white transition-colors mt-2 text-xl font-medium" dir="ltr">+201061856523</a>
        </div>
        
        <div className="hidden md:block w-px bg-white/10" />
        <div className="block md:hidden h-px w-full bg-white/10" />
        
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta mb-4">
            <Mail size={24} />
          </div>
          <p className="text-sm text-cream/50 mb-1">{t("landing.cta.email", "Email")}</p>
          <p className="font-bold text-lg">shawket.4@icloud.com</p>
          <a href="mailto:shawket.4@icloud.com" className="text-terracotta hover:text-white transition-colors mt-2 text-xl font-medium">{t("landing.cta.dropEmail", "Drop an email")}</a>
        </div>
      </div>
    </section>
  );
}
