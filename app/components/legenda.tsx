"use client";

// Satu kartu legenda di kiri bawah peta dengan tab di atasnya. Ukurannya tetap
// saat tab berganti, jadi kartunya tidak melompat-lompat.

import { useState } from "react";
import { ScoreLegend } from "./map-visual";
import { Icon } from "./ui";
import { badgeHtml, SIMBOL_FASKES, SIMBOL_SEKOLAH, UKURAN_LEGENDA, type SimbolTitik } from "../lib/simbol";

type Tab = "indeks" | "fasilitas";

const TABS: { key: Tab; label: string }[] = [
  { key: "indeks", label: "Indeks" },
  { key: "fasilitas", label: "Fasilitas" },
];

function DaftarSimbol({ judul, simbol }: { judul: string; simbol: Record<string, SimbolTitik> }) {
  return (
    <div className="legend-isi">
      <div className="legend-title">
        <span>{judul}</span>
      </div>
      {Object.entries(simbol).map(([k, s]) => (
        <div key={k} className="legend-simbol-row">
          <span dangerouslySetInnerHTML={{ __html: badgeHtml(s, UKURAN_LEGENDA) }} />
          {s.label}
        </div>
      ))}
    </div>
  );
}

export function LegendaPeta({ judulIndeks }: { judulIndeks: string }) {
  const [tab, setTab] = useState<Tab>("indeks");
  // Mulai tertutup supaya peta tidak langsung tertutup kartu saat dibuka.
  const [tampil, setTampil] = useState(false);

  // Saat disembunyikan tetap bertuliskan "Legenda", supaya jelas ini apa.
  if (!tampil) {
    return (
      <button type="button" className="legend-buka" onClick={() => setTampil(true)}>
        <Icon name="compass" size={15} />
        Legenda
      </button>
    );
  }

  return (
    <div className="legend-kartu">
      <div className="legend-tabs" role="tablist" aria-label="Pilih legenda">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "aktif" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          className="legend-tutup"
          aria-label="Sembunyikan legenda"
          title="Sembunyikan legenda"
          onClick={() => setTampil(false)}
        >
          <Icon name="chevron" size={14} />
        </button>
      </div>
      <div className="legend-tab-isi" role="tabpanel" key={tab}>
        {tab === "indeks" && <ScoreLegend title={judulIndeks} />}
        {tab === "fasilitas" && (
          <>
            <DaftarSimbol judul="Fasilitas Kesehatan" simbol={SIMBOL_FASKES} />
            <DaftarSimbol judul="Fasilitas Pendidikan" simbol={SIMBOL_SEKOLAH} />
          </>
        )}
      </div>
    </div>
  );
}
