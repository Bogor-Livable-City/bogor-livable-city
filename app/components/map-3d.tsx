"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, Geometry, Position } from "geojson";
import { classify, fmt, shadeHex, type KelurahanProps, type ThemeKey } from "../lib/livability";
import { usePinchZoom } from "../lib/pinch";

type Props = {
  data: FeatureCollection<Geometry, KelurahanProps>;
  theme: ThemeKey;
  selectedKode: string | null;
  visibleKodes: Set<string> | null;
  showLabels: boolean;
  onSelect: (kode: string | null) => void;
};

const SKALA_TINGGI = [0.5, 0.75, 1, 1.25, 1.5];
const ZOOM_MIN = 0.65;
const ZOOM_MAX = 2.4;
// pitch 0 berarti tegak lurus dari atas. Di atas 1,2 tinggi petanya tinggal
// sepertiga sementara balok ekstrusinya hampir penuh, jadi bentuk wilayahnya
// sudah tidak terbaca lagi.
const PITCH_MIN = 0;
const PITCH_MAX = 1.2;

type Kamera = { yaw: number; pitch: number; zoom: number; pusatX: number; pusatY: number };

const AWAL: Kamera = { yaw: -0.42, pitch: 0.92, zoom: 1.08, pusatX: 0, pusatY: 0 };
const KUNCI_KAMERA = ["yaw", "pitch", "zoom", "pusatX", "pusatY"] as const;

type Ring2D = [number, number][];

type PreparedFeature = {
  props: KelurahanProps;
  rings: Ring2D[];
  centroid: [number, number];
};

function extractRings(geom: Geometry): Position[][] {
  if (geom.type === "Polygon") return [geom.coordinates[0]];
  if (geom.type === "MultiPolygon") return geom.coordinates.map((p) => p[0]);
  return [];
}

function ringCentroid(ring: Ring2D): [number, number, number] {
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
  if (Math.abs(area) < 1e-9) {
    const sx = ring.reduce((s, p) => s + p[0], 0) / (ring.length || 1);
    const sy = ring.reduce((s, p) => s + p[1], 0) / (ring.length || 1);
    return [sx, sy, 0];
  }
  area *= 0.5;
  return [cx / (6 * area), cy / (6 * area), Math.abs(area)];
}


function pointInRing(px: number, py: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function Map3D({
  data,
  theme,
  selectedKode,
  visibleKodes,
  showLabels,
  onSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [heightScale, setHeightScale] = useState(1);
  const [hoveredKode, setHoveredKode] = useState<string | null>(null);

  // Kamera disimpan di ref, bukan state: saat digeser nilainya berubah puluhan
  // kali per detik dan React tidak perlu ikut merender ulang tiap kali.
  const kamera = useRef<Kamera>({ ...AWAL });
  const tujuan = useRef<Kamera>({ ...AWAL });
  const perluGambar = useRef(true);

  const dragRef = useRef<{ active: boolean; x: number; y: number; moved: boolean }>({
    active: false,
    x: 0,
    y: 0,
    moved: false,
  });

  // Hit-test cache untuk klik & hover pada poligon atap 3D
  const hitPolysRef = useRef<{ kode: string; poly: [number, number][] }[]>([]);

  // Normalisasi koordinat geografis ke ruang model [-1, 1]
  const prepared = useMemo<PreparedFeature[]>(() => {
    let minLon = Infinity,
      maxLon = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;
    for (const f of data.features) {
      for (const r of extractRings(f.geometry)) {
        for (const [lon, lat] of r) {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }
    const cx = (minLon + maxLon) / 2;
    const cy = (minLat + maxLat) / 2;
    const span = Math.max(maxLon - minLon, maxLat - minLat) / 2 || 1;

    return data.features.map((f) => {
      const rawRings = extractRings(f.geometry);
      const rings: Ring2D[] = rawRings.map((r) =>
        r.map(([lon, lat]) => [(lon - cx) / span, (lat - cy) / span])
      );
      let bestCentroid: [number, number] = [0, 0];
      let bestArea = -1;
      for (const r of rings) {
        const [rx, ry, area] = ringCentroid(r);
        if (area > bestArea) {
          bestArea = area;
          bestCentroid = [rx, ry];
        }
      }
      return {
        props: f.properties,
        rings,
        centroid: bestCentroid,
      };
    });
  }, [data]);

  const gambar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    // Menyetel canvas.width mengalokasikan ulang buffernya dan menghapus isinya,
    // jadi hanya dilakukan kalau ukurannya memang berubah.
    const dpr = window.devicePixelRatio || 1;
    const lebarBuf = Math.round(rect.width * dpr);
    const tinggiBuf = Math.round(rect.height * dpr);
    if (canvas.width !== lebarBuf || canvas.height !== tinggiBuf) {
      canvas.width = lebarBuf;
      canvas.height = tinggiBuf;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { yaw, pitch, zoom, pusatX, pusatY } = kamera.current;
    const w = rect.width;
    const h = rect.height;
    const scale = Math.min(w, h) * 0.41 * zoom;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // Titik pusat pandangan ikut diputar, supaya kelurahan yang dipilih tetap
    // di tengah layar berapa pun sudut putarnya.
    const offX = pusatX * cosY - pusatY * sinY;
    const offY = pusatX * sinY + pusatY * cosY;

    const project = (x: number, y: number, z: number): [number, number, number] => {
      const rx = x * cosY - y * sinY - offX;
      const ry = x * sinY + y * cosY - offY;
      const sx = w / 2 + rx * scale;
      const sy = h * 0.54 - ry * cosP * scale - z * sinP * scale;
      const depth = ry * sinP - z * cosP;
      return [sx, sy, depth];
    };

    // Latar belakang kanvas 3D
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    bg.addColorStop(0, "#eef4ef");
    bg.addColorStop(1, "#d3e1d7");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid alas 3D, digambar sebagai satu jalur
    ctx.strokeStyle = "rgba(14, 91, 83, 0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let g = -1.2; g <= 1.21; g += 0.3) {
      const [x1, y1] = project(g, -1.2, 0);
      const [x2, y2] = project(g, 1.2, 0);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      const [x3, y3] = project(-1.2, g, 0);
      const [x4, y4] = project(1.2, g, 0);
      ctx.moveTo(x3, y3);
      ctx.lineTo(x4, y4);
    }
    ctx.stroke();

    // Urutkan kelurahan dari belakang ke depan (Painter's algorithm)
    const sorted = [...prepared]
      .map((item) => {
        const score = item.props[theme];
        const zTop = (0.04 + score * 0.34) * heightScale;
        const [, , depth] = project(item.centroid[0], item.centroid[1], zTop * 0.5);
        return { item, score, zTop, depth };
      })
      .sort((a, b) => b.depth - a.depth);

    // Dari atas tegak lurus, dinding sampingnya tidak terlihat sama sekali.
    const dindingTerlihat = sinP > 0.02;

    const newHitPolys: { kode: string; poly: [number, number][] }[] = [];
    const labelQueue: {
      x: number;
      y: number;
      name: string;
      score: string;
      active: boolean;
    }[] = [];

    for (const { item, score, zTop } of sorted) {
      const kode = item.props.kode;
      const isSelected = kode === selectedKode;
      const isHovered = kode === hoveredKode;
      const isVisible = !visibleKodes || visibleKodes.has(kode);
      const baseColor = classify(score).color;
      const z = isVisible ? (isSelected ? zTop + 0.035 : zTop) : 0.015;

      for (const ring of item.rings) {
        const topPts = ring.map(([x, y]) => project(x, y, z));

        if (dindingTerlihat) {
          const basePts = ring.map(([x, y]) => project(x, y, 0));

          // Seluruh dinding satu kelurahan digambar sebagai satu jalur. Kalau
          // tiap sisi digambar sendiri-sendiri, 8.800 titik batas berubah jadi
          // belasan ribu panggilan fill dan stroke tiap frame.
          ctx.fillStyle = isVisible
            ? shadeHex(baseColor, isSelected ? 0.68 : 0.76)
            : "rgba(180, 192, 185, 0.35)";
          ctx.strokeStyle = isVisible
            ? shadeHex(baseColor, 0.62)
            : "rgba(160, 175, 168, 0.25)";
          ctx.lineWidth = 0.6;

          ctx.beginPath();
          for (let i = 0; i < ring.length - 1; i++) {
            const b1 = basePts[i];
            const b2 = basePts[i + 1];
            const t2 = topPts[i + 1];
            const t1 = topPts[i];
            ctx.moveTo(b1[0], b1[1]);
            ctx.lineTo(b2[0], b2[1]);
            ctx.lineTo(t2[0], t2[1]);
            ctx.lineTo(t1[0], t1[1]);
            ctx.closePath();
          }
          ctx.fill();
          ctx.stroke();
        }

        // Gambar bidang atap poligon kelurahan
        ctx.beginPath();
        topPts.forEach(([px, py], idx) => {
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();

        ctx.fillStyle = isVisible
          ? isSelected || isHovered
            ? shadeHex(baseColor, 1.12)
            : baseColor
          : "rgba(205, 214, 208, 0.45)";
        ctx.fill();

        ctx.strokeStyle = isSelected
          ? "#173b38"
          : isHovered
          ? "#ffffff"
          : "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = isSelected ? 2.4 : isHovered ? 1.8 : 0.9;
        ctx.stroke();

        newHitPolys.push({
          kode,
          poly: topPts.map(([px, py]) => [px, py]),
        });
      }

      if (isVisible && (showLabels || isSelected || isHovered)) {
        const [lx, ly] = project(item.centroid[0], item.centroid[1], z + 0.02);
        labelQueue.push({
          x: lx,
          y: ly,
          name: item.props.kelurahan,
          score: fmt(score),
          active: isSelected || isHovered,
        });
      }
    }

    // Gambar label nama kelurahan di atas balok 3D
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const placedBoxes: [number, number, number, number][] = [];

    // Dahulukan yang dipilih/hover agar selalu tampil
    labelQueue.sort((a, b) => Number(b.active) - Number(a.active));

    for (const lbl of labelQueue) {
      ctx.font = lbl.active ? "700 11px sans-serif" : "600 9.5px sans-serif";
      const text = lbl.active ? `${lbl.name} (${lbl.score})` : lbl.name;
      const tw = ctx.measureText(text).width + 10;
      const th = lbl.active ? 20 : 15;
      const bx = lbl.x - tw / 2;
      const by = lbl.y - th / 2;

      if (!lbl.active) {
        const overlaps = placedBoxes.some(
          ([ox, oy, ow, oh]) =>
            bx < ox + ow && bx + tw > ox && by < oy + oh && by + th > oy
        );
        if (overlaps) continue;
      }
      placedBoxes.push([bx, by, tw, th]);

      ctx.fillStyle = lbl.active
        ? "rgba(23, 59, 56, 0.94)"
        : "rgba(255, 254, 250, 0.86)";
      ctx.strokeStyle = lbl.active ? "#fff" : "rgba(23, 59, 56, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, th, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = lbl.active ? "#ffffff" : "#173b38";
      ctx.fillText(text, lbl.x, lbl.y + 0.5);
    }

    hitPolysRef.current = newHitPolys;
  }, [prepared, theme, selectedKode, hoveredKode, visibleKodes, showLabels, heightScale]);

  // Disimpan di ref supaya gelung animasi di bawah cukup dipasang sekali.
  const gambarRef = useRef(gambar);
  gambarRef.current = gambar;

  useEffect(() => {
    perluGambar.current = true;
  }, [gambar]);

  // Satu gelung requestAnimationFrame mengurus easing kamera sekaligus
  // menggambar, jadi beberapa perubahan dalam satu frame cukup sekali gambar.
  useEffect(() => {
    let hidup = true;
    let id = 0;
    const langkah = () => {
      if (!hidup) return;
      const k = kamera.current;
      const t = tujuan.current;
      let bergerak = false;
      for (const kunci of KUNCI_KAMERA) {
        const selisih = t[kunci] - k[kunci];
        if (Math.abs(selisih) > 0.0004) {
          k[kunci] += selisih * 0.16;
          bergerak = true;
        } else {
          k[kunci] = t[kunci];
        }
      }
      if (bergerak || perluGambar.current) {
        perluGambar.current = false;
        gambarRef.current();
      }
      id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => {
      hidup = false;
      cancelAnimationFrame(id);
    };
  }, []);

  // Lebar kanvas berubah saat panel detail dibuka atau ditutup; tanpa ini
  // gambarnya tetap memakai ukuran lama sehingga tampak melar dan bergeser.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      perluGambar.current = true;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Memilih kelurahan membawa pandangan tegak lurus dari atas ke wilayah itu;
  // menutup panelnya mengembalikan pandangan semula.
  useEffect(() => {
    const t = tujuan.current;
    const f = selectedKode
      ? prepared.find((p) => p.props.kode === selectedKode)
      : undefined;
    if (f) {
      t.pusatX = f.centroid[0];
      t.pusatY = f.centroid[1];
      t.yaw = 0;
      t.pitch = 0.06;
      t.zoom = 2;
    } else {
      Object.assign(t, AWAL);
    }
  }, [selectedKode, prepared]);

  usePinchZoom(
    wrapRef,
    (rasio, awal) => {
      tujuan.current.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, awal * rasio));
    },
    () => tujuan.current.zoom
  );

  const findHitKode = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    // Periksa dari depan ke belakang (akhir array adalah yang paling depan)
    for (let i = hitPolysRef.current.length - 1; i >= 0; i--) {
      const { kode, poly } = hitPolysRef.current[i];
      if (pointInRing(x, y, poly)) return kode;
    }
    return null;
  };

  // Saat digeser, kamera dan tujuannya digerakkan bersamaan supaya tidak
  // tertinggal di belakang jari atau kursor.
  const geser = (dx: number, dy: number) => {
    const k = kamera.current;
    const t = tujuan.current;
    t.yaw = k.yaw + dx * 0.008;
    t.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, k.pitch - dy * 0.006));
    k.yaw = t.yaw;
    k.pitch = t.pitch;
    perluGambar.current = true;
  };

  const ubahZoom = (faktor: number) => {
    tujuan.current.zoom = Math.max(
      ZOOM_MIN,
      Math.min(ZOOM_MAX, tujuan.current.zoom * faktor)
    );
  };

  return (
    <div className="map-3d-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="leaflet-host"
        onMouseDown={(e) => {
          dragRef.current = { active: true, x: e.clientX, y: e.clientY, moved: false };
        }}
        onMouseMove={(e) => {
          if (dragRef.current.active) {
            const dx = e.clientX - dragRef.current.x;
            const dy = e.clientY - dragRef.current.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
            dragRef.current.x = e.clientX;
            dragRef.current.y = e.clientY;
            geser(dx, dy);
          } else {
            setHoveredKode(findHitKode(e.clientX, e.clientY));
          }
        }}
        onMouseUp={(e) => {
          const wasMoved = dragRef.current.moved;
          dragRef.current.active = false;
          if (!wasMoved) {
            const hit = findHitKode(e.clientX, e.clientY);
            if (hit) onSelect(hit);
          }
        }}
        onMouseLeave={() => {
          dragRef.current.active = false;
          setHoveredKode(null);
        }}
        onWheel={(e) => {
          e.preventDefault();
          ubahZoom(e.deltaY < 0 ? 1.08 : 0.92);
        }}
        // Satu jari memutar, jadi tidak ada gestur halaman yang perlu lewat.
        style={{ touchAction: "none" }}
        onTouchStart={(e) => {
          if (e.touches.length !== 1) {
            dragRef.current.active = false;
            return;
          }
          const t = e.touches[0];
          dragRef.current = { active: true, x: t.clientX, y: t.clientY, moved: false };
        }}
        onTouchMove={(e) => {
          if (e.touches.length !== 1 || !dragRef.current.active) return;
          const t = e.touches[0];
          const dx = t.clientX - dragRef.current.x;
          const dy = t.clientY - dragRef.current.y;
          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
          dragRef.current.x = t.clientX;
          dragRef.current.y = t.clientY;
          geser(dx, dy);
        }}
        onTouchEnd={(e) => {
          if (e.touches.length > 0) return;
          const wasMoved = dragRef.current.moved;
          dragRef.current.active = false;
          if (wasMoved || e.changedTouches.length !== 1) return;
          const t = e.changedTouches[0];
          const hit = findHitKode(t.clientX, t.clientY);
          if (hit) onSelect(hit);
        }}
      />

      <div className="map-3d-controls">
        <button
          type="button"
          onClick={() => {
            tujuan.current.yaw -= 0.25;
          }}
          aria-label="Putar kiri"
          title="Putar kiri"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => {
            tujuan.current.yaw += 0.25;
          }}
          aria-label="Putar kanan"
          title="Putar kanan"
        >
          ↻
        </button>
        <button
          type="button"
          onClick={() => {
            tujuan.current.pitch = tujuan.current.pitch < 0.2 ? AWAL.pitch : PITCH_MIN;
          }}
          title="Lihat tegak lurus dari atas, atau kembali miring"
        >
          Dari atas
        </button>
        <button
          type="button"
          onClick={() =>
            setHeightScale(
              (h) => SKALA_TINGGI[(SKALA_TINGGI.indexOf(h) + 1) % SKALA_TINGGI.length]
            )
          }
          title="Ubah skala tinggi ekstrusi 3D"
        >
          Tinggi {heightScale.toLocaleString("id-ID")}×
        </button>
        <button
          type="button"
          onClick={() => {
            Object.assign(tujuan.current, AWAL);
            setHeightScale(1);
          }}
        >
          Reset 3D
        </button>
      </div>
    </div>
  );
}
