// Penjawab pertanyaan lokasi untuk Tanya Bogor.
//
// Semua jawaban di sini dihitung dari data proyek sendiri: 119 titik fasilitas
// kesehatan, 553 sekolah, dan batas 68 kelurahan. Tidak ada model bahasa di
// baliknya, jadi yang bisa dijawab hanya yang benar-benar ada datanya.

import { kelurahanData } from "../kelurahan-data";
import { fmt } from "./livability";

export type Titik = {
  nama: string;
  jenis: string;
  kelurahan: string;
  kecamatan: string;
  lon: number;
  lat: number;
};

export type DataTanya = {
  titik: Titik[];
  pusatKelurahan: Map<string, [number, number]>;
};

export const LABEL_JENIS: Record<string, string> = {
  rs: "Rumah Sakit",
  puskesmas: "Puskesmas",
  klinik: "Klinik",
  sd: "SD",
  smp: "SMP",
  sma_smk: "SMA/SMK",
};

// Kata kunci yang dipakai pengguna untuk menyebut tiap jenis fasilitas.
const KATA_JENIS: [string, string[]][] = [
  ["rs", ["rumah sakit", "rumahsakit", "rs "]],
  ["puskesmas", ["puskesmas", "pkm"]],
  ["klinik", ["klinik"]],
  ["sd", ["sd ", "sekolah dasar"]],
  ["smp", ["smp"]],
  ["sma_smk", ["sma", "smk"]],
];

const RAD = Math.PI / 180;

export function jarakMeter(a: [number, number], b: [number, number]): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLon = (b[0] - a[0]) * RAD;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(s));
}

function tulisJarak(m: number): string {
  return m < 1000
    ? `${Math.round(m).toLocaleString("id-ID")} m`
    : `${fmt(m / 1000, 1)} km`;
}

const normal = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Kata yang terlalu umum untuk dipakai mencocokkan nama fasilitas.
const KATA_UMUM = new Set([
  "rumah", "sakit", "puskesmas", "klinik", "sd", "smp", "sma", "smk", "negeri",
  "swasta", "uptd", "rs", "rsu", "rsud", "dari", "yang", "berapa", "jarak",
  "jauh", "dekat", "terdekat", "lokasi", "saya", "aku", "ke", "di", "dan",
  "sekolah", "kota", "bogor", "kelurahan", "kecamatan",
]);

// Angka ikut dihitung, karena justru angka yang membedakan SMKN 1 dari SMKN 4.
function kataPenting(teks: string): string[] {
  return teks
    .split(" ")
    .filter((w) => (w.length >= 4 || /^\d+$/.test(w)) && !KATA_UMUM.has(w));
}

/** Titik dengan nama yang paling cocok dengan kalimat pertanyaan. */
export function cariTitik(q: string, titik: Titik[]): Titik | null {
  const qn = ` ${normal(q)} `;
  let terbaik: Titik | null = null;
  let nilaiTerbaik = 0;
  for (const t of titik) {
    const nn = normal(t.nama);
    if (qn.includes(nn)) return t;
    const kata = kataPenting(nn);
    if (kata.length === 0) continue;
    const cocok = kata.filter((w) => qn.includes(` ${w} `)).length;
    if (cocok === 0) continue;
    // Nama yang seluruh katanya muncul di pertanyaan menang atas nama yang
    // cuma cocok sebagian, supaya "smkn 1" tidak jatuh ke SMKN 4.
    const nilai = cocok - 0.25 * (kata.length - cocok);
    if (nilai > nilaiTerbaik) {
      nilaiTerbaik = nilai;
      terbaik = t;
    }
  }
  return nilaiTerbaik >= 1 ? terbaik : null;
}

function cariKelurahan(q: string) {
  const qn = normal(q);
  return kelurahanData.find((k) => qn.includes(normal(k.kelurahan))) ?? null;
}

function cariJenis(q: string): string | null {
  const qn = ` ${normal(q)} `;
  for (const [jenis, kata] of KATA_JENIS) {
    if (kata.some((w) => qn.includes(w))) return jenis;
  }
  return null;
}

export function butuhLokasi(q: string): boolean {
  const qn = normal(q);
  return ["lokasi saya", "posisi saya", "dari sini", "tempat saya", "lokasiku"].some(
    (w) => qn.includes(w)
  );
}

/** Titik asal pertanyaan: posisi pengguna, atau titik tengah kelurahan. */
function cariAsal(
  q: string,
  data: DataTanya,
  posisi: [number, number] | null
): { koordinat: [number, number]; sebutan: string } | null {
  if (butuhLokasi(q) && posisi) {
    return { koordinat: posisi, sebutan: "lokasi Anda" };
  }
  const kel = cariKelurahan(q);
  const pusat = kel ? data.pusatKelurahan.get(kel.kelurahan) : undefined;
  if (kel && pusat) {
    return { koordinat: pusat, sebutan: `pusat Kelurahan ${kel.kelurahan}` };
  }
  return null;
}

// Hal-hal tentang Kota Bogor yang sering ditanyakan tetapi tidak ada datanya
// di proyek ini. Lebih baik dijawab terus terang daripada dibelokkan.
const DI_LUAR_DATA: [RegExp, string][] = [
  [/(tempat makan|restoran|kuliner|cafe|kafe|warung|kopi)/, "tempat makan"],
  [/(mall|mal |pusat belanja|belanja|pasar|toko)/, "pusat belanja dan pasar"],
  [/(wisata|rekreasi|kebun raya|taman|museum|hotel|penginapan)/, "tempat wisata dan penginapan"],
  [/(atm|bank |kantor pos|spbu|pom bensin)/, "ATM, bank, dan SPBU"],
  [/(masjid|gereja|vihara|pura|klenteng)/, "rumah ibadah"],
  [/(sejarah|budaya|asal usul|kenapa disebut)/, "sejarah dan budaya"],
  [/(macet|lalu lintas|angkot|transportasi umum|kereta|stasiun|terminal)/, "transportasi umum dan lalu lintas"],
  [/(cuaca|hujan|suhu|banjir)/, "cuaca"],
];

export function diLuarData(q: string): string | null {
  const qn = ` ${normal(q)} `;
  for (const [pola, nama] of DI_LUAR_DATA) if (pola.test(qn)) return nama;
  return null;
}

const CATATAN_GARIS_LURUS =
  "Jarak ini diukur garis lurus, bukan menurut jalan, jadi jarak tempuh sebenarnya akan lebih panjang.";

export function jawabLokasi(
  q: string,
  data: DataTanya,
  posisi: [number, number] | null
): string | null {
  const qn = normal(q);

  const luar = diLuarData(q);
  if (luar) {
    return `Saya belum punya data ${luar} di Kota Bogor, jadi tidak bisa menjawabnya. Basis data proyek ini hanya memuat batas 68 kelurahan, 119 fasilitas kesehatan, dan 553 sekolah.

Yang bisa saya jawab seputar itu, misalnya "rumah sakit terdekat dari lokasi saya", "berapa jarak dari Bantarjati ke RS Azra", atau "di Bantarjati ada apa saja".`;
  }

  // 1. "Di kelurahan X ada apa saja"
  if (/(ada apa|apa saja|apa aja|fasilitas apa|daftar fasilitas)/.test(qn)) {
    const kel = cariKelurahan(q);
    if (!kel) {
      return "Sebutkan nama kelurahannya ya, misalnya \"di Bantarjati ada apa saja\". Saya bisa menyebut fasilitas kesehatan dan sekolah yang terdata di sana.";
    }
    const isi = data.titik.filter((t) => t.kelurahan === kel.kelurahan);
    if (isi.length === 0) {
      return `Di Kelurahan ${kel.kelurahan} (${kel.kecamatan}) tidak ada fasilitas kesehatan maupun sekolah yang terdata pada basis data kami. Penduduknya ${kel.penduduk.toLocaleString("id-ID")} jiwa di atas lahan ${fmt(kel.luas_km2)} km².`;
    }
    const baris = Object.keys(LABEL_JENIS)
      .map((j) => {
        const n = isi.filter((t) => t.jenis === j);
        if (n.length === 0) return null;
        const nama = n.slice(0, 5).map((t) => t.nama);
        const sisa = n.length - nama.length;
        return `${LABEL_JENIS[j]} (${n.length}): ${nama.join(", ")}${sisa > 0 ? `, dan ${sisa} lainnya` : ""}`;
      })
      .filter(Boolean);
    return `Di Kelurahan ${kel.kelurahan} (${kel.kecamatan}) terdata ${isi.length} fasilitas.\n\n${baris.join("\n")}\n\nPenduduknya ${kel.penduduk.toLocaleString("id-ID")} jiwa, luas ${fmt(kel.luas_km2)} km², indeks kelayakhunian ${fmt(kel.skor_livable)} (peringkat #${kel.peringkat}).`;
  }

  // 2. "Di mana lokasi X". Pertanyaan jarak dikecualikan, karena kalimatnya
  // sering juga memuat kata "lokasi", misalnya "terdekat dari lokasi saya".
  if (
    /(di ?mana|dimana|lokasi|alamat|letak|posisi)/.test(qn) &&
    !/(terdekat|paling dekat|terjauh|jarak|berapa jauh)/.test(qn)
  ) {
    const t = cariTitik(q, data.titik);
    if (t) {
      return `${t.nama} (${LABEL_JENIS[t.jenis] ?? t.jenis}) ada di Kelurahan ${t.kelurahan}, Kecamatan ${t.kecamatan}. Koordinatnya ${t.lat.toFixed(5)}, ${t.lon.toFixed(5)}. Anda bisa membukanya lewat halaman peta dengan memilih Kelurahan ${t.kelurahan}.`;
    }
    const kel = cariKelurahan(q);
    if (kel) {
      return `Kelurahan ${kel.kelurahan} ada di Kecamatan ${kel.kecamatan}, Kota Bogor. Luasnya ${fmt(kel.luas_km2)} km² dengan ${kel.penduduk.toLocaleString("id-ID")} jiwa penduduk, dan indeks kelayakhuniannya ${fmt(kel.skor_livable)} (peringkat #${kel.peringkat} dari 68).`;
    }
  }

  const asal = cariAsal(q, data, posisi);

  // 3. "Rumah sakit terdekat dari X"
  if (/(terdekat|paling dekat|terjauh)/.test(qn)) {
    const jenis = cariJenis(q);
    if (!asal) {
      return "Saya perlu tahu titik awalnya. Sebutkan nama kelurahan, misalnya \"puskesmas terdekat dari Cibuluh\", atau tulis \"dari lokasi saya\" supaya saya pakai posisi Anda sekarang.";
    }
    const kandidat = jenis
      ? data.titik.filter((t) => t.jenis === jenis)
      : data.titik;
    if (kandidat.length === 0) return null;
    const terurut = kandidat
      .map((t) => ({ t, d: jarakMeter(asal.koordinat, [t.lon, t.lat]) }))
      .sort((a, b) => a.d - b.d);
    const tiga = terurut.slice(0, 3);
    const judul = jenis ? LABEL_JENIS[jenis] : "Fasilitas";
    return `${judul} terdekat dari ${asal.sebutan}:\n\n${tiga
      .map(
        (x, i) =>
          `${i + 1}. ${x.t.nama} — ${tulisJarak(x.d)} (${x.t.kelurahan}, ${x.t.kecamatan})`
      )
      .join("\n")}\n\n${CATATAN_GARIS_LURUS}`;
  }

  // 4. "Berapa jarak dari X ke <nama fasilitas>"
  const tujuan = cariTitik(q, data.titik);
  if (tujuan && /(jarak|jauh|berapa|menuju|ke )/.test(qn)) {
    if (!asal) {
      return `${tujuan.nama} ada di Kelurahan ${tujuan.kelurahan}, Kecamatan ${tujuan.kecamatan}. Untuk menghitung jaraknya, sebutkan titik awalnya, misalnya "dari Bantarjati ke ${tujuan.nama}" atau "dari lokasi saya".`;
    }
    const d = jarakMeter(asal.koordinat, [tujuan.lon, tujuan.lat]);
    return `Dari ${asal.sebutan} ke ${tujuan.nama} (${LABEL_JENIS[tujuan.jenis] ?? tujuan.jenis}, Kelurahan ${tujuan.kelurahan}) berjarak sekitar ${tulisJarak(d)}.\n\n${CATATAN_GARIS_LURUS}`;
  }

  return null;
}

export async function muatDataTanya(): Promise<DataTanya> {
  const [faskes, sekolah, kelurahan] = await Promise.all(
    ["faskes", "sekolah", "kelurahan"].map((n) =>
      fetch(`/data/${n}.geojson`).then((r) => r.json())
    )
  );

  const ambil = (g: { features: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }[] }): Titik[] =>
    g.features.map((f) => ({
      nama: f.properties.nama,
      jenis: f.properties.jenis,
      kelurahan: f.properties.kelurahan,
      kecamatan: f.properties.kecamatan,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }));

  // Titik tengah kelurahan dipakai sebagai titik awal kalau pengguna menyebut
  // nama kelurahan dan bukan posisinya sendiri.
  const pusatKelurahan = new Map<string, [number, number]>();
  for (const f of kelurahan.features) {
    const cincin: number[][][] =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates[0]]
        : f.geometry.coordinates.map((p: number[][][]) => p[0]);
    let x = 0;
    let y = 0;
    let n = 0;
    for (const r of cincin) {
      for (const [lon, lat] of r) {
        x += lon;
        y += lat;
        n++;
      }
    }
    if (n > 0) pusatKelurahan.set(f.properties.kelurahan, [x / n, y / n]);
  }

  return { titik: [...ambil(faskes), ...ambil(sekolah)], pusatKelurahan };
}
