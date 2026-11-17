import { kelurahanData } from "./kelurahan-data";
import { classify, fmt, slugify, type KelurahanProps } from "./lib/livability";

export { kelurahanData };

const districtNames = [
  "Bogor Tengah",
  "Bogor Utara",
  "Bogor Timur",
  "Tanah Sareal",
  "Bogor Barat",
  "Bogor Selatan",
];

export const districts = districtNames
  .map((name) => {
    const items = kelurahanData.filter((k) => k.kecamatan === name);
    const totalPop = items.reduce((s, k) => s + k.penduduk, 0);
    const weighted =
      totalPop > 0
        ? items.reduce((s, k) => s + k.skor_livable * k.penduduk, 0) / totalPop
        : 0;
    return {
      name,
      score: Number(weighted.toFixed(2)),
      villages: items.length,
      population: totalPop.toLocaleString("id-ID"),
      className: classify(weighted).label,
    };
  })
  .sort((a, b) => b.score - a.score);

export type RankingRow = KelurahanProps & {
  rank: number;
  name: string;
  district: string;
  score: number;
  className: string;
};

export const ranking: RankingRow[] = kelurahanData.map((k) => ({
  ...k,
  rank: k.peringkat,
  name: k.kelurahan,
  district: k.kecamatan,
  score: Number(k.skor_livable.toFixed(2)),
  className: classify(k.skor_livable).label,
}));

const avg = (fn: (k: KelurahanProps) => number) =>
  Number(
    (
      kelurahanData.reduce((s, k) => s + fn(k), 0) / kelurahanData.length
    ).toFixed(2)
  );

const topBy = (fn: (k: KelurahanProps) => number) => {
  const sorted = [...kelurahanData].sort((a, b) => fn(b) - fn(a));
  const best = sorted[0];
  return `${best.kelurahan} (${fmt(fn(best))})`;
};

const totalSchools = kelurahanData.reduce(
  (s, k) => s + k.n_sd + k.n_smp + k.n_sma_smk,
  0
);
const totalFaskes = kelurahanData.reduce(
  (s, k) => s + k.n_rs + k.n_puskesmas + k.n_klinik,
  0
);
const totalAreaKm2 = kelurahanData.reduce((s, k) => s + k.luas_km2, 0);
const totalPopulation = kelurahanData.reduce((s, k) => s + k.penduduk, 0);
const maxVegetasiKel = [...kelurahanData].sort(
  (a, b) => b.vegetasi_pct - a.vegetasi_pct
)[0];
const maxJalanKel = [...kelurahanData].sort(
  (a, b) => b.kerapatan_jalan_km_km2 - a.kerapatan_jalan_km_km2
)[0];
const maxDagangKel = [...kelurahanData].sort(
  (a, b) => b.perdagangan_pct - a.perdagangan_pct
)[0];

export const citySummary = {
  totalKelurahan: kelurahanData.length,
  totalKecamatan: districtNames.length,
  totalSchools,
  totalFaskes,
  totalFacilities: totalSchools + totalFaskes,
  totalAreaKm2: fmt(totalAreaKm2, 2),
  totalPopulation: totalPopulation.toLocaleString("id-ID"),
  avgFaskesPct: fmt(avg((k) => k.cakupan_faskes_pct), 1),
};

export const dimensions = [
  {
    key: "skor_kesehatan" as const,
    icon: "plus",
    name: "Kesehatan",
    value: avg((k) => k.skor_kesehatan),
    note: `${fmt(avg((k) => k.cakupan_faskes_pct), 1)}% cakupan layanan faskes`,
    desc: "Cakupan jangkauan Puskesmas (radius 2 km), Klinik (1 km), serta jarak jaringan jalan menuju Rumah Sakit terdekat.",
    top: topBy((k) => k.skor_kesehatan),
    stat: `${fmt(avg((k) => k.cakupan_faskes_pct), 1)}% rata-rata cakupan`,
    color: "#0e5b53",
  },
  {
    key: "skor_pendidikan" as const,
    icon: "chart",
    name: "Pendidikan",
    value: avg((k) => k.skor_pendidikan),
    note: `${fmt(avg((k) => k.sekolah_per_10rb), 1)} sekolah / 10.000 jiwa`,
    desc: `Sebaran ${totalSchools} titik sekolah (SD, SMP, SMA/SMK), rasio per 10.000 penduduk, dan jarak tempuh jalan.`,
    top: topBy((k) => k.skor_pendidikan),
    stat: `${totalSchools} unit sekolah terdata`,
    color: "#3f806f",
  },
  {
    key: "skor_sosial" as const,
    icon: "rank",
    name: "Sosial kependudukan",
    value: avg((k) => k.skor_sosial),
    note: `${Math.round(avg((k) => k.kepadatan_jiwa_km2)).toLocaleString("id-ID")} jiwa/km² rata-rata`,
    desc: "Keseimbangan kepadatan penduduk per km² serta tingkat keamanan lingkungan permukiman di tiap kelurahan.",
    top: topBy((k) => k.skor_sosial),
    stat: `${Math.round(avg((k) => k.kepadatan_jiwa_km2)).toLocaleString("id-ID")} jiwa/km² rata-rata`,
    color: "#6d9b78",
  },
  {
    key: "skor_lingkungan" as const,
    icon: "layers",
    name: "Lingkungan",
    value: avg((k) => k.skor_lingkungan),
    note: `${fmt(avg((k) => k.vegetasi_pct), 1)}% tutupan vegetasi`,
    desc: "Proporsi tutupan vegetasi ruang terbuka hijau terhadap luas wilayah dan ketersediaan m² vegetasi per jiwa.",
    top: topBy((k) => k.skor_lingkungan),
    stat: `Tertinggi ${fmt(maxVegetasiKel.vegetasi_pct, 1)}% (${maxVegetasiKel.kelurahan})`,
    color: "#8fad68",
  },
  {
    key: "skor_transportasi" as const,
    icon: "map",
    name: "Transportasi",
    value: avg((k) => k.skor_transportasi),
    note: `${fmt(avg((k) => k.kerapatan_jalan_km_km2), 1)} km/km² kerapatan jalan`,
    desc: "Kerapatan jaringan jalan (km/km²) dan persentase luas badan jalan terhadap luas wilayah kelurahan.",
    top: topBy((k) => k.skor_transportasi),
    stat: `Tertinggi ${fmt(maxJalanKel.kerapatan_jalan_km_km2, 1)} km/km² (${maxJalanKel.kelurahan})`,
    color: "#c9895b",
  },
  {
    key: "skor_ekonomi" as const,
    icon: "sliders",
    name: "Ekonomi",
    value: avg((k) => k.skor_ekonomi),
    note: `${fmt(avg((k) => k.perdagangan_pct), 1)}% kawasan perdagangan`,
    desc: "Proporsi kawasan perdagangan dan jasa serta keseimbangan tata ruang produktif perkotaan.",
    top: topBy((k) => k.skor_ekonomi),
    stat: `Tertinggi ${fmt(maxDagangKel.perdagangan_pct, 1)}% (${maxDagangKel.kelurahan})`,
    color: "#d8a85f",
  },
];

export const indicators = [
  ["Cakupan layanan faskes gabungan", `${fmt(avg((k) => k.cakupan_faskes_pct), 1)}%`, "SIMDATA / Analisis Buffer", "2026"],
  ["Jarak jaringan jalan ke RS terdekat", `${Math.round(avg((k) => k.jarak_rs_m)).toLocaleString("id-ID")} m`, "OSM / Dijkstra Grid 75m", "2026"],
  ["Rasio sekolah (SD/SMP/SMA) per 10.000 jiwa", `${fmt(avg((k) => k.sekolah_per_10rb), 2)}`, "Kemendikbud / SIMDATA", "2026"],
  ["Jarak rata-rata jalan ke sekolah", `${Math.round(avg((k) => k.jarak_sekolah_m)).toLocaleString("id-ID")} m`, "OSM / Dijkstra Grid 75m", "2026"],
  ["Kepadatan penduduk", `${Math.round(avg((k) => k.kepadatan_jiwa_km2)).toLocaleString("id-ID")} jiwa/km²`, "SIMDATA Kota Bogor", "2026"],
  ["Kriminalitas (tawuran & pencurian)", `${fmt(avg((k) => k.kriminalitas_per_10rb), 2)} / 10rb jiwa`, "Data Kepolisian / Tim", "2026"],
  ["Proporsi tutupan vegetasi", `${fmt(avg((k) => k.vegetasi_pct), 1)}%`, "Penggunaan Lahan BIG", "2023"],
  ["Luas vegetasi per kapita", `${fmt(avg((k) => k.vegetasi_m2_per_jiwa), 1)} m²/jiwa`, "Olahan Spasial Tim", "2026"],
  ["Proporsi luas badan jalan", `${fmt(avg((k) => k.badan_jalan_pct), 1)}%`, "RBI BIG 1:25K", "2023"],
  ["Kerapatan jaringan jalan", `${fmt(avg((k) => k.kerapatan_jalan_km_km2), 1)} km/km²`, "OpenStreetMap", "2026"],
  ["Kawasan perdagangan & jasa", `${fmt(avg((k) => k.perdagangan_pct), 1)}%`, "Penggunaan Lahan", "2023"],
  ["Kawasan industri", `${fmt(avg((k) => k.industri_pct), 2)}%`, "Penggunaan Lahan", "2023"],
];

export const adminRows = ranking;

export function getKelurahanBySlug(slug: string): RankingRow | undefined {
  return ranking.find((r) => slugify(r.name) === slug.toLowerCase());
}

export function getIndicatorsForKelurahan(
  k: KelurahanProps
): [string, string, string, string][] {
  const m = (v: number) => `${Math.round(v).toLocaleString("id-ID")} m`;
  // Dua belas indikator persis seperti gis/metodologi-skor.md: dua per dimensi,
  // berbobot sama. K2 tidak disimpan sebagai satu angka karena bentuknya
  // komposit, jadi ketiga jarak penyusunnya yang ditampilkan.
  return [
    ["Kesehatan", "Cakupan layanan faskes gabungan", `${fmt(k.cakupan_faskes_pct, 1)}%`, "Positif"],
    ["Kesehatan", "Jarak komposit ke fasilitas kesehatan", `${m(k.jarak_puskesmas_m)} puskesmas · ${m(k.jarak_klinik_m)} klinik · ${m(k.jarak_rs_m)} RS`, "Negatif"],
    ["Pendidikan", "Sekolah per 10.000 penduduk", fmt(k.sekolah_per_10rb, 2), "Positif"],
    ["Pendidikan", "Jarak jaringan jalan ke sekolah", m(k.jarak_sekolah_m), "Negatif"],
    ["Sosial kependudukan", "Kepadatan penduduk", `${Math.round(k.kepadatan_jiwa_km2).toLocaleString("id-ID")} jiwa/km²`, "Negatif"],
    ["Sosial kependudukan", "Kriminalitas per 10.000 penduduk", fmt(k.kriminalitas_per_10rb, 2), "Negatif"],
    ["Ekonomi", "Kawasan perdagangan", `${fmt(k.perdagangan_pct, 1)}% wilayah`, "Positif"],
    ["Ekonomi", "Kawasan industri", `${fmt(k.industri_pct, 2)}% wilayah`, "Positif"],
    ["Transportasi", "Badan jalan", `${fmt(k.badan_jalan_pct, 1)}% wilayah`, "Positif"],
    ["Transportasi", "Kerapatan jaringan jalan", `${fmt(k.kerapatan_jalan_km_km2, 1)} km/km²`, "Positif"],
    ["Lingkungan", "Tutupan vegetasi", `${fmt(k.vegetasi_pct, 1)}% wilayah`, "Positif"],
    ["Lingkungan", "Vegetasi per penduduk", `${fmt(k.vegetasi_m2_per_jiwa, 1)} m²/jiwa`, "Positif"],
  ];
}

// Monografi dan fun fact diturunkan dari angka yang sudah ada di kelurahanData,
// bukan teks yang ditulis satu per satu untuk 68 kelurahan.

function peringkatMenurut(
  kumpulan: KelurahanProps[],
  k: KelurahanProps,
  nilai: (x: KelurahanProps) => number
): number {
  return kumpulan.filter((x) => nilai(x) > nilai(k)).length + 1;
}

const rataKota = (nilai: (x: KelurahanProps) => number) =>
  kelurahanData.reduce((s, x) => s + nilai(x), 0) / kelurahanData.length;

export function getMonografi(k: RankingRow): [string, string][] {
  const seKecamatan = kelurahanData.filter((x) => x.kecamatan === k.kecamatan);
  return [
    ["Kode wilayah", k.kode],
    ["Kecamatan", `${k.kecamatan} (${seKecamatan.length} kelurahan)`],
    ["Klasifikasi", k.kelas],
    ["Peringkat kota", `#${k.peringkat} dari 68 kelurahan`],
    [
      "Peringkat di kecamatan",
      `#${peringkatMenurut(seKecamatan, k, (x) => x.skor_livable)} dari ${seKecamatan.length}`,
    ],
    [
      "Sarana kesehatan",
      `${k.n_rs} rumah sakit · ${k.n_puskesmas} puskesmas · ${k.n_klinik} klinik`,
    ],
    ["Sarana pendidikan", `${k.n_sd} SD · ${k.n_smp} SMP · ${k.n_sma_smk} SMA/SMK`],
    ["Tutupan vegetasi", `${fmt(k.vegetasi_pct, 1)}% dari luas wilayah`],
    ["Kerapatan jalan", `${fmt(k.kerapatan_jalan_km_km2, 1)} km per km²`],
    ["Guna lahan terbangun", `${fmt(k.perdagangan_pct, 1)}% dagang · ${fmt(k.industri_pct, 2)}% industri`],
  ];
}

export function getFunFacts(k: RankingRow): string[] {
  const seKecamatan = kelurahanData.filter((x) => x.kecamatan === k.kecamatan);
  const fakta: string[] = [];

  const urutanKec = peringkatMenurut(seKecamatan, k, (x) => x.skor_livable);
  fakta.push(
    urutanKec === 1
      ? `Indeksnya paling tinggi di antara ${seKecamatan.length} kelurahan Kecamatan ${k.kecamatan}.`
      : `Di Kecamatan ${k.kecamatan}, indeksnya ada di urutan ${urutanKec} dari ${seKecamatan.length} kelurahan.`
  );

  // Rekor tingkat kota dipakai hanya kalau kelurahan ini memang pemegangnya.
  const rekor: [string, (x: KelurahanProps) => number, (v: number) => string][] = [
    ["terpadat se-Kota Bogor", (x) => x.kepadatan_jiwa_km2, (v) => `${Math.round(v).toLocaleString("id-ID")} jiwa per km²`],
    ["terluas se-Kota Bogor", (x) => x.luas_km2, (v) => `${fmt(v)} km²`],
    ["berpenduduk terbanyak se-Kota Bogor", (x) => x.penduduk, (v) => `${v.toLocaleString("id-ID")} jiwa`],
    ["paling hijau se-Kota Bogor", (x) => x.vegetasi_pct, (v) => `${fmt(v, 1)}% wilayahnya bervegetasi`],
    ["dengan klinik terbanyak se-Kota Bogor", (x) => x.n_klinik, (v) => `${v} klinik`],
    ["dengan sekolah terbanyak per penduduk", (x) => x.sekolah_per_10rb, (v) => `${fmt(v, 2)} sekolah per 10.000 jiwa`],
  ];
  for (const [julukan, nilai, tulis] of rekor) {
    if (nilai(k) > 0 && peringkatMenurut(kelurahanData, k, nilai) === 1) {
      fakta.push(`Kelurahan ${julukan}: ${tulis(nilai(k))}.`);
      break;
    }
  }

  const rataVeg = rataKota((x) => x.vegetasi_m2_per_jiwa);
  const kali = k.vegetasi_m2_per_jiwa / rataVeg;
  fakta.push(
    `Ruang hijaunya ${fmt(k.vegetasi_m2_per_jiwa, 1)} m² per jiwa, ${
      kali >= 1 ? `${fmt(kali, 1)} kali` : `${Math.round(kali * 100)}% dari`
    } rata-rata kota yang ${fmt(rataVeg, 1)} m² per jiwa.`
  );

  fakta.push(
    `Lewat jaringan jalan, permukiman di sini rata-rata ${Math.round(k.jarak_puskesmas_m).toLocaleString("id-ID")} m dari puskesmas terdekat dan ${Math.round(k.jarak_sekolah_m).toLocaleString("id-ID")} m dari sekolah terdekat.`
  );

  return fakta;
}
