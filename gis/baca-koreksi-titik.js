// Membaca dua laporan md final (hasil pengecekan manual) menjadi satu tabel koreksi,
// lalu mengujinya terhadap public/data/*.geojson dan poligon kelurahan.
// Keluaran: gis/koreksi-titik.csv

const fs = require("fs");
const path = require("path");

const SUMBER = [
  { file: process.argv[2], asal: "meragukan" },
  { file: process.argv[3], asal: "fallback" },
];

// --- titik dalam poligon, ray casting ---
const kel = JSON.parse(fs.readFileSync("public/data/kelurahan.geojson", "utf8")).features;
function diRing(x, y, ring) {
  let di = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) di = !di;
  }
  return di;
}
function kelurahanDi(lon, lat) {
  for (const f of kel) {
    for (const poly of f.geometry.coordinates) {
      if (!diRing(lon, lat, poly[0])) continue;
      let dalamLubang = false;
      for (let i = 1; i < poly.length; i++) if (diRing(lon, lat, poly[i])) dalamLubang = true;
      if (!dalamLubang) return f.properties;
    }
  }
  return null;
}

// --- baris tabel md ---
// Pipa di dalam sel ditulis "\|", jadi dipecah hanya pada pipa yang tidak di-escape.
function selBaris(baris) {
  const ESC = "\\|";
  const TANDA = "\u0000";
  return baris
    .split(ESC).join(TANDA)
    .split("|")
    .slice(1, -1)
    .map((sel) => sel.trim().split(TANDA).join("|").split("**").join(""));
}

const koreksi = [];
const masalah = [];

for (const { file, asal } of SUMBER) {
  const teks = fs.readFileSync(file, "utf8");
  const baris = teks.split(/\r?\n/);

  let seksi = null;
  for (const b of baris) {
    if (b.startsWith("## ")) seksi = b.slice(3).trim();
    if (!b.trim().startsWith("|")) continue;
    const sel = selBaris(b);
    if (sel[0] === "Nama" || /^-+$/.test(sel[0])) continue;

    if (seksi === "Semua titik final" && sel.length >= 10) {
      const [nama, jenis, koordLama, koordFinal, , kelFinal, kecFinal, namaGoogle, status] = sel;
      const [latLama, lonLama] = koordLama.split(",").map((v) => parseFloat(v));
      const dipertahankan = status === "dipertahankan";
      const [latBaru, lonBaru] = dipertahankan
        ? [latLama, lonLama]
        : koordFinal.split(",").map((v) => parseFloat(v));
      koreksi.push({
        asal, nama, jenis, status,
        lonLama, latLama, lonBaru, latBaru,
        kelFinal, kecFinal, namaGoogle,
        aksi: dipertahankan ? "pertahankan" : "ganti",
      });
    }

    if (seksi === "Dihapus dari dataset" && sel.length >= 5) {
      const [nama, jenis, kelLama, koordLama, alasan] = sel;
      const [latLama, lonLama] = koordLama.split(",").map((v) => parseFloat(v));
      koreksi.push({
        asal, nama, jenis, status: "dihapus",
        lonLama, latLama, lonBaru: null, latBaru: null,
        kelFinal: kelLama, kecFinal: "", namaGoogle: "", alasan,
        aksi: "hapus",
      });
    }
  }
}

// --- cocokkan ke geojson ---
const DIR_TITIK = process.argv[4] || "public/data";
const layer = {};
for (const nm of ["faskes", "sekolah"]) {
  layer[nm] = JSON.parse(fs.readFileSync(DIR_TITIK + "/" + nm + ".geojson", "utf8"));
}
const JENIS_FASKES = new Set(["puskesmas", "klinik", "rs"]);

for (const k of koreksi) {
  k.layer = JENIS_FASKES.has(k.jenis) ? "faskes" : "sekolah";
  const kandidat = layer[k.layer].features.filter((f) => {
    const p = f.properties;
    if (p.nama !== k.nama || p.jenis !== k.jenis) return false;
    const [lon, lat] = f.geometry.coordinates;
    return Math.abs(lon - k.lonLama) < 2e-6 && Math.abs(lat - k.latLama) < 2e-6;
  });
  if (kandidat.length !== 1) {
    masalah.push(`${k.layer}/${k.nama}: ${kandidat.length} titik cocok di geojson (harus 1)`);
    k.cocok = null;
    continue;
  }
  k.cocok = kandidat[0];
  k.kualitasLama = kandidat[0].properties.kualitas;
  k.npsn = kandidat[0].properties.npsn ?? "";
  k.kelLama = kandidat[0].properties.kelurahan;
  k.kecLama = kandidat[0].properties.kecamatan;
  if (k.kualitasLama !== k.asal) {
    masalah.push(`${k.nama}: ada di laporan "${k.asal}" tapi kualitasnya "${k.kualitasLama}"`);
  }

  if (k.aksi === "hapus") continue;

  const p = kelurahanDi(k.lonBaru, k.latBaru);
  k.kelPoligon = p ? p.kelurahan : null;
  k.kecPoligon = p ? p.kecamatan : null;
  const samakan = (s) => (s || "").toUpperCase().replace(/[^A-Z]/g, "");
  k.poligonCocok =
    p !== null && samakan(p.kelurahan) === samakan(k.kelFinal) ? "ya" : p === null ? "di luar batas" : "tidak";
}

// --- CSV ---
const kolom = [
  "layer", "nama", "jenis", "npsn", "asal", "aksi",
  "kel_lama", "kec_lama", "lon_lama", "lat_lama",
  "kel_final", "kec_final", "lon_baru", "lat_baru",
  "kel_poligon", "kec_poligon", "poligon_cocok", "nama_google",
];
const csv = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const baris = koreksi.map((k) =>
  [
    k.layer, k.nama, k.jenis, k.npsn, k.asal, k.aksi,
    k.kelLama, k.kecLama, k.lonLama, k.latLama,
    k.kelFinal, k.kecFinal, k.lonBaru, k.latBaru,
    k.kelPoligon, k.kecPoligon, k.poligonCocok, k.namaGoogle,
  ].map(csv).join(",")
);
fs.writeFileSync("gis/koreksi-titik.csv", [kolom.join(","), ...baris].join("\n") + "\n");

// --- ringkasan ---
const hitung = (f) => koreksi.filter(f).length;
console.log("baris koreksi:", koreksi.length);
console.log("  ganti koordinat:", hitung((k) => k.aksi === "ganti"));
console.log("  pertahankan    :", hitung((k) => k.aksi === "pertahankan"));
console.log("  hapus          :", hitung((k) => k.aksi === "hapus"));
console.log("  tidak cocok ke geojson:", hitung((k) => k.cocok === null));
console.log("");
console.log("uji poligon atas koordinat final:");
console.log("  cocok dengan kel_final :", hitung((k) => k.poligonCocok === "ya"));
console.log("  BEDA dari kel_final    :", hitung((k) => k.poligonCocok === "tidak"));
console.log("  di luar Kota Bogor     :", hitung((k) => k.poligonCocok === "di luar batas"));

const beda = koreksi.filter((k) => k.poligonCocok && k.poligonCocok !== "ya");
if (beda.length) {
  console.log("\n-- perlu diputuskan --");
  for (const k of beda) {
    console.log(`  ${k.nama} (${k.jenis}): kel_final "${k.kelFinal}" vs poligon "${k.kelPoligon ?? "di luar batas"}"`);
  }
}

// koordinat final yang bertumpuk
const perKoord = new Map();
for (const k of koreksi) {
  if (k.aksi === "hapus") continue;
  const key = `${k.lonBaru},${k.latBaru}`;
  if (!perKoord.has(key)) perKoord.set(key, []);
  perKoord.get(key).push(k.nama);
}
const tumpuk = [...perKoord.entries()].filter(([, v]) => v.length > 1);
if (tumpuk.length) {
  console.log("\n-- koordinat final yang masih bertumpuk --");
  for (const [key, v] of tumpuk) console.log(`  ${key}: ${v.join("; ")}`);
}

if (masalah.length) {
  console.log("\n-- MASALAH --");
  for (const m of masalah) console.log("  " + m);
}
