"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { Header, Icon } from "../components/ui";
import { districts } from "../data";
import { kelurahanData } from "../kelurahan-data";
import { scoreToClass } from "../lib/livability";
import {
  butuhLokasi,
  jawabLokasi,
  muatDataTanya,
  type DataTanya,
} from "../lib/tanya-bogor";

type Message = { role: "user" | "bot"; text: string };

const examples = [
  "Rumah sakit terdekat dari lokasi saya",
  "Berapa jarak dari Bantarjati ke RS Hermina Bogor?",
  "Di Bantarjati ada apa saja?",
  "Bandingkan Pabaton dengan Bantarjati.",
];

function generateAnswer(query: string): string {
  const q = query.toLowerCase();

  const matchedKel = kelurahanData.filter((k) =>
    q.includes(k.kelurahan.toLowerCase())
  );

  if (matchedKel.length >= 2) {
    const [a, b] = matchedKel;
    const diff = Math.abs(a.skor_livable - b.skor_livable)
      .toFixed(2)
      .replace(".", ",");
    const winner = a.skor_livable >= b.skor_livable ? a : b;
    return `Perbandingan ${a.kelurahan} (${a.kecamatan}, Peringkat #${a.peringkat}, skor ${a.skor_livable
      .toFixed(2)
      .replace(".", ",")}) vs ${b.kelurahan} (${b.kecamatan}, Peringkat #${b.peringkat}, skor ${b.skor_livable
      .toFixed(2)
      .replace(".", ",")}): ${winner.kelurahan} unggul selisih ${diff} poin. Pada dimensi Kesehatan, ${
      a.kelurahan
    } mencatat ${a.skor_kesehatan.toFixed(2).replace(".", ",")} sedangkan ${
      b.kelurahan
    } ${b.skor_kesehatan.toFixed(2).replace(".", ",")}. Pada Lingkungan (RTH), ${
      a.kelurahan
    } memiliki tutupan vegetasi ${a.vegetasi_pct.toFixed(1).replace(".", ",")}% dibanding ${
      b.kelurahan
    } ${b.vegetasi_pct.toFixed(1).replace(".", ",")}%.`;
  }

  if (matchedKel.length === 1) {
    const k = matchedKel[0];
    return `Kelurahan ${k.kelurahan} (Kecamatan ${k.kecamatan}) berada di peringkat #${
      k.peringkat
    } dari 68 kelurahan dengan Indeks Kelayakhunian ${k.skor_livable
      .toFixed(2)
      .replace(".", ",")} (${scoreToClass(
      k.skor_livable
    )}). Rincian 6 dimensi: Kesehatan ${k.skor_kesehatan
      .toFixed(2)
      .replace(".", ",")}, Pendidikan ${k.skor_pendidikan
      .toFixed(2)
      .replace(".", ",")}, Sosial ${k.skor_sosial
      .toFixed(2)
      .replace(".", ",")}, Transportasi ${k.skor_transportasi
      .toFixed(2)
      .replace(".", ",")}, Ekonomi ${k.skor_ekonomi
      .toFixed(2)
      .replace(".", ",")}, dan Lingkungan ${k.skor_lingkungan
      .toFixed(2)
      .replace(".", ",")} (vegetasi ${k.vegetasi_pct.toFixed(1).replace(".", ",")}%). Jarak ke RS terdekat ${Math.round(
      k.jarak_rs_m
    ).toLocaleString("id-ID")} m dan Puskesmas ${Math.round(
      k.jarak_puskesmas_m
    ).toLocaleString("id-ID")} m.`;
  }

  if (
    q.includes("jauh") ||
    q.includes("blank") ||
    q.includes("puskesmas") ||
    q.includes("rumah sakit") ||
    q.includes("faskes")
  ) {
    const farthestPkm = [...kelurahanData].sort(
      (a, b) => b.jarak_puskesmas_m - a.jarak_puskesmas_m
    )[0];
    const farthestRs = [...kelurahanData].sort(
      (a, b) => b.jarak_rs_m - a.jarak_rs_m
    )[0];
    const avgCov = (
      kelurahanData.reduce((s, k) => s + k.cakupan_faskes_pct, 0) /
      kelurahanData.length
    )
      .toFixed(1)
      .replace(".", ",");
    return `Berdasarkan analisis buffer faskes, rata-rata cakupan layanan faskes kelurahan di Kota Bogor mencapai ${avgCov}%. Kelurahan dengan jarak jaringan jalan terjauh ke Puskesmas adalah ${
      farthestPkm.kelurahan
    } (${farthestPkm.kecamatan}) sejauh ${(farthestPkm.jarak_puskesmas_m / 1000)
      .toFixed(2)
      .replace(".", ",")} km, sedangkan jarak terjauh ke Rumah Sakit tercatat di ${
      farthestRs.kelurahan
    } (${(farthestRs.jarak_rs_m / 1000).toFixed(2).replace(".", ",")} km).`;
  }

  if (
    q.includes("lingkungan") ||
    q.includes("hijau") ||
    q.includes("rth") ||
    q.includes("vegetasi")
  ) {
    const topEnv = [...kelurahanData].sort(
      (a, b) => b.skor_lingkungan - a.skor_lingkungan
    );
    return `Dimensi Lingkungan (tutupan vegetasi & RTH per jiwa) tertinggi diraih oleh ${
      topEnv[0].kelurahan
    } (${topEnv[0].kecamatan}) dengan skor ${topEnv[0].skor_lingkungan
      .toFixed(2)
      .replace(".", ",")} dan tutupan vegetasi ${topEnv[0].vegetasi_pct
      .toFixed(1)
      .replace(".", ",")}% (${topEnv[0].vegetasi_m2_per_jiwa
      .toFixed(1)
      .replace(".", ",")} m²/jiwa), diikuti oleh ${topEnv[1].kelurahan} (${topEnv[1].vegetasi_pct
      .toFixed(1)
      .replace(".", ",")}%) dan ${topEnv[2].kelurahan} (${topEnv[2].vegetasi_pct
      .toFixed(1)
      .replace(".", ",")}%).`;
  }

  if (q.includes("kecamatan")) {
    const topKec = districts[0];
    const lowKec = districts[districts.length - 1];
    return `Dari 6 kecamatan di Kota Bogor, ${topKec.name} menempati urutan tertinggi dengan skor rata-rata ${topKec.score
      .toFixed(2)
      .replace(".", ",")} (${topKec.villages} kelurahan, ${topKec.population} penduduk). Sementara itu, ${
      lowKec.name
    } memiliki rata-rata ${lowKec.score
      .toFixed(2)
      .replace(".", ",")} (${lowKec.villages} kelurahan) dan menjadi prioritas pemerataan infrastruktur.`;
  }

  return `Saya menjawab dari data Ruang Bogor sendiri: 68 kelurahan, 119 fasilitas kesehatan, dan 553 sekolah. Di luar itu saya belum bisa, misalnya tempat makan, pusat belanja, atau sejarah kota.

Yang bisa saya jawab:
• "Rumah sakit terdekat dari Cibuluh" atau "dari lokasi saya"
• "Berapa jarak dari Bantarjati ke RS Hermina Bogor"
• "Di Bantarjati ada apa saja"
• "Kelurahan mana yang peringkat #1"
• "Bandingkan Pabaton dengan Bantarjati"`;
}

async function tanyaGemini(pertanyaan: string): Promise<string | null> {
  try {
    const res = await fetch("/api/tanya", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pertanyaan }),
    });
    const data = await res.json();
    return res.ok && typeof data?.jawaban === "string" ? data.jawaban : null;
  } catch {
    return null;
  }
}

function AssistantWorkspace() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const consumedRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [data, setData] = useState<DataTanya | null>(null);
  const [menunggu, setMenunggu] = useState(false);
  const [posisi, setPosisi] = useState<[number, number] | null>(null);
  // Pertanyaan dari parameter ?q= bisa jalan sebelum geojson selesai dimuat,
  // jadi janjinya disimpan dan ditunggu di dalam ask().
  const muatRef = useRef<Promise<DataTanya | null> | null>(null);

  useEffect(() => {
    muatRef.current = muatDataTanya()
      .then((d) => {
        setData(d);
        return d;
      })
      .catch(() => null);
  }, []);

  const mintaPosisi = () =>
    new Promise<[number, number] | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve([p.coords.longitude, p.coords.latitude]),
        () => resolve(null),
        { timeout: 8000 }
      );
    });

  const ask = async (text: string) => {
    if (!text.trim()) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);

    const siap = data ?? (await muatRef.current) ?? null;

    let pos = posisi;
    if (butuhLokasi(text) && !pos) {
      pos = await mintaPosisi();
      if (pos) setPosisi(pos);
    }

    // Pertanyaan yang ada datanya dijawab lokal supaya angkanya pasti; model
    // bahasa tidak bisa menghitung jarak dan akan mengarang angkanya.
    const lokal =
      butuhLokasi(text) && !pos
        ? "Saya tidak bisa membaca posisi Anda. Izinkan akses lokasi di peramban, atau sebutkan nama kelurahan sebagai titik awal, misalnya \"rumah sakit terdekat dari Cibuluh\"."
        : siap && jawabLokasi(text, siap, pos);

    if (lokal) {
      setMessages((prev) => [...prev, { role: "bot", text: lokal }]);
      return;
    }

    setMenunggu(true);
    const reply = (await tanyaGemini(text)) ?? generateAnswer(text);
    setMenunggu(false);
    setMessages((prev) => [...prev, { role: "bot", text: reply }]);
  };

  useEffect(() => {
    if (initialQuery && consumedRef.current !== initialQuery) {
      consumedRef.current = initialQuery;
      ask(initialQuery);
    }
  }, [initialQuery]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <main>
      <aside className="assistant-aside">
        <div>
          <p className="eyebrow">Pencarian data spasial</p>
          <h1>Tanya Bogor</h1>
          <p>
            Cari jawaban langsung dari atribut geospasial 68 kelurahan dan 6
            kecamatan di Kota Bogor.
          </p>
        </div>
        <div className="assistant-scope">
          <b>Cakupan analisis langsung</b>
          <span>
            <Icon name="check" />
            Profil &amp; skor 68 kelurahan
          </span>
          <span>
            <Icon name="check" />
            Perbandingan langsung 2 kelurahan
          </span>
          <span>
            <Icon name="check" />
            Blank spot &amp; jarak fasilitas kesehatan
          </span>
          <span>
            <Icon name="check" />
            Agregasi 6 kecamatan
          </span>
        </div>
        <small>
          <Icon name="info" size={15} />
          Menjawab langsung dari atribut 68 kelurahan dan hasil analisis buffer
          spasial.
        </small>
      </aside>

      <section className="chat-stage">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <h2>Apa yang ingin Anda periksa?</h2>
            <p>
              Ketik nama kelurahan (misal: <b>Pabaton</b>, <b>Bantarjati</b>,{" "}
              <b>Pasir Kuda</b>, <b>Balumbang Jaya</b>) atau pilih salah satu
              pertanyaan di bawah.
            </p>
            <div className="prompt-examples">
              {examples.map((x) => (
                <button type="button" key={x} onClick={() => ask(x)}>
                  {x}
                  <Icon name="arrow" size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="message-list">
            <div className="chat-date">
              Sesi Pencarian Data Spasial · 68 Kelurahan
            </div>
            {messages.map((m, i) => (
              <div className={"message " + m.role} key={i}>
                {m.role === "bot" && (
                  <span aria-hidden="true">
                    <Icon name="map" size={16} />
                  </span>
                )}
                <div>
                  {m.text}
                  {m.role === "bot" && (
                    <small>
                      Sumber: Geodatabase Ruang Bogor · 68 Kelurahan (WGS 84)
                    </small>
                  )}
                </div>
              </div>
            ))}
            {menunggu && (
              <div className="message bot" aria-live="polite">
                <span aria-hidden="true">
                  <Icon name="map" size={16} />
                </span>
                <div>Sedang mencari jawabannya...</div>
              </div>
            )}
          </div>
        )}

        <form className="chat-input" onSubmit={submit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sebutkan nama kelurahan atau bandingkan 2 wilayah..."
            aria-label="Ketik pertanyaan seputar kelurahan di Kota Bogor"
          />
          <button type="submit" aria-label="Kirim pertanyaan">
            <Icon name="arrow" />
          </button>
          <small>
            Tekan Enter untuk mengirim · Terhubung ke 68 kelurahan Kota Bogor.
          </small>
        </form>
      </section>
    </main>
  );
}

export default function AssistantPage() {
  return (
    <div className="assistant-page">
      <Header />
      <Suspense
        fallback={
          <main>
            <section className="chat-stage">
              <div className="chat-empty">
                <p>Memuat halaman Tanya Bogor...</p>
              </div>
            </section>
          </main>
        }
      >
        <AssistantWorkspace />
      </Suspense>
    </div>
  );
}
