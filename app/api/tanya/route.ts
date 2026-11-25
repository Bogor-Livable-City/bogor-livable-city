// Jembatan ke Gemini untuk Tanya Bogor.
//
// Dipanggil hanya kalau pertanyaannya tidak bisa dijawab dari data sendiri.
// Kuncinya dibaca dari environment variable di sisi server; kalau dipanggil
// langsung dari peramban, siapa pun bisa mengambilnya lewat DevTools.
//
// Butuh dua environment variable di Vercel:
//   GEMINI_API_KEY  wajib, dari https://aistudio.google.com/apikey
//   GEMINI_MODEL    opsional, bawaannya gemini-3.5-flash-lite

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { kelurahanData } from "../../kelurahan-data";
import { fmt } from "../../lib/livability";

/** Nama fasilitas per kelurahan, dibaca sekali saat modul dimuat. */
function muatTitik(berkas: string): Map<string, string[]> {
  const peta = new Map<string, string[]>();
  try {
    const isi = readFileSync(
      join(process.cwd(), "public", "data", `${berkas}.geojson`),
      "utf8"
    );
    const fitur = JSON.parse(isi).features as {
      properties: { nama?: string; kelurahan?: string };
    }[];
    for (const { properties } of fitur) {
      const { nama, kelurahan } = properties;
      if (!nama || !kelurahan) continue;
      const daftar = peta.get(kelurahan);
      if (daftar) daftar.push(nama);
      else peta.set(kelurahan, [nama]);
    }
  } catch (e) {
    // Kalau berkasnya tidak terbaca, asisten tetap jalan tanpa daftar ini.
    console.error(`Gagal membaca ${berkas}.geojson:`, e);
  }
  return peta;
}

const FASKES = muatTitik("faskes");
const SEKOLAH = muatTitik("sekolah");

const MODEL_BAWAAN = "gemini-3.5-flash-lite";

// Grounding Google Search ditolak di tier gratis untuk model Gemini 3.x, jadi
// defaultnya mati. Setelah penagihan diaktifkan di Google AI Studio, pasang
// GEMINI_GROUNDING=1 di Vercel supaya model boleh mencari sendiri.
const PENCARIAN_HIDUP = `Kamu punya Google Search. Pakai setiap kali jawabannya berupa hal yang bisa berubah atau yang tidak kamu hafal persis: alamat, jam buka, harga, nomor telepon, menu, jumlah gerai, atau kabar terbaru. Cari dulu, lalu sampaikan hasilnya sebagai jawaban. Kalau setelah dicari pun tidak ketemu, cukup katakan tidak ketemu.`;

const PENCARIAN_MATI = `Kamu tidak bisa mencari di internet, jadi hal yang berubah-ubah seperti jam buka, harga, nomor telepon, dan menu memang tidak kamu ketahui. Katakan terus terang kamu tidak punya datanya, cukup satu kalimat, lalu lanjutkan menjawab bagian lain yang kamu tahu.`;

function aturan(grounding: boolean): string {
  return `Kamu "Tanya Bogor", asisten pada atlas WebGIS kelayakhunian Kota Bogor.
Tugasmu menjawab pertanyaan orang tentang Kota Bogor.

Urutan berpikirmu:
1. Periksa dulu apakah yang ditanyakan memang ada di Kota Bogor. Kota Bogor hanya 6 kecamatan dan 68 kelurahan, wilayahnya perkotaan. Puncak, Cisarua, Megamendung, Ciawi, Sentul, Babakan Madang, Pamijahan, Dramaga, Gunung Salak, dan Gunung Gede Pangrango ada di Kabupaten Bogor, bukan Kota.
2. Kalau jelas di luar Kota Bogor, katakan begitu, dan sebutkan di mana sebenarnya.
3. Kalau ada di Kota Bogor, jawab selengkap yang kamu bisa. Kampus, sekolah, rumah sakit, pasar, stasiun, terminal, mal, kafe, restoran, taman, tempat ibadah, dan kawasan wisata semuanya boleh dijawab.

${grounding ? PENCARIAN_HIDUP : PENCARIAN_MATI}
Jangan pernah menyuruh pengguna memeriksa sendiri di Google Maps atau aplikasi lain. Mengoper pengguna ke aplikasi lain terasa seperti disuruh pergi.

Angka indeks, skor, peringkat, penduduk, luas, dan jumlah sarana selalu diambil dari DATA PROYEK di bawah, bukan dari hasil pencarian.

Kalau ditanya apakah suatu tempat punya puskesmas, rumah sakit, klinik, atau sekolah, dan yang disebut bukan nama kelurahan melainkan nama jalan, kawasan, atau patokan: tentukan dulu tempat itu masuk kelurahan mana, lalu baca daftar fasilitas kelurahan tersebut di DATA PROYEK dan sebutkan namanya. Katakan di kelurahan mana kamu mencarinya.
Daftar itu hasil pendataan proyek ini, bukan sensus seluruh kota. Kalau kelurahannya tercatat tidak punya, katakan tidak ada yang terdata di sana, bukan tidak ada sama sekali.

Dua hal yang tetap di luar kemampuanmu:
- Menghitung jarak antartitik. Arahkan ke halaman peta.
- Ada Kelurahan Curug di Kota Bogor, dan itu bukan air terjun. Jangan tertukar.

Gaya: Bahasa Indonesia yang wajar, maksimal tiga paragraf pendek. Jangan menyebut dirimu model bahasa.`;
}

/** Ringkasan 68 kelurahan, cukup kecil untuk dikirim tiap permintaan. */
function tabelRingkas(): string {
  return kelurahanData
    .map(
      (k) =>
        `${k.peringkat}. ${k.kelurahan} (${k.kecamatan}) skor ${fmt(k.skor_livable)} ${k.kelas}`
    )
    .join("\n");
}

/** Nama tiap fasilitas, dikelompokkan per kelurahan.
 *
 *  Tanpa daftar ini model hanya menerima jumlahnya, sehingga pertanyaan
 *  "di X ada puskesmas tidak" tidak bisa dijawab. Nama jalan juga tidak ada di
 *  data proyek; yang bisa memetakan jalan ke kelurahan hanya pengetahuan umum
 *  model, lalu kelurahan itu dicocokkan ke daftar ini. */
function daftarFasilitas(): string {
  const kelurahan = [...new Set([...FASKES.keys(), ...SEKOLAH.keys()])].sort();
  return kelurahan
    .map((k) => {
      const kesehatan = FASKES.get(k) ?? [];
      const sekolah = SEKOLAH.get(k) ?? [];
      return (
        `${k} | kesehatan: ${kesehatan.join(", ") || "tidak ada yang terdata"}` +
        ` | sekolah: ${sekolah.join(", ") || "tidak ada yang terdata"}`
      );
    })
    .join("\n");
}

/** Baris lengkap kelurahan yang namanya disebut di pertanyaan. */
function rincianDisebut(pertanyaan: string): string {
  const q = pertanyaan.toLowerCase();
  const cocok = kelurahanData.filter((k) => q.includes(k.kelurahan.toLowerCase()));
  if (cocok.length === 0) return "";
  return (
    "\n\nRincian kelurahan yang disebut:\n" +
    cocok
      .slice(0, 3)
      .map(
        (k) =>
          `${k.kelurahan}, Kecamatan ${k.kecamatan}. Indeks ${fmt(k.skor_livable)} (${k.kelas}), peringkat ${k.peringkat} dari 68. ` +
          `Dimensi: kesehatan ${fmt(k.skor_kesehatan)}, pendidikan ${fmt(k.skor_pendidikan)}, sosial ${fmt(k.skor_sosial)}, ekonomi ${fmt(k.skor_ekonomi)}, transportasi ${fmt(k.skor_transportasi)}, lingkungan ${fmt(k.skor_lingkungan)}. ` +
          `Penduduk ${k.penduduk.toLocaleString("id-ID")} jiwa, luas ${fmt(k.luas_km2)} km², kepadatan ${Math.round(k.kepadatan_jiwa_km2).toLocaleString("id-ID")} jiwa/km². ` +
          `Sarana: ${k.n_rs} rumah sakit, ${k.n_puskesmas} puskesmas, ${k.n_klinik} klinik, ${k.n_sd} SD, ${k.n_smp} SMP, ${k.n_sma_smk} SMA/SMK. ` +
          `Tutupan vegetasi ${fmt(k.vegetasi_pct, 1)}%.`
      )
      .join("\n")
  );
}

export async function POST(request: Request) {
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) {
    return NextResponse.json(
      { jawaban: "Asisten pintar belum diaktifkan karena kunci API belum dipasang." },
      { status: 503 }
    );
  }

  let pertanyaan = "";
  try {
    const body = await request.json();
    pertanyaan = typeof body?.pertanyaan === "string" ? body.pertanyaan.slice(0, 500) : "";
  } catch {
    pertanyaan = "";
  }
  if (!pertanyaan.trim()) {
    return NextResponse.json({ jawaban: "Pertanyaannya kosong." }, { status: 400 });
  }

  const konteks =
    `Peringkat 68 kelurahan Kota Bogor menurut indeks kelayakhunian:\n${tabelRingkas()}` +
    `\n\nFasilitas terdata per kelurahan:\n${daftarFasilitas()}` +
    rincianDisebut(pertanyaan);
  const model = process.env.GEMINI_MODEL || MODEL_BAWAAN;
  const grounding = process.env.GEMINI_GROUNDING === "1";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `${aturan(grounding)}\n\nDATA PROYEK:\n${konteks}` }],
          },
          contents: [{ role: "user", parts: [{ text: pertanyaan }] }],
          ...(grounding ? { tools: [{ google_search: {} }] } : {}),
          // Suhu rendah supaya model lebih patuh pada aturan dan tidak mengarang.
          generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
        }),
      }
    );

    if (!res.ok) {
      const mentah = await res.text();
      console.error("Gemini menolak permintaan:", res.status, mentah);
      // Pesan galat Google menyebut sebabnya (kunci salah, model tidak ada,
      // kuota habis) dan tidak memuat kuncinya, jadi aman diteruskan.
      let sebab = `HTTP ${res.status}`;
      try {
        sebab = JSON.parse(mentah)?.error?.message ?? sebab;
      } catch {}
      return NextResponse.json(
        { jawaban: `Asisten pintar sedang tidak bisa dihubungi. Sebabnya: ${sebab}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const teks = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();

    return NextResponse.json({
      jawaban: teks || "Saya belum bisa menjawab pertanyaan itu.",
    });
  } catch (e) {
    console.error("Gagal memanggil Gemini:", e);
    return NextResponse.json(
      { jawaban: "Asisten pintar sedang tidak bisa dihubungi. Coba lagi sebentar lagi." },
      { status: 502 }
    );
  }
}

// Supaya model yang sedang dipakai bisa dicek tanpa membuka kode atau
// dasbor Vercel. Nama model bukan rahasia; kuncinya tidak pernah ikut.
export async function GET() {
  return NextResponse.json({
    model: process.env.GEMINI_MODEL || MODEL_BAWAAN,
    sumber: process.env.GEMINI_MODEL ? "GEMINI_MODEL di Vercel" : "bawaan kode",
    kunciTerpasang: Boolean(process.env.GEMINI_API_KEY),
    grounding: process.env.GEMINI_GROUNDING === "1",
    // Supaya bisa dipastikan berkas geojson ikut terbaca di server Vercel
    // tanpa harus memakai kuota Gemini.
    faskesTerbaca: [...FASKES.values()].reduce((n, v) => n + v.length, 0),
    sekolahTerbaca: [...SEKOLAH.values()].reduce((n, v) => n + v.length, 0),
  });
}
