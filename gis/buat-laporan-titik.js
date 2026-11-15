// Mendaftar titik faskes dan sekolah yang koordinatnya belum bisa dipercaya,
// yaitu yang kolom `kualitas`-nya bukan "baik" atau "terverifikasi".
// Keluaran: gis/titik-meragukan.md dan gis/titik-fallback.md
//
// Kolom "kelurahan menurut koordinat" dihitung di sini dengan uji titik-dalam-poligon
// terhadap public/data/kelurahan.geojson, bukan dibaca dari data.

const fs = require("fs");

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
      let lubang = false;
      for (let i = 1; i < poly.length; i++) if (diRing(lon, lat, poly[i])) lubang = true;
      if (!lubang) return f.properties.kelurahan;
    }
  }
  return null;
}

const titik = [];
for (const layer of ["faskes", "sekolah"]) {
  const g = JSON.parse(fs.readFileSync("public/data/" + layer + ".geojson", "utf8"));
  for (const f of g.features) {
    const p = f.properties;
    if (p.kualitas === "baik" || p.kualitas === "terverifikasi") continue;
    const [lon, lat] = f.geometry.coordinates;
    titik.push({ layer, nama: p.nama, jenis: p.jenis, kelurahan: p.kelurahan,
                 kecamatan: p.kecamatan, kualitas: p.kualitas, lon, lat,
                 kelKoord: kelurahanDi(lon, lat) });
  }
}

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni",
               "Juli","Agustus","September","Oktober","November","Desember"];
const kini = new Date();
const tanggal = kini.getDate() + " " + BULAN[kini.getMonth()] + " " + kini.getFullYear();

const KEPALA =
  "| Nama | Jenis | Kelurahan tertulis | Kecamatan | Koordinat sekarang | Kelurahan menurut koordinat | Peta |\n" +
  "|---|---|---|---|---|---|---|";

function baris(t) {
  const koord = t.lat.toFixed(6) + ", " + t.lon.toFixed(6);
  const peta = "[cari](https://www.google.com/maps/search/" + encodeURIComponent(t.nama + " Bogor") + ")";
  const cocok = t.kelKoord === null ? "di luar batas"
    : t.kelKoord.toUpperCase() === t.kelurahan.toUpperCase() ? "sama" : t.kelKoord;
  return "| " + [t.nama, t.jenis, t.kelurahan, t.kecamatan, koord, cocok, peta].join(" | ") + " |";
}
function seksi(judul, isi) {
  if (!isi.length) return "";
  return "### " + judul + " (" + isi.length + ")\n\n" + KEPALA + "\n" + isi.map(baris).join("\n") + "\n\n";
}
function perLayer(isi) {
  return seksi("Faskes", isi.filter((t) => t.layer === "faskes")) +
         seksi("Sekolah", isi.filter((t) => t.layer === "sekolah"));
}

const CARA_KERJA =
  "Kolom \"Kelurahan menurut koordinat\" diisi dengan uji titik-dalam-poligon terhadap\n" +
  "`public/data/kelurahan.geojson`. Isinya \"sama\" kalau cocok dengan label, nama\n" +
  "kelurahan lain kalau berbeda, atau \"di luar batas\" kalau titiknya jatuh di luar\n" +
  "seluruh wilayah Kota Bogor.\n\n" +
  "File ini dibuat ulang dengan `node gis/buat-laporan-titik.js`.\n";

// --- meragukan ---
const ragu = titik.filter((t) => t.kualitas === "meragukan");
const raguBeda = ragu.filter((t) => t.kelKoord === null || t.kelKoord.toUpperCase() !== t.kelurahan.toUpperCase());

let md = "# Titik meragukan\n\nDiperbarui " + tanggal + ".\n\n";
if (!ragu.length) {
  md += "Sudah tidak ada. Tidak ada titik di `public/data/faskes.geojson` dan\n" +
        "`public/data/sekolah.geojson` yang kolom `kualitas`-nya bernilai \"meragukan\".\n" +
        "Seluruhnya sudah dicek manual dan koordinatnya diganti, jejaknya di\n" +
        "`gis/koreksi-titik.csv` dan dua laporan `*-final.md`.\n\n## Catatan\n\n" + CARA_KERJA;
} else {
  md += ragu.length + " titik, dari `public/data/faskes.geojson` dan `public/data/sekolah.geojson`,\n" +
        "yaitu yang kolom `kualitas`-nya bernilai \"meragukan\".\n\n" +
        "\"Meragukan\" artinya koordinatnya hasil geocode yang jatuh jauh dari alamat aslinya.\n" +
        "Nama dan alamatnya ada, tapi titiknya belum tentu di tempat yang benar. Jadi di sini\n" +
        "label kelurahan justru lebih bisa dipercaya daripada koordinatnya.\n\n" +
        "Koordinat " + raguBeda.length + " di antaranya jatuh di kelurahan lain daripada yang tertulis.\n" +
        "Itu yang paling perlu dicek dulu, karena di situ salah satunya sudah pasti keliru.\n\n" +
        "Yang perlu dikerjakan: buka tautan peta, cocokkan dengan nama dan kelurahan yang\n" +
        "tertulis, lalu catat koordinat yang benar. Kalau tempatnya memang di kelurahan yang\n" +
        "tertulis, koordinatnya yang diperbaiki. Kalau ternyata di kelurahan lain, labelnya\n" +
        "yang diperbaiki.\n\n" + perLayer(ragu) + "## Catatan\n\n" + CARA_KERJA;
}
fs.writeFileSync("gis/titik-meragukan.md", md);

// --- fallback ---
const fb = titik.filter((t) => t.kualitas === "fallback");
const perKoord = new Map();
for (const t of fb) {
  const k = t.lon + "," + t.lat;
  if (!perKoord.has(k)) perKoord.set(k, []);
  perKoord.get(k).push(t);
}
const tumpuk = [...perKoord.values()].filter((v) => v.length > 1);

let md2 = "# Titik fallback\n\nDiperbarui " + tanggal + ".\n\n";
if (!fb.length) {
  md2 += "Sudah tidak ada. Tidak ada titik yang kolom `kualitas`-nya bernilai \"fallback\".\n\n" +
         "## Catatan\n\n" + CARA_KERJA;
} else {
  md2 += fb.length + " titik, dari `public/data/faskes.geojson` dan `public/data/sekolah.geojson`,\n" +
         "yaitu yang kolom `kualitas`-nya bernilai \"fallback\".\n\n" +
         "\"Fallback\" artinya koordinatnya tidak pernah diketahui. Yang dipakai adalah titik\n" +
         "mewakili kelurahannya, jadi koordinat di file ini bukan lokasi tempat itu sebenarnya.\n" +
         "Label kelurahannya benar, koordinatnya tidak.\n\n";
  if (tumpuk.length) {
    md2 += fb.length + " titik itu cuma menempati " + perKoord.size + " koordinat yang berbeda, dan\n" +
           tumpuk.length + " di antaranya ditempati lebih dari satu titik sekaligus, jadi di peta\n" +
           "tampak beberapa fasilitas berdiri persis di tempat yang sama.\n\n";
  }
  md2 += "Fallback ikut dipakai menghitung jarak dan cakupan dalam skor kelayakhunian, dan\n" +
         "jarak yang diukur dari titik yang dikarang sendiri tidak mengukur apa pun.\n\n" + perLayer(fb);
  if (tumpuk.length) {
    md2 += "## Koordinat yang ditempati lebih dari satu titik\n\n| Koordinat | Jumlah titik | Nama |\n|---|---|---|\n";
    for (const v of tumpuk.sort((a, b) => b.length - a.length)) {
      md2 += "| " + v[0].lat.toFixed(6) + ", " + v[0].lon.toFixed(6) + " | " + v.length + " | " +
             v.map((t) => t.nama).join("; ") + " |\n";
    }
    md2 += "\n";
  }
  md2 += "## Catatan\n\n" + CARA_KERJA;
}
fs.writeFileSync("gis/titik-fallback.md", md2);

console.log("meragukan:", ragu.length, "(beda kelurahan:", raguBeda.length + ")");
console.log("fallback:", fb.length, "koordinat unik:", perKoord.size, "bertumpuk:", tumpuk.length);
