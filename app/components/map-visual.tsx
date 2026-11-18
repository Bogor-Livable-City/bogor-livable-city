"use client";

import { useRef, useState } from "react";
import { bogorSvgPaths } from "../lib/bogor-svg-paths";
import { kelurahanData } from "../kelurahan-data";
import { classes, scoreToColor, toSlug } from "../lib/livability";
import { usePinchZoom } from "../lib/pinch";


const kelurahanBySlug = new Map(
  kelurahanData.map((k) => [toSlug(k.kelurahan), k])
);

export type MapDimensionKey =
  | "livable"
  | "kesehatan"
  | "pendidikan"
  | "lingkungan"
  | "transportasi"
  | "ekonomi"
  | "sosial";

function getDimensionScore(
  slug: string,
  dimension: MapDimensionKey,
  customScores?: Record<string, number>
): number {
  if (customScores && slug in customScores) {
    return customScores[slug];
  }
  const k = kelurahanBySlug.get(slug);
  if (!k) return 0.5;
  switch (dimension) {
    case "kesehatan":
      return k.skor_kesehatan;
    case "pendidikan":
      return k.skor_pendidikan;
    case "lingkungan":
      return k.skor_lingkungan;
    case "transportasi":
      return k.skor_transportasi;
    case "ekonomi":
      return k.skor_ekonomi;
    case "sosial":
      return k.skor_sosial;
    default:
      return k.skor_livable;
  }
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 2.2;
const ZOOM_STEP = 1.3;

// Titik tengah tiap kecamatan dihitung dari rata-rata titik pusat kelurahannya,
// jadi labelnya ikut benar kalau geometri kelurahan berubah.
const pusatKecamatan = Object.entries(
  bogorSvgPaths.reduce<Record<string, { x: number; y: number; n: number }>>(
    (acc, p) => {
      const a = (acc[p.district] ??= { x: 0, y: 0, n: 0 });
      a.x += p.cx;
      a.y += p.cy;
      a.n += 1;
      return acc;
    },
    {}
  )
).map(([nama, a]) => ({ nama, x: a.x / a.n, y: a.y / a.n }));


export function BogorMap({
  compact = false,
  selected = true,
  selectedSlug = "pabaton",
  onSelect,
  dimension = "livable",
  customScores,
}: {
  compact?: boolean;
  selected?: boolean;
  selectedSlug?: string;
  onSelect?: (slug: string) => void;
  dimension?: MapDimensionKey;
  customScores?: Record<string, number>;
}) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [scale, setScale] = useState(ZOOM_MIN);
  const wadahRef = useRef<HTMLDivElement>(null);

  usePinchZoom(
    wadahRef,
    (rasio, awal) => setScale(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, awal * rasio))),
    () => scale
  );

  const activeSlug = hoveredSlug ?? (selected ? selectedSlug : null);
  const activeItem = activeSlug
    ? bogorSvgPaths.find((p) => p.slug === activeSlug)
    : null;
  const activeScore = activeSlug
    ? getDimensionScore(activeSlug, dimension, customScores)
    : null;

  return (
    <div
      className={`map-canvas ${compact ? "map-compact" : ""}`}
      ref={wadahRef}
      // pan-y supaya halaman tetap bisa digulir dengan satu jari di atas peta.
      style={{ touchAction: "pan-y" }}
    >
      <div className="map-paper" aria-hidden="true" />
      <svg
        className="bogor-shape"
        viewBox="0 0 260 260"
        role="group"
        aria-label="Peta choropleth 68 kelurahan Kota Bogor"
      >
        <defs>
          <filter
            id="bogor-drop-shadow"
            x="-12%"
            y="-12%"
            width="124%"
            height="124%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#0e3b34"
              floodOpacity=".14"
            />
          </filter>
        </defs>

        <g
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "130px 130px",
            transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Real 68 kelurahan polygons */}
          <g filter="url(#bogor-drop-shadow)">
            {bogorSvgPaths.map((item) => {
              const score = getDimensionScore(
                item.slug,
                dimension,
                customScores
              );
              const fill = scoreToColor(score);
              const isSelected = selected && item.slug === selectedSlug;
              const isHovered = item.slug === hoveredSlug;
              return (
                <path
                  key={item.kode}
                  d={item.d}
                  fill={fill}
                  stroke={isSelected || isHovered ? "#0b3f39" : "#f6f5ed"}
                  strokeWidth={isSelected || isHovered ? 2.1 : 0.85}
                  className={`bogor-kel-path ${
                    isSelected ? "map-selected" : ""
                  } ${isHovered ? "map-hovered" : ""}`}
                  tabIndex={onSelect ? 0 : undefined}
                  role={onSelect ? "button" : undefined}
                  aria-label={`${item.name}, ${item.district}, skor ${score
                    .toFixed(2)
                    .replace(".", ",")}`}
                  onMouseEnter={() => setHoveredSlug(item.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  onFocus={() => setHoveredSlug(item.slug)}
                  onBlur={() => setHoveredSlug(null)}
                  onClick={() => onSelect?.(item.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(item.slug);
                    }
                  }}
                />
              );
            })}
          </g>

          {/* Active kelurahan marker */}
          {activeItem && (
            <g
              className="map-active-beacon"
              transform={`translate(${activeItem.cx}, ${activeItem.cy})`}
              pointerEvents="none"
            >
              <circle r="8" className="beacon-pulse" />
              <circle r="3.5" fill="#fffefa" stroke="#0e5b53" strokeWidth="2" />
            </g>
          )}

          {/* Nama enam kecamatan */}
          {pusatKecamatan.map((k) => (
            <text
              key={k.nama}
              className="kec-label"
              x={k.x}
              y={k.y}
              textAnchor="middle"
              aria-hidden="true"
            >
              {k.nama}
            </text>
          ))}
        </g>
      </svg>

      {/* Live interactive floating badge when hovering/selecting */}
      {activeItem && activeScore !== null && (
        <div className="map-live-pill" aria-live="polite">
          <span
            className="map-live-dot"
            style={{ background: scoreToColor(activeScore) }}
          />
          <div>
            <b>{activeItem.name}</b>
            <small>{activeItem.district}</small>
          </div>
          <strong>{activeScore.toFixed(2).replace(".", ",")}</strong>
        </div>
      )}

      {!compact && (
        <>
          <div className="map-zoom" role="group" aria-label="Kontrol perbesaran peta">
            <button
              type="button"
              aria-label="Perbesar tampilan peta"
              disabled={scale >= ZOOM_MAX - 0.001}
              onClick={() => setScale((s) => Math.min(ZOOM_MAX, s * ZOOM_STEP))}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Perkecil tampilan peta"
              disabled={scale <= ZOOM_MIN + 0.001}
              onClick={() => setScale((s) => Math.max(ZOOM_MIN, s / ZOOM_STEP))}
            >
              −
            </button>
          </div>
          <div className="map-attribution">68 Kelurahan · Geometri RBI BIG</div>
        </>
      )}
    </div>
  );
}

export function ScoreLegend({
  title = "Indeks kelayakhunian",
  ringkas = false,
}: {
  title?: string;
  ringkas?: boolean;
}) {
  // Versi ringkas: judul, bar, dan nama kelas di kedua ujungnya saja.
  if (ringkas) {
    return (
      <div className="legend-isi">
        <div className="legend-title">
          <span>{title}</span>
        </div>
        <div className="legend-bar" />
        <div className="legend-ujung">
          <span>{classes[classes.length - 1].label}</span>
          <span>{classes[0].label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="legend-isi">
      <div className="legend-title">
        <span>{title}</span>
      </div>
      <div className="legend-bar" />
      <div className="legend-values">
        <span>0,00</span>
        <span>0,20</span>
        <span>0,40</span>
        <span>0,60</span>
        <span>0,80</span>
        <span>1,00</span>
      </div>
      <div className="legend-classes">
        {classes.map((c) => (
          <div key={c.label}>
            <span>
              <i style={{ background: c.color }} />
              {c.label}
            </span>
            <b>{c.range}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// Seluruh path hanya memakai perintah M, L, dan Z dengan koordinat absolut,
// jadi kotak batasnya cukup dihitung dari pasangan angka di dalam d.
function kotakBatas(d: string) {
  const angka = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const x = angka.filter((_, i) => i % 2 === 0);
  const y = angka.filter((_, i) => i % 2 === 1);
  const x0 = Math.min(...x);
  const y0 = Math.min(...y);
  return { x0, y0, lebar: Math.max(...x) - x0, tinggi: Math.max(...y) - y0 };
}

export function PetaKelurahan({ slug }: { slug: string }) {
  const item = bogorSvgPaths.find((p) => p.slug === slug);
  if (!item) return null;

  const b = kotakBatas(item.d);
  // Kotak pandang dibuat bujur sangkar supaya bentuk wilayahnya tidak gepeng.
  const sisi = Math.max(b.lebar, b.tinggi) * 1.34;
  const vb = [
    b.x0 + b.lebar / 2 - sisi / 2,
    b.y0 + b.tinggi / 2 - sisi / 2,
    sisi,
    sisi,
  ].join(" ");

  return (
    <svg
      className="peta-kelurahan"
      viewBox={vb}
      role="img"
      aria-label={`Bentuk wilayah Kelurahan ${item.name}`}
    >
      <path
        d={item.d}
        fill={scoreToColor(getDimensionScore(slug, "livable"))}
        stroke="#0b3f39"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
