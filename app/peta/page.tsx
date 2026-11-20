"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import type { Basemap, OverlayKey } from "../components/leaflet-map";
import Map3D from "../components/map-3d";
import { LegendaPeta } from "../components/legenda";
import { SelectAnimasi } from "../components/select";
import { Header, Icon } from "../components/ui";
import { districts, kelurahanData } from "../data";
import { SIMBOL_FASKES, SIMBOL_SEKOLAH } from "../lib/simbol";
import {
  classes,
  classify,
  dimensionKeys,
  fmt,
  slugify,
  themes,
  type KelurahanProps,
  type ThemeKey,
} from "../lib/livability";

const LeafletMap = dynamic(() => import("../components/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="map-canvas map-status-box" role="status" aria-live="polite">
      <p>Memuat kanvas peta Kota Bogor...</p>
    </div>
  ),
});

// Grup yang punya judul tampil sebagai dropdown; sisanya jadi baris biasa.
// Item fasilitas memakai warna dari lib/simbol supaya seragam dengan titik di peta.
const OVERLAY_GROUPS: {
  judul?: string;
  items: { key: OverlayKey; label: string; symbol?: string; warna?: string }[];
}[] = [
  {
    items: [
      { key: "labels", label: "Nama dan Batas Kelurahan", symbol: "symbol-0" },
      { key: "kecamatan", label: "Nama dan Batas Kecamatan", symbol: "symbol-0" },
      { key: "jalan", label: "Jaringan Jalan", symbol: "symbol-jalan" },
    ],
  },
  {
    judul: "Fasilitas Kesehatan",
    items: [
      { key: "rs", label: SIMBOL_FASKES.rs.label, warna: SIMBOL_FASKES.rs.warna },
      { key: "puskesmas", label: SIMBOL_FASKES.puskesmas.label, warna: SIMBOL_FASKES.puskesmas.warna },
      { key: "klinik", label: SIMBOL_FASKES.klinik.label, warna: SIMBOL_FASKES.klinik.warna },
    ],
  },
  {
    judul: "Fasilitas Pendidikan",
    items: [
      { key: "sd", label: SIMBOL_SEKOLAH.sd.label, warna: SIMBOL_SEKOLAH.sd.warna },
      { key: "smp", label: SIMBOL_SEKOLAH.smp.label, warna: SIMBOL_SEKOLAH.smp.warna },
      { key: "sma_smk", label: SIMBOL_SEKOLAH.sma_smk.label, warna: SIMBOL_SEKOLAH.sma_smk.warna },
    ],
  },
];

export default function MapPage() {
  const [panel, setPanel] = useState<"layers" | "filters">("layers");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [theme, setTheme] = useState<ThemeKey>("skor_livable");
  const [basemap, setBasemap] = useState<Basemap>("light");
  const [fillOpacity, setFillOpacity] = useState(0.75);
  const [overlays, setOverlays] = useState<Record<OverlayKey, boolean>>({
    labels: false,
    kecamatan: true,
    rs: false,
    puskesmas: false,
    klinik: false,
    sd: false,
    smp: false,
    sma_smk: false,
    jalan: false,
  });

  const [geoData, setGeoData] = useState<FeatureCollection<
    Geometry,
    KelurahanProps
  > | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  // Petunjuk memudar 5 detik setelah kanvas peta benar-benar terbentuk, bukan
  // setelah geojson tiba: menggambar 68 poligon masih makan belasan detik lagi,
  // dan petunjuknya jadi hilang sebelum petanya kelihatan.
  const [petunjuk, setPetunjuk] = useState<"tampil" | "pudar" | "hilang">("tampil");
  const [petaSiap, setPetaSiap] = useState(false);
  const [selectedKode, setSelectedKode] = useState<string | null>(null);

  // Dibaca dari window, bukan useSearchParams, supaya halaman ini tidak perlu
  // dibungkus Suspense hanya demi satu parameter.
  useEffect(() => {
    const kel = new URLSearchParams(window.location.search).get("kel");
    if (!kel) return;
    const target = kelurahanData.find((k) => slugify(k.kelurahan) === kel);
    if (target) setSelectedKode(target.kode);
  }, []);

  // Pencarian & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState("Semua kecamatan");
  const [filterKelurahan, setFilterKelurahan] = useState("Semua kelurahan");
  const [filterKelas, setFilterKelas] = useState("Semua klasifikasi");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const loadGeoData = useCallback(() => {
    setGeoLoading(true);
    setGeoError(null);
    fetch("/data/kelurahan.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Gagal memuat kelurahan.geojson (${res.status})`);
        }
        return res.json();
      })
      .then((fc: FeatureCollection<Geometry, KelurahanProps>) => {
        setGeoData(fc);
        setGeoLoading(false);
      })
      .catch((err: unknown) => {
        setGeoError(
          err instanceof Error
            ? err.message
            : "Tidak dapat memuat data geometri peta."
        );
        setGeoLoading(false);
      });
  }, []);

  useEffect(() => {
    loadGeoData();
  }, [loadGeoData]);

  // Mode 3D tidak memakai LeafletMap, jadi tidak ada onSiap yang memanggil.
  useEffect(() => {
    if (viewMode === "3d" && !geoLoading && geoData) setPetaSiap(true);
  }, [viewMode, geoLoading, geoData]);

  useEffect(() => {
    if (!petaSiap) return;
    const mulaiPudar = setTimeout(() => setPetunjuk("pudar"), 4000);
    const lepas = setTimeout(() => setPetunjuk("hilang"), 5000);
    return () => {
      clearTimeout(mulaiPudar);
      clearTimeout(lepas);
    };
  }, [petaSiap]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const mobileLandscape = window.matchMedia(
          "(max-width: 1000px) and (max-height: 600px) and (orientation: landscape)"
        ).matches;
        (mobileLandscape
          ? mobileSearchInputRef.current
          : searchInputRef.current
        )?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return kelurahanData
      .filter(
        (k) =>
          k.kelurahan.toLowerCase().includes(q) ||
          k.kecamatan.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery]);

  const kelurahanOptions = useMemo(() => {
    if (filterKecamatan === "Semua kecamatan") return kelurahanData;
    return kelurahanData.filter((k) => k.kecamatan === filterKecamatan);
  }, [filterKecamatan]);

  const visibleKodes = useMemo(() => {
    const hasFilter =
      filterKecamatan !== "Semua kecamatan" ||
      filterKelurahan !== "Semua kelurahan" ||
      filterKelas !== "Semua klasifikasi";
    if (!hasFilter) return null;

    const matched = kelurahanData.filter((k) => {
      if (
        filterKecamatan !== "Semua kecamatan" &&
        k.kecamatan !== filterKecamatan
      )
        return false;
      if (
        filterKelurahan !== "Semua kelurahan" &&
        k.kelurahan !== filterKelurahan
      )
        return false;
      if (
        filterKelas !== "Semua klasifikasi" &&
        classify(k[theme]).label !== filterKelas
      )
        return false;
      return true;
    });
    return new Set(matched.map((k) => k.kode));
  }, [filterKecamatan, filterKelurahan, filterKelas, theme]);

  const selectedPlace = useMemo(
    () => kelurahanData.find((k) => k.kode === selectedKode) ?? null,
    [selectedKode]
  );

  const currentTheme = themes.find((t) => t.key === theme) ?? themes[0];

  const toggleOverlay = (key: OverlayKey) =>
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));

  const setGrupAktif = (keys: OverlayKey[], nilai: boolean) =>
    setOverlays((prev) => ({
      ...prev,
      ...Object.fromEntries(keys.map((k) => [k, nilai])),
    }));

  const switchBasemap = (next: Basemap) => {
    setBasemap(next);
    if (next === "satellite" && fillOpacity > 0.65) {
      setFillOpacity(0.55);
    } else if (next === "light" && fillOpacity < 0.6) {
      setFillOpacity(0.75);
    }
  };

  const resetFilters = () => {
    setFilterKecamatan("Semua kecamatan");
    setFilterKelurahan("Semua kelurahan");
    setFilterKelas("Semua klasifikasi");
    setSearchQuery("");
  };

  const applyFilterSelection = () => {
    if (filterKelurahan !== "Semua kelurahan") {
      const target = kelurahanData.find((k) => k.kelurahan === filterKelurahan);
      if (target) setSelectedKode(target.kode);
    } else if (visibleKodes && visibleKodes.size > 0) {
      const firstKode = Array.from(visibleKodes)[0];
      setSelectedKode(firstKode);
    }
  };

  return (
    <div className="map-page">
      <Header />
      <main className="map-workspace">
        <div className="map-mobile-tools">
          <button
            type="button"
            className="map-sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka layer dan filter"
            aria-expanded={sidebarOpen}
            aria-controls="map-control-drawer"
          >
            <Icon name="menu" />
          </button>
          <div className="map-mobile-search-wrap">
            <div className="map-mobile-search">
              <Icon name="search" />
              <input
                ref={mobileSearchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari kecamatan atau kelurahan"
                placeholder="Cari Kelurahan / Kecamatan"
              />
            </div>
            {searchQuery.trim().length > 0 && (
              <div className="search-results" role="region" aria-label="Hasil pencarian">
                {searchMatches.length > 0 ? (
                  searchMatches.map((m) => (
                    <button
                      key={m.kode}
                      type="button"
                      onClick={() => {
                        setSelectedKode(m.kode);
                        setSearchQuery("");
                      }}
                    >
                      <div>
                        <b>{m.kelurahan}</b>
                        <small>
                          {m.kecamatan} · #{m.peringkat}
                        </small>
                      </div>
                      <strong>{fmt(m[theme])}</strong>
                    </button>
                  ))
                ) : (
                  <div className="search-empty">
                    Tidak ada kelurahan yang cocok dengan &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`map-sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup layer dan filter"
        />

        <aside
          id="map-control-drawer"
          className={`map-sidebar ${sidebarOpen ? "mobile-open" : ""}`}
          aria-label="Kontrol peta dan filter"
        >
          <button
            type="button"
            className="map-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup layer dan filter"
          >
            <Icon name="close" />
          </button>
          <div className="map-search">
            <Icon name="search" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari kecamatan atau kelurahan"
              placeholder="Cari Kelurahan / Kecamatan"
            />
          </div>
          {searchQuery.trim().length > 0 && (
            <div className="search-results" role="region" aria-label="Hasil pencarian">
              {searchMatches.length > 0 ? (
                searchMatches.map((m) => (
                  <button
                    key={m.kode}
                    type="button"
                    onClick={() => {
                      setSelectedKode(m.kode);
                      setSearchQuery("");
                    }}
                  >
                    <div>
                      <b>{m.kelurahan}</b>
                      <small>
                        {m.kecamatan} · #{m.peringkat}
                      </small>
                    </div>
                    <strong>{fmt(m[theme])}</strong>
                  </button>
                ))
              ) : (
                <div className="search-empty">
                  Tidak ada kelurahan yang cocok dengan &ldquo;{searchQuery}
                  &rdquo;.
                </div>
              )}
            </div>
          )}

          <div className="map-tabs" role="tablist" aria-label="Mode panel">
            <button
              type="button"
              role="tab"
              aria-selected={panel === "layers"}
              className={panel === "layers" ? "active" : ""}
              onClick={() => setPanel("layers")}
            >
              <Icon name="layers" />
              Layer
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panel === "filters"}
              className={panel === "filters" ? "active" : ""}
              onClick={() => setPanel("filters")}
            >
              <Icon name="sliders" />
              Filter
            </button>
          </div>

          {panel === "layers" ? (
            <div className="layer-list">
              <label className="control-label" htmlFor="theme-select">
                Peta tematik
              </label>
              <SelectAnimasi
                id="theme-select"
                label="Peta tematik"
                value={theme}
                options={themes.map((t) => ({ value: t.key, label: t.label }))}
                onChange={(v) => setTheme(v as ThemeKey)}
              />

              <label className="opacity-row">
                <span>Transparansi poligon</span>
                <strong>{Math.round(fillOpacity * 100)}%</strong>
                <input
                  type="range"
                  min={15}
                  max={100}
                  aria-label="Transparansi poligon"
                  value={Math.round(fillOpacity * 100)}
                  onChange={(e) =>
                    setFillOpacity(Number(e.target.value) / 100)
                  }
                />
              </label>

              <p className="control-label">Layer &amp; label daerah</p>
              {OVERLAY_GROUPS.map((grup) => {
                const baris = grup.items.map((item) => (
                  <label className="toggle-row" key={item.key}>
                    <span>
                      <i
                        className={`layer-symbol ${item.symbol ?? ""}`}
                        style={item.warna ? { background: item.warna } : undefined}
                      />
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={overlays[item.key]}
                      onChange={() => toggleOverlay(item.key)}
                    />
                    <b />
                  </label>
                ));
                if (!grup.judul) return baris;
                const kunci = grup.items.map((i) => i.key);
                const semuaAktif = kunci.every((k) => overlays[k]);
                return (
                  <div className="layer-group-wrap" key={grup.judul}>
                    <details className="layer-group">
                      <summary>
                        <span>{grup.judul}</span>
                      </summary>
                      {baris}
                    </details>
                    {/* Di luar <details> supaya tetap tampil saat tertutup, dan
                        di luar <summary> supaya kliknya tidak membuka dropdown. */}
                    <label className="toggle-row group-toggle">
                      <input
                        type="checkbox"
                        aria-label={`Tampilkan semua ${grup.judul}`}
                        checked={semuaAktif}
                        onChange={() => setGrupAktif(kunci, !semuaAktif)}
                      />
                      <b />
                    </label>
                  </div>
                );
              })}

              <p className="control-label">Mode peta dasar (2D)</p>
              <div className="basemap-grid">
                <button
                  type="button"
                  className={
                    basemap === "light" && viewMode === "2d" ? "active" : ""
                  }
                  onClick={() => {
                    setViewMode("2d");
                    switchBasemap("light");
                  }}
                >
                  <span className="base-light" />
                  Terang
                </button>
                <button
                  type="button"
                  className={
                    basemap === "satellite" && viewMode === "2d" ? "active" : ""
                  }
                  onClick={() => {
                    setViewMode("2d");
                    switchBasemap("satellite");
                  }}
                >
                  <span className="base-satellite" />
                  Satelit
                </button>
                <button
                  type="button"
                  className={
                    basemap === "osm" && viewMode === "2d" ? "active" : ""
                  }
                  onClick={() => {
                    setViewMode("2d");
                    switchBasemap("osm");
                  }}
                >
                  <span className="base-osm" />
                  OpenStreetMap
                </button>
              </div>
            </div>
          ) : (
            <div className="filter-panel">
              <div className="filter-field">
                <span>Kecamatan</span>
                <SelectAnimasi
                  label="Kecamatan"
                  value={filterKecamatan}
                  options={[
                    { value: "Semua kecamatan", label: "Semua kecamatan" },
                    ...districts.map((d) => ({ value: d.name, label: `${d.name} (${d.villages})` })),
                  ]}
                  onChange={(v) => {
                    setFilterKecamatan(v);
                    setFilterKelurahan("Semua kelurahan");
                  }}
                />
              </div>

              <div className="filter-field">
                <span>Kelurahan</span>
                <SelectAnimasi
                  label="Kelurahan"
                  value={filterKelurahan}
                  options={[
                    { value: "Semua kelurahan", label: "Semua kelurahan" },
                    ...kelurahanOptions.map((k) => ({ value: k.kelurahan, label: k.kelurahan })),
                  ]}
                  onChange={setFilterKelurahan}
                />
              </div>

              <div className="filter-field">
                <span>Klasifikasi</span>
                <SelectAnimasi
                  label="Klasifikasi"
                  value={filterKelas}
                  options={[
                    { value: "Semua klasifikasi", label: "Semua klasifikasi" },
                    ...classes.map((c) => ({ value: c.label, label: c.label })),
                  ]}
                  onChange={setFilterKelas}
                />
              </div>

              <button
                type="button"
                className="button full"
                onClick={applyFilterSelection}
              >
                Terapkan filter
              </button>
              <button
                type="button"
                className="reset-button"
                onClick={resetFilters}
              >
                Reset semua filter
              </button>
            </div>
          )}
        </aside>

        <section className="interactive-map" aria-label="Peta interaktif Kota Bogor">
          {geoError ? (
            <div className="map-canvas map-status-box" role="alert">
              <p>
                <b>Gagal memuat geometri peta.</b> {geoError}
              </p>
              <button
                type="button"
                className="button button-small"
                onClick={loadGeoData}
              >
                Coba muat ulang
              </button>
            </div>
          ) : geoLoading || !geoData ? (
            <div
              className="map-canvas map-status-box"
              role="status"
              aria-live="polite"
            >
              <p>Memuat geometri 68 kelurahan Kota Bogor...</p>
            </div>
          ) : viewMode === "3d" ? (
            <Map3D
              data={geoData}
              theme={theme}
              selectedKode={selectedKode}
              visibleKodes={visibleKodes}
              showLabels={overlays.labels}
              onSelect={setSelectedKode}
            />
          ) : (
            <LeafletMap
              data={geoData}
              theme={theme}
              overlays={overlays}
              basemap={basemap}
              fillOpacity={fillOpacity}
              selectedKode={selectedKode}
              visibleKodes={visibleKodes}
              onSelect={setSelectedKode}
              onSiap={() => setPetaSiap(true)}
            />
          )}

          {visibleKodes && visibleKodes.size === 0 && (
            <div className="map-empty-filter" role="status">
              <span>Tidak ada kelurahan yang cocok dengan kombinasi filter.</span>
              <button type="button" onClick={resetFilters}>
                Reset filter
              </button>
            </div>
          )}

          <div className="map-topbar">
            <span>
              <Icon name="map" size={16} />
              {currentTheme.label}
            </span>

            <div className="mode-switch" role="group" aria-label="Mode tampilan peta">
              <button
                type="button"
                className={viewMode === "2d" ? "active" : ""}
                onClick={() => setViewMode("2d")}
              >
                2D Peta
              </button>
              <button
                type="button"
                className={viewMode === "3d" ? "active" : ""}
                onClick={() => setViewMode("3d")}
              >
                3D Ekstrusi
              </button>
            </div>
          </div>

          <LegendaPeta />
          {petunjuk !== "hilang" && (
            <div className={petunjuk === "pudar" ? "map-hint pudar" : "map-hint"}>
              {viewMode === "3d"
                ? "Geser untuk memutar 3D · Scroll untuk zoom · Klik balok kelurahan untuk detail"
                : "Klik poligon atau nama kelurahan pada peta untuk melihat detail"}
            </div>
          )}
        </section>

        {selectedPlace && (
          <aside className="place-panel" aria-label="Detail kelurahan terpilih">
            <div className="place-cover">
              <div>
                <p className="eyebrow">Kelurahan terpilih</p>
                <h1>{selectedPlace.kelurahan}</h1>
                <span>{selectedPlace.kecamatan}</span>
              </div>
              <div className="place-cover-kanan">
                <button
                  type="button"
                  className="panel-close"
                  onClick={() => setSelectedKode(null)}
                  aria-label="Tutup panel detail kelurahan"
                >
                  <Icon name="close" size={15} />
                </button>
                <b>#{selectedPlace.peringkat}</b>
              </div>
            </div>
            <div className="place-content">
              <div className="score-lockup">
                <strong>{fmt(selectedPlace[theme])}</strong>
                <span>
                  <b>{classify(selectedPlace[theme]).label}</b>
                  <small>
                    Peringkat {selectedPlace.peringkat} dari 68 kelurahan
                  </small>
                </span>
              </div>

              <div className="mini-dimensions">
                {dimensionKeys.map((d) => {
                  const val = selectedPlace[d.key];
                  return (
                    <div key={d.key}>
                      <span>{d.label}</span>
                      <i>
                        <b
                          style={{
                            width: `${Math.max(2, val * 100)}%`,
                            background: d.color,
                          }}
                        />
                      </i>
                      <strong>{fmt(val)}</strong>
                    </div>
                  );
                })}
              </div>

              <div className="place-facts">
                <div>
                  <span>Populasi</span>
                  <b>{selectedPlace.penduduk.toLocaleString("id-ID")} jiwa</b>
                </div>
                <div>
                  <span>Luas</span>
                  <b>{fmt(selectedPlace.luas_km2)} km²</b>
                </div>
                <div>
                  <span>Kepadatan</span>
                  <b>
                    {Math.round(
                      selectedPlace.kepadatan_jiwa_km2
                    ).toLocaleString("id-ID")}{" "}
                    jiwa/km²
                  </b>
                </div>
                <div>
                  <span>Cakupan faskes</span>
                  <b>{fmt(selectedPlace.cakupan_faskes_pct, 1)}%</b>
                </div>
              </div>

              <Link
                className="button full"
                href={`/wilayah/${slugify(selectedPlace.kelurahan)}`}
              >
                Lihat profil lengkap <Icon name="arrow" />
              </Link>
              <Link
                className="compare-add"
                href={`/perbandingan?a=${encodeURIComponent(
                  selectedPlace.kelurahan
                )}`}
              >
                <Icon name="compare" />
                Bandingkan kelurahan ini
              </Link>
            </div>
          </aside>
        )}
      </main>

      <div
        className="map-portrait-lock"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rotate-device-title"
      >
        <div>
          <span className="rotate-device-icon" aria-hidden="true">↻</span>
          <h1 id="rotate-device-title">Tolong rotate device</h1>
          <p>Halaman peta tersedia dalam orientasi horizontal.</p>
        </div>
      </div>
    </div>
  );
}
