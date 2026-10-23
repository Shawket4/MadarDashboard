/**
 * The card's stamp tracks by name, in the reader's language, for labels
 * (segments, the overview's per-track bars, a ledger row's track). Read with
 * `loyalty.read`; without it every track is "Track n" and there is one.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useGetLoyaltyTracks } from "@/data/api/generated/api";
import type { Track } from "@/data/api/generated/models";
import { useCan } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";

import type { TrackName } from "./audience/audience-builder";

export function trackLabel(track: Pick<Track, "name_en" | "name_ar"> | undefined, arabic: boolean, fallback: string): string {
  const name = arabic ? track?.name_ar || track?.name_en : track?.name_en || track?.name_ar;
  return name?.trim() || fallback;
}

export function useTrackNames(): { tracks: TrackName[]; mode: string | undefined; loading: boolean } {
  const { t, i18n } = useTranslation();
  const canRead = useCan(Cap.loyaltyRead);
  const q = useGetLoyaltyTracks({ query: { enabled: canRead } });
  const arabic = i18n.language.startsWith("ar");
  const tracks = useMemo(() => {
    const list = q.data?.tracks ?? [];
    if (list.length === 0) return [{ position: 1, name: t("rewards.common.trackOne", "Main card") }];
    return list.map((tr) => ({
      position: tr.position,
      name: trackLabel(
        tr,
        arabic,
        tr.position === 1 ? t("rewards.common.trackOne", "Main card") : t("rewards.common.trackN", { defaultValue: "Track {{n}}", n: tr.position }),
      ),
    }));
  }, [q.data, arabic, t]);
  return { tracks, mode: q.data?.mode, loading: q.isLoading };
}
