import Link from "next/link";
import { Suspense } from "react";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import { PetaKelurahan } from "../../components/map-visual";
import { Icon, PageShell, TombolKembali } from "../../components/ui";
import {
  dimensions,
  getFunFacts,
  getIndicatorsForKelurahan,
  getKelurahanBySlug,
  getMonografi,
  ranking,
} from "../../data";
import { classify, fmt, slugify } from "../../lib/livability";

export function generateStaticParams() {
  return ranking.map((region) => ({
    slug: slugify(region.name),
  }));
}

function RegionLoading() {
  return (
    <PageShell className="detail-page">
      <section className="detail-hero">
        <div>
          <h1>Memuat wilayah...</h1>
          <p className="detail-kecamatan">Kota Bogor</p>
          <p>Sedang menyiapkan informasi kelayakhunian wilayah.</p>
        </div>
      </section>
    </PageShell>
  );
}

export default function RegionPage({
  params,
}: PageProps<"/wilayah/[slug]">) {
  return (
    <Suspense fallback={<RegionLoading />}>
      <RegionContent params={params} />
    </Suspense>
  );
}

async function RegionContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const region = getKelurahanBySlug(slug);

  if (!region) {
    notFound();
  }

  const name = region.name;
  const district = region.district;
  const score = region.skor_livable;
  const scoreLabel = classify(score).label;

  const regionDimensions = [
    {
      name: "Kesehatan",
      value: region.skor_kesehatan,
      cityAvg: dimensions[0].value,
      note: `${fmt(region.cakupan_faskes_pct, 1)}% cakupan · ${Math.round(region.jarak_rs_m).toLocaleString("id-ID")} m ke RS`,
      color: "#0e5b53",
    },
    {
      name: "Pendidikan",
      value: region.skor_pendidikan,
      cityAvg: dimensions[1].value,
      note: `${region.n_sd + region.n_smp + region.n_sma_smk} sekolah (${fmt(region.sekolah_per_10rb, 1)} / 10rb jiwa)`,
      color: "#3f806f",
    },
    {
      name: "Sosial kependudukan",
      value: region.skor_sosial,
      cityAvg: dimensions[2].value,
      note: `${Math.round(region.kepadatan_jiwa_km2).toLocaleString("id-ID")} jiwa/km²`,
      color: "#6d9b78",
    },
    {
      name: "Lingkungan",
      value: region.skor_lingkungan,
      cityAvg: dimensions[3].value,
      note: `${fmt(region.vegetasi_pct, 1)}% vegetasi (${fmt(region.vegetasi_m2_per_jiwa, 1)} m²/jiwa)`,
      color: "#8fad68",
    },
    {
      name: "Transportasi",
      value: region.skor_transportasi,
      cityAvg: dimensions[4].value,
      note: `${fmt(region.badan_jalan_pct, 1)}% badan jalan · ${fmt(region.kerapatan_jalan_km_km2, 1)} km/km²`,
      color: "#c9895b",
    },
    {
      name: "Ekonomi",
      value: region.skor_ekonomi,
      cityAvg: dimensions[5].value,
      note: `${fmt(region.perdagangan_pct, 1)}% kawasan perdagangan`,
      color: "#d8a85f",
    },
  ];

  return (
    <PageShell className="detail-page">
      <TombolKembali />

      <section className="detail-hero">
        <div>
          <h1>{name}</h1>
          <p className="detail-kecamatan">{district}</p>

          <div className="detail-actions">
            <Link
              href={`/perbandingan?a=${encodeURIComponent(name)}`}
              className="button"
            >
              <Icon name="compare" />
              Bandingkan wilayah
            </Link>

            <Link href={`/peta?kel=${slugify(name)}`} className="quiet-button">
              <Icon name="map" />
              Lihat di peta
            </Link>
          </div>
        </div>

        <div className="detail-score">
          <span>Indeks Kelayakhunian</span>
          <strong>{fmt(score)}</strong>
          <b>{scoreLabel}</b>
          <small>Peringkat #{region.rank} dari 68 kelurahan</small>
        </div>

        <div className="detail-map">
          <PetaKelurahan slug={slugify(name)} />
        </div>
      </section>

      <section className="detail-stats">
        <div>
          <span>Penduduk</span>
          <b>{region.penduduk.toLocaleString("id-ID")}</b>
          <small>jiwa · SIMDATA 2026</small>
        </div>

        <div>
          <span>Luas wilayah</span>
          <b>{fmt(region.luas_km2)}</b>
          <small>km²</small>
        </div>

        <div>
          <span>Kepadatan</span>
          <b>{Math.round(region.kepadatan_jiwa_km2).toLocaleString("id-ID")}</b>
          <small>jiwa/km²</small>
        </div>

        <div>
          <span>Cakupan faskes</span>
          <b>{fmt(region.cakupan_faskes_pct, 1)}%</b>
          <small>permukiman terlayani</small>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <p className="eyebrow">Enam dimensi</p>
          <h2>Di mana {name} unggul?</h2>
        </div>

        <div className="dimension-detail-grid">
          {regionDimensions.map((dimension) => {
            const radialStyle = {
              "--score": `${dimension.value * 360}deg`,
              "--accent": dimension.color,
            } as CSSProperties;

            return (
              <article key={dimension.name}>
                <div className="radial" style={radialStyle}>
                  <span>{fmt(dimension.value)}</span>
                </div>

                <div>
                  <h3>{dimension.name}</h3>
                  <p>{dimension.note}</p>
                  <small>
                    {dimension.value >= dimension.cityAvg
                      ? `Di atas rata-rata kota (${fmt(dimension.cityAvg)})`
                      : `Di bawah rata-rata kota (${fmt(dimension.cityAvg)})`}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <p className="eyebrow">Profil wilayah</p>
          <h2>Monografi {name}.</h2>
        </div>

        <dl className="monografi">
          {getMonografi(region).map(([label, isi]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{isi}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="detail-section compare-table indikator-table">
        <div className="section-heading">
          <p className="eyebrow">Dua belas indikator penyusun skor</p>
          <h2>Rincian indikator {name}.</h2>
        </div>

        <div className="indikator-kepala">
          <strong>Indikator</strong>
          <span>{name}</span>
          <i>Selisih</i>
          <span>Rata-rata kota</span>
        </div>

        {getIndicatorsForKelurahan(region).map((b) => {
          const selisih =
            b.nilai !== null && b.rataKota !== null ? b.nilai - b.rataKota : null;
          // Untuk indikator negatif, berada di bawah rata-rata justru bagus.
          const bagus = selisih !== null && (b.negatif ? selisih < 0 : selisih > 0);
          return (
            <div key={b.label}>
              <strong>
                {b.label}
                <small>
                  {b.dimensi} · {b.satuan}
                </small>
              </strong>
              <span className={b.teksNilai ? "nilai-komposit" : ""}>
                {b.teksNilai ?? fmt(b.nilai as number, b.desimal)}
              </span>
              <i className={bagus ? "" : "lower-good"}>
                {selisih === null
                  ? "—"
                  : `${selisih >= 0 ? "+" : "−"}${fmt(Math.abs(selisih), b.desimal)}`}
              </i>
              <span>
                {b.rataKota === null ? "—" : fmt(b.rataKota, b.desimal)}
              </span>
            </div>
          );
        })}
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <p className="eyebrow">Tahukah kamu</p>
          <h2>Beberapa hal tentang {name}.</h2>
        </div>

        <ul className="fun-fact">
          {getFunFacts(region).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <section className="detail-cta">
        <div>
          <p className="eyebrow">Buat perbandingan</p>
          <h2>Bagaimana {name} dibanding wilayah lain?</h2>
        </div>

        <Link
          className="button button-cream"
          href={`/perbandingan?a=${encodeURIComponent(name)}`}
        >
          Pilih wilayah pembanding
          <Icon name="arrow" />
        </Link>
      </section>
    </PageShell>
  );
}
