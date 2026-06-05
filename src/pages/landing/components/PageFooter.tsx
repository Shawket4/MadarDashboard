import { useTranslation } from "react-i18next";
import { meta } from "@/pages/landing/lib/tokens";

type Props = {
  page: number;
};

/**
 * Standard footer used on every interior page.
 * Strapline on the start side, page indicator on the end side.
 * Page indicator stays ZERO-PADDED (02 / 12) for book-reference feel —
 * unlike pillar numbers and chapter eyebrows which are unpadded (1, 2, 3).
 */
export default function PageFooter({ page }: Props) {
  const { t } = useTranslation();
  return (
    <footer className="flex items-center justify-between mt-8 pt-5 border-t border-navy/10">
      <span className="text-[10px] tracking-[0.28em] uppercase text-navy/45 font-medium">
        {t("footer.strapline")}
      </span>
      <span className="text-[10px] tracking-[0.28em] uppercase text-navy/45 font-medium tabular">
        {String(page).padStart(2, "0")} / {String(meta.totalPages).padStart(2, "0")}
      </span>
    </footer>
  );
}
