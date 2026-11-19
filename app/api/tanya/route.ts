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

Batasan:
- Jawab hanya seputar Kota Bogor. Kalau pertanyaannya di luar itu, tolak dengan sopan dan tawarkan membantu soal Bogor.
- Jawab dalam Bahasa Indonesia yang wajar, maksimal tiga paragraf pendek.
- Untuk angka indeks, skor, peringkat, penduduk, dan luas, pakai HANYA data yang diberikan di bawah. Jangan menghitung sendiri dan jangan mengarang angka.
- Untuk hal yang tidak ada di data, misalnya tempat makan, sejarah, atau transportasi, kamu boleh memakai pengetahuan umummu, tetapi katakan dulu bahwa itu di luar basis data proyek ini.
- Kalau tidak yakin, bilang tidak tahu. Jangan menebak nama tempat, alamat, atau jam buka.
- Jangan menyebut dirimu model bahasa atau menyebut Gemini.`;

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
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
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
