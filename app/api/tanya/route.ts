// Jembatan ke Gemini untuk Tanya Bogor.
//
// Dipanggil hanya kalau pertanyaannya tidak bisa dijawab dari data sendiri.
// Kuncinya dibaca dari environment variable di sisi server; kalau dipanggil
// langsung dari peramban, siapa pun bisa mengambilnya lewat DevTools.
//
// Butuh dua environment variable di Vercel:
//   GEMINI_API_KEY  wajib, dari https://aistudio.google.com/apikey
//   GEMINI_MODEL    opsional, bawaannya gemini-3.5-flash-lite

import { NextResponse } from "next/server";
import { kelurahanData } from "../../kelurahan-data";
import { fmt } from "../../lib/livability";

const MODEL_BAWAAN = "gemini-3.5-flash-lite";

const ATURAN = `Kamu "Tanya Bogor", asisten pada atlas WebGIS kelayakhunian Kota Bogor.
Tugasmu membantu orang mengenal Kota Bogor, jadi jawablah selama kamu bisa.

Urutan berpikirmu:
1. Periksa dulu apakah yang ditanyakan memang ada di Kota Bogor. Kota Bogor hanya 6 kecamatan dan 68 kelurahan, wilayahnya perkotaan. Puncak, Cisarua, Megamendung, Ciawi, Sentul, Babakan Madang, Pamijahan, Gunung Salak, dan Gunung Gede Pangrango ada di Kabupaten Bogor, bukan Kota.
2. Kalau jelas di luar Kota Bogor, katakan begitu, dan sebutkan di mana sebenarnya kalau kamu tahu.
3. Kalau ada di Kota Bogor, jawab. Sebutkan kawasan, kelurahan, atau kecamatannya kalau kamu tahu, dan ceritakan seperlunya. Kampus, sekolah, rumah sakit, pasar, stasiun, terminal, mal, restoran, taman, tempat ibadah, dan kawasan wisata semuanya boleh dijawab.
4. Kalau kamu tidak yakin tempat itu ada, bilang tidak yakin. Jangan mengarang.

Soal angka:
- Indeks, skor, peringkat, penduduk, luas, dan jumlah sarana: pakai DATA PROYEK di bawah, dan itulah satu-satunya angka yang boleh kamu sebut sebagai pasti.
- Informasi lain berasal dari pengetahuan umummu. Sebutkan hal itu sekali saja, singkat.

Yang tetap tidak boleh, karena kamu tidak punya cara memastikannya:
- Alamat lengkap dengan nomor bangunan, nomor telepon, jam buka, dan harga. Sarankan memeriksanya di aplikasi peta.
- Jumlah pasti gerai atau cabang. Boleh menyebut contoh yang kamu yakin ada.
- Menghitung jarak.
- Mengira nama kelurahan sebagai nama tempat lain. Ada Kelurahan Curug, dan itu bukan air terjun.

Gaya: Bahasa Indonesia yang wajar, maksimal tiga paragraf pendek. Jangan menyebut dirimu model bahasa.`;

/** Ringkasan 68 kelurahan, cukup kecil untuk dikirim tiap permintaan. */
function tabelRingkas(): string {
  return kelurahanData
    .map(
      (k) =>
        `${k.peringkat}. ${k.kelurahan} (${k.kecamatan}) skor ${fmt(k.skor_livable)} ${k.kelas}`
    )
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

  const konteks = `Peringkat 68 kelurahan Kota Bogor menurut indeks kelayakhunian:\n${tabelRingkas()}${rincianDisebut(pertanyaan)}`;
  const model = process.env.GEMINI_MODEL || MODEL_BAWAAN;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${ATURAN}\n\nDATA PROYEK:\n${konteks}` }] },
          contents: [{ role: "user", parts: [{ text: pertanyaan }] }],
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
  });
}
