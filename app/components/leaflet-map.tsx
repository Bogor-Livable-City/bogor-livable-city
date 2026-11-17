"use client";

// WBS 1.5.1 + 1.5.2 + 1.5.3: Map engine Leaflet, basemap switcher (4 mode),
// label nama daerah (68 kelurahan & 6 kecamatan), dan choropleth 5 kelas.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { classify, fmt, type KelurahanProps, type ThemeKey } from "../lib/livability";
import { badgeHtml, SIMBOL_FASKES, SIMBOL_SEKOLAH, UKURAN_PETA, type SimbolTitik } from "../lib/simbol";

export type OverlayKey =
  | "labels"
  | "kecamatan"
  | "rs"
  | "puskesmas"
  | "klinik"
  | "sd"
  | "smp"
  | "sma_smk"
  | "jalan";
export type Basemap = "light" | "satellite" | "osm" | "topo";

// Leaflet tidak menyediakan jalan resmi ke elemen SVG-nya, padahal animasi
// garis putus-putus saat hover hanya bisa dipasang lewat kelas CSS di situ.
function jalurSvg(l: L.Path): SVGPathElement | undefined {
  return (l as L.Path & { _path?: SVGPathElement })._path;
}

type Props = {
  data: FeatureCollection<Geometry, KelurahanProps>;
  theme: ThemeKey;
  overlays: Record<OverlayKey, boolean>;
  basemap: Basemap;
  fillOpacity: number;
  selectedKode: string | null;
  visibleKodes: Set<string> | null; // null = semua tampil
  onSelect: (kode: string | null) => void;
  onSiap?: () => void; // dipanggil sekali setelah kanvas peta benar-benar terbentuk
};

const BASEMAPS: Record<
  Basemap,
  { url: string; labelUrl?: string; attribution: string; maxZoom: number; maxNativeZoom?: number }
> = {
  // CARTO menutup basemap gratisnya; tile-nya sekarang dibalas gambar "API key required".
  light: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labelUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
    maxZoom: 19,
    maxNativeZoom: 16, // Esri Light Gray berhenti di level 16, selebihnya tile diperbesar
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labelUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
};


const ROAD_WEIGHT: Record<string, number> = {
  "Jalan Tol Dua Jalur Dengan Pemisah Fisik": 3.2,
  "Jalan Arteri": 2.8,
  "Jalan Kolektor": 2.2,
  "Jalan Lokal": 0.9,
  "Jalan Lain": 0.6,
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Hitung titik pusat poligon terbesar agar label nama daerah jatuh pas di tengah wilayah
function featureCenterLatLng(geom: Geometry): [number, number] {
  const rings: Position[][] =
    geom.type === "Polygon"
      ? [geom.coordinates[0]]
      : geom.type === "MultiPolygon"
      ? geom.coordinates.map((p) => p[0])
      : [];

  let bestLat = -6.597;
  let bestLon = 106.799;
  let bestArea = -1;

  for (const ring of rings) {
    let area = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x0, y0] = ring[j];
      const [x1, y1] = ring[i];
      const f = x0 * y1 - x1 * y0;
      area += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }
    const absA = Math.abs(area) * 0.5;
    if (absA > bestArea && Math.abs(area) > 1e-11) {
      bestArea = absA;
      bestLon = cx / (3 * area);
      bestLat = cy / (3 * area);
    }
  }
  return [bestLat, bestLon];
}

export default function LeafletMap({
  data,
  theme,
  overlays,
  basemap,
  fillOpacity,
  selectedKode,
  visibleKodes,
  onSelect,
  onSiap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.LayerGroup | null>(null);
  const choroplethRef = useRef<L.GeoJSON<KelurahanProps> | null>(null);
  const labelGroupRef = useRef<L.LayerGroup | null>(null);
  const overlayRefs = useRef<Partial<Record<OverlayKey, L.Layer>>>({});
  const overlayLoading = useRef<Partial<Record<OverlayKey, Promise<L.Layer>>>>({});

  const state = useRef({ theme, fillOpacity, selectedKode, visibleKodes, onSelect, onSiap });
  state.current = { theme, fillOpacity, selectedKode, visibleKodes, onSelect, onSiap };

  const stateOverlays = useRef(overlays);
  stateOverlays.current = overlays;

  // ---- Inisialisasi peta (sekali) ------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, minZoom: 11, preferCanvas: false });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ position: "bottomright", imperial: false }).addTo(map);

    map.createPane("choropleth").style.zIndex = "400";
    map.createPane("jalan").style.zIndex = "420";
    map.createPane("batas").style.zIndex = "430";
    map.createPane("regionLabels").style.zIndex = "450";
    // Titik fasilitas di atas segalanya; sebelumnya ikut overlayPane bawaan (400)
    // dan tertimbun poligon choropleth yang panenya dibuat belakangan.
    map.createPane("titik").style.zIndex = "470";
    map.getPane("jalan")!.style.pointerEvents = "none";
    map.getPane("batas")!.style.pointerEvents = "none";

    const styleFor = (f?: Feature<Geometry, KelurahanProps>): L.PathOptions => {
      if (!f) return {};
      const { theme, fillOpacity, selectedKode, visibleKodes } = state.current;
      const p = f.properties;
      const selected = p.kode === selectedKode;
      const visible = !visibleKodes || visibleKodes.has(p.kode);
      return {
        pane: "choropleth",
        fillColor: classify(p[theme]).color,
        fillOpacity: visible ? fillOpacity : 0.1,
        color: selected ? "#173b38" : "#ffffff",
        weight: selected ? 3 : 1.1,
        opacity: visible ? 1 : 0.35,
      };
    };

    const choropleth = L.geoJSON<KelurahanProps>(data, {
      style: styleFor as L.StyleFunction<KelurahanProps>,
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(
          () => {
            const score = p[state.current.theme];
            return `<b>${escapeHtml(p.kelurahan)}</b><br/><span>${escapeHtml(p.kecamatan)} · #${p.peringkat}</span><br/>Skor ${fmt(score)} · ${classify(score).label}`;
          },
          { sticky: true, direction: "top", className: "rb-tooltip" }
        );
        layer.on({
          mouseover: (e) => {
            const l = e.target as L.Path;
            if (p.kode === state.current.selectedKode) return;
            l.setStyle({ weight: 2.6, color: "#173b38", dashArray: "7 5" });
            // Tetangga menimpa separuh garis batas kalau urutannya tidak diangkat.
            l.bringToFront();
            jalurSvg(l)?.classList.add("batas-hover");
          },
          mouseout: (e) => {
            const l = e.target as L.Path;
            jalurSvg(l)?.classList.remove("batas-hover");
            choropleth.resetStyle(l);
          },
          click: () => state.current.onSelect(p.kode),
        });
      },
    }).addTo(map);

    choroplethRef.current = choropleth;
    labelGroupRef.current = L.layerGroup([], { pane: "regionLabels" });
    map.fitBounds(choropleth.getBounds(), { padding: [20, 20] });
    map.setMaxBounds(choropleth.getBounds().pad(0.6));
    mapRef.current = map;
    state.current.onSiap?.();

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      choroplethRef.current = null;
      baseLayerRef.current = null;
      labelGroupRef.current = null;
      overlayRefs.current = {};
      overlayLoading.current = {};
    };
  }, [data]);

  // ---- Basemap switcher (Terang / Satelit / Jalan OSM / Topografi) ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    baseLayerRef.current?.remove();
    const cfg = BASEMAPS[basemap];
    const group = L.layerGroup();
    L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      maxNativeZoom: cfg.maxNativeZoom,
      subdomains: "abcd",
    }).addTo(group);
    if (cfg.labelUrl) {
      L.tileLayer(cfg.labelUrl, {
        maxZoom: cfg.maxZoom,
        maxNativeZoom: cfg.maxNativeZoom,
        subdomains: "abcd",
        opacity: 0.85,
      }).addTo(group);
    }
    group.addTo(map);
    baseLayerRef.current = group;
  }, [basemap, data]);

  // ---- Restyle choropleth saat tema / transparansi / filter / seleksi berubah
  useEffect(() => {
    const layer = choroplethRef.current;
    if (!layer) return;
    layer.eachLayer((l) => layer.resetStyle(l as L.Path));
    if (selectedKode) {
      layer.eachLayer((l) => {
        const gl = l as L.Polygon & { feature?: Feature<Geometry, KelurahanProps> };
        if (gl.feature?.properties.kode === selectedKode) gl.bringToFront();
      });
    }
  }, [theme, fillOpacity, visibleKodes, selectedKode]);

  // ---- Render label nama 68 kelurahan di atas poligon ----------------------
  useEffect(() => {
    const map = mapRef.current;
    const labelGroup = labelGroupRef.current;
    if (!map || !labelGroup) return;

    labelGroup.clearLayers();
    if (!overlays.labels) {
      map.removeLayer(labelGroup);
      return;
    }

    // Garis batas kelurahan ikut tombol yang sama dengan namanya, seperti kecamatan.
    L.geoJSON(data, {
      pane: "batas",
      interactive: false,
      filter: (f) => !visibleKodes || visibleKodes.has(f.properties.kode),
      style: { color: "#2f6f66", weight: 1, fill: false, opacity: 0.7 },
    }).addTo(labelGroup);

    for (const f of data.features) {
      const p = f.properties;
      if (visibleKodes && !visibleKodes.has(p.kode)) continue;
      const [lat, lon] = featureCenterLatLng(f.geometry);
      const isSelected = p.kode === selectedKode;
      const score = fmt(p[theme]);

      const marker = L.marker([lat, lon], {
        pane: "regionLabels",
        icon: L.divIcon({
          className: `kel-label ${isSelected ? "kel-label-active" : ""}`,
          html: `<span><b>${escapeHtml(p.kelurahan)}</b><small>${score}</small></span>`,
          iconSize: [0, 0],
        }),
      });
      marker.on("click", () => state.current.onSelect(p.kode));
      marker.addTo(labelGroup);
    }

    labelGroup.addTo(map);
  }, [data, overlays.labels, theme, selectedKode, visibleKodes]);

  // ---- Fly-to wilayah terpilih ---------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const layer = choroplethRef.current;
    if (!map || !layer || !selectedKode) return;
    layer.eachLayer((l) => {
      const gl = l as L.Polygon & { feature?: Feature<Geometry, KelurahanProps> };
      if (gl.feature?.properties.kode === selectedKode) {
        map.flyToBounds(gl.getBounds(), { padding: [60, 60], maxZoom: 15, duration: 0.8 });
      }
    });
  }, [selectedKode]);

  // ---- Fit ke wilayah hasil filter -------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const layer = choroplethRef.current;
    if (!map || !layer || !visibleKodes || visibleKodes.size === 0) return;
    const bounds = L.latLngBounds([]);
    layer.eachLayer((l) => {
      const gl = l as L.Polygon & { feature?: Feature<Geometry, KelurahanProps> };
      if (gl.feature && visibleKodes.has(gl.feature.properties.kode)) bounds.extend(gl.getBounds());
    });
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
  }, [visibleKodes]);

  // ---- Layer pendukung (faskes, jangkauan, sekolah, jalan, kecamatan) ------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (["rs", "puskesmas", "klinik", "sd", "smp", "sma_smk", "jalan", "kecamatan"] as OverlayKey[]).forEach(async (key) => {
      const existing = overlayRefs.current[key];
      if (!overlays[key]) {
        if (existing) map.removeLayer(existing);
        return;
      }
      if (existing) {
        existing.addTo(map);
        return;
      }
      overlayLoading.current[key] ??= buildOverlay(key);
      const layer = await overlayLoading.current[key]!;
      overlayRefs.current[key] = layer;
      if (mapRef.current === map && stateOverlays.current[key]) layer.addTo(map);
    });
  }, [overlays, data]);

  return <div ref={containerRef} className="leaflet-host" aria-label="Peta interaktif kelayakhunian Kota Bogor" />;
}

async function fetchJson(name: string) {
  const res = await fetch(`/data/${name}.geojson`);
  if (!res.ok) throw new Error(`Gagal memuat ${name}`);
  return res.json() as Promise<FeatureCollection>;
}

// Tidak semua titik koordinatnya hasil survei. Kolom `kualitas` dibawa dari gpkg
// (lihat gis/sql/sekolah.sql), dan pembaca perlu tahu titik mana yang letaknya
// cuma perkiraan supaya tidak menganggap semuanya sama telitinya.
const CATATAN_LETAK: Record<string, string> = {
  meragukan: "Letak perkiraan, hasil geocode",
  fallback: "Letak perkiraan dari kelurahan",
};

function catatanLetak(kualitas?: string) {
  const teks = CATATAN_LETAK[kualitas ?? ""];
  return teks ? `<br/><small>${teks}</small>` : "";
}

// Satu titik fasilitas = badge ikon di pane "titik", dengan ringkasan saat
// disorot dan rincian saat diklik.
function layerTitik(
  fc: FeatureCollection,
  jenis: string,
  s: SimbolTitik,
  tambahan: (p: Record<string, unknown>) => string
) {
  const ikon = L.divIcon({
    className: "titik-ikon",
    html: badgeHtml(s),
    iconSize: [UKURAN_PETA, UKURAN_PETA],
    iconAnchor: [UKURAN_PETA / 2, UKURAN_PETA / 2],
  });
  return L.geoJSON(fc, {
    filter: (f) => f.properties?.jenis === jenis,
    pointToLayer: (_f, latlng) => L.marker(latlng, { icon: ikon, pane: "titik", riseOnHover: true }),
    onEachFeature: (f, layer) => {
      const p = (f.properties ?? {}) as Record<string, unknown>;
      const nama = escapeHtml(String(p.nama ?? "-"));
      const tempat = `${escapeHtml(String(p.kelurahan ?? ""))}, ${escapeHtml(String(p.kecamatan ?? ""))}`;
      layer.bindTooltip(`<b>${nama}</b><br/><span>${s.label}</span><br/><span>${tempat}</span>`, {
        direction: "top",
        offset: [0, -UKURAN_PETA / 2],
        className: "rb-tooltip",
      });
      layer.bindPopup(
        `<b>${nama}</b><br/>${s.label}${tambahan(p)}<br/><small>${tempat}</small>${catatanLetak(p.kualitas as string)}`
      );
    },
  });
}

async function buildOverlay(key: OverlayKey): Promise<L.Layer> {
  switch (key) {
    case "labels":
      return L.layerGroup();
    case "rs":
    case "puskesmas":
    case "klinik":
      return layerTitik(await fetchJson("faskes"), key, SIMBOL_FASKES[key], (p) => "");
    case "sd":
    case "smp":
    case "sma_smk":
      return layerTitik(await fetchJson("sekolah"), key, SIMBOL_SEKOLAH[key], (p) =>
        p.npsn ? ` · NPSN ${escapeHtml(String(p.npsn))}` : ""
      );
    case "jalan": {
      const fc = await fetchJson("jalan");
      return L.geoJSON(fc, {
        pane: "jalan",
        // 10 dari 4.236 fitur bukan garis (Point, MultiPoint, GeometryCollection).
        // Tanpa saringan ini Leaflet menggambarnya sebagai marker default yang ikonnya
        // tidak termuat, jadi yang tampil teks "Marker" berserakan di peta.
        filter: (f) => (f.geometry?.type ?? "").includes("Line"),
        style: (f) => {
          const w = ROAD_WEIGHT[f?.properties?.kelas] ?? 0.6;
          return { color: w >= 2 ? "#8a5a3c" : "#6f6f6f", weight: w, opacity: w >= 2 ? 0.9 : 0.55 };
        },
      });
    }
    case "kecamatan": {
      const fc = await fetchJson("kecamatan");
      const group = L.layerGroup();
      L.geoJSON(fc, {
        pane: "batas",
        style: { color: "#173b38", weight: 2.2, fill: false, dashArray: "6 4" },
      }).addTo(group);

      // Tambahkan label nama 6 kecamatan
      for (const f of fc.features) {
        const kecName = f.properties?.kecamatan ?? "";
        const [lat, lon] = featureCenterLatLng(f.geometry);
        L.marker([lat, lon], {
          pane: "batas",
          interactive: false,
          icon: L.divIcon({
            className: "kec-label",
            html: `<span>${escapeHtml(kecName)}</span>`,
            iconSize: [0, 0],
          }),
        }).addTo(group);
      }
      return group;
    }
  }
}
