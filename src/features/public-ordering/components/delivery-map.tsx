import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

// Bundler fix for Leaflet's default icon (paths break under Vite). Applied once.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

export interface LatLng {
  lat: number;
  lng: number;
}

/** A brand-tinted teardrop pin (themed via .po-pin in globals.css), with a pulse. */
const pinIcon = L.divIcon({
  className: "po-pin-wrapper",
  html: `<div class="po-pin"><span class="po-pin__pulse"></span><svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.716 0 0 6.716 0 15c0 9.5 13.2 23.6 13.77 24.2a1.7 1.7 0 0 0 2.46 0C16.8 38.6 30 24.5 30 15 30 6.716 23.284 0 15 0Z" fill="currentColor"/><circle cx="15" cy="15" r="5.5" fill="white"/></svg></div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

/** Keeps the Leaflet view in sync when the picked point changes externally. */
function Recenter({ point }: { point: LatLng }) {
  const map = useMap();
  const last = useRef<string>("");
  useEffect(() => {
    const key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
    if (key !== last.current) {
      last.current = key;
      map.setView([point.lat, point.lng], map.getZoom(), { animate: true });
    }
  }, [map, point]);
  return null;
}

/** Tap-to-move: clicking anywhere on the map drops the pin there. */
function TapToMove({ onChange }: { onChange: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** A floating "locate me" control overlaid on the map. */
function LocateControl({ onLocate, busy }: { onLocate: () => void; busy: boolean }) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      loading={busy}
      onClick={onLocate}
      aria-label={t("order.location.useMyLocation")}
      className="absolute bottom-3 end-3 z-[1000] size-10 rounded-full border border-border/70 shadow-lg"
    >
      {!busy && <LocateFixed className="size-4" />}
    </Button>
  );
}

/** Geocode an address via OpenStreetMap Nominatim and drop the pin on a result.
 * Works on insecure (http) origins — it's an outbound HTTPS fetch, not the
 * secure-context Geolocation API — so it's the reliable fallback when "Locate
 * me" is blocked (no HTTPS / permission denied). Country-biased to Egypt.
 *
 * NOTE: Nominatim's public endpoint is rate-limited (~1 req/s) and meant for low
 * volume. For production traffic, point this at a self-hosted Nominatim/Photon
 * (the OSRM box can host one) or a paid geocoder. */
function MapSearch({ onPick }: { onPick: (p: LatLng) => void }) {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 3) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      acRef.current?.abort();
      const ac = new AbortController();
      acRef.current = ac;
      try {
        const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
        const url =
          "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=eg" +
          `&accept-language=${encodeURIComponent(lang)}&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { signal: ac.signal });
        const data: unknown = await res.json();
        const items = (Array.isArray(data) ? data : [])
          .map((d: { display_name?: string; lat?: string; lon?: string }) => ({
            label: d.display_name ?? "",
            lat: Number(d.lat),
            lng: Number(d.lon),
          }))
          .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng));
        setResults(items);
        setOpen(true);
      } catch {
        /* aborted or network error — keep the map usable */
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [q, i18n.resolvedLanguage, i18n.language]);

  const pick = (r: { label: string; lat: number; lng: number }) => {
    onPick({ lat: r.lat, lng: r.lng });
    setQ(r.label.split(",").slice(0, 2).join(", ").trim());
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="absolute inset-x-2 top-2 z-[1000]">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          enterKeyHint="search"
          placeholder={t("order.location.searchPlaceholder")}
          className="h-10 rounded-full border-border/70 bg-background/95 ps-9 pe-9 shadow-lg backdrop-blur"
        />
        {loading ? (
          <Loader2 className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          q.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setResults([]);
                setOpen(false);
              }}
              aria-label={t("common.clear")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="mt-1.5 max-h-56 overflow-auto rounded-xl border border-border/70 bg-background/95 shadow-xl backdrop-blur">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="flex w-full items-start gap-2 px-3 py-2 text-start text-sm hover:bg-muted"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span className="line-clamp-2">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface DeliveryMapProps {
  /** The chosen delivery point, or null until the customer sets one. */
  point: LatLng | null;
  /** Where to centre the view before a point is chosen (e.g. a city default). */
  fallbackCenter: LatLng;
  onChange: (p: LatLng) => void;
  onLocate: () => void;
  locating: boolean;
}

/**
 * The delivery-point picker. CARTO Voyager basemap, an address search, a
 * draggable + tap-to-move brand pin, and a floating locate control. The map is
 * always shown (even before/without geolocation) so the customer can search or
 * tap to set their spot. The picked lat/lng is authoritative.
 */
export function DeliveryMap({ point, fallbackCenter, onChange, onLocate, locating }: DeliveryMapProps) {
  const view = point ?? fallbackCenter;
  const center = useMemo<[number, number]>(() => [view.lat, view.lng], [view.lat, view.lng]);
  const markerRef = useRef<L.Marker | null>(null);
  const { t } = useTranslation();

  return (
    <div className="po-map relative h-64 w-full overflow-hidden rounded-2xl border border-border/70 shadow-sm">
      <MapContainer
        center={center}
        zoom={point ? 16 : 12}
        scrollWheelZoom
        zoomControl={false}
        attributionControl
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          attribution={t("order.location.attribution")}
        />
        <Recenter point={view} />
        <TapToMove onChange={onChange} />
        {point && (
          <Marker
            ref={markerRef}
            position={[point.lat, point.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend() {
                const m = markerRef.current;
                if (!m) return;
                const ll = m.getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>
      <MapSearch onPick={onChange} />
      <LocateControl onLocate={onLocate} busy={locating} />
    </div>
  );
}
