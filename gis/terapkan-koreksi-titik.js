// Menerapkan gis/koreksi-titik.csv ke public/data/faskes.geojson dan sekolah.geojson.
//
// Label kelurahan diambil dari hasil uji titik-dalam-poligon, bukan dari alamat teks
// Google. Alasannya: koordinatnya sudah diperiksa manual, jadi lokasi titik itu yang
// menentukan dia ada di kelurahan mana. Baris yang dua sumbernya berbeda dilaporkan.
//
// Aman dijalankan ulang. Baris yang koordinat lamanya tidak ketemu lagi dianggap
// sudah diterapkan. Jalankan lagi setiap kali build-data.ps1 menimpa kedua file itu.

const fs = require("fs");

function bacaCsv(teks) {
  const sel = [];
  let baris = [], isi = "", dalamKutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (dalamKutip) {
      if (c === '"' && teks[i + 1] === '"') { isi += '"'; i++; }
      else if (c === '"') dalamKutip = false;
      else isi += c;
    } else if (c === '"') dalamKutip = true;
    else if (c === ",") { baris.push(isi); isi = ""; }
    else if (c === "\n") { baris.push(isi); sel.push(baris); baris = []; isi = ""; }
    else if (c !== "\r") isi += c;
  }
  if (isi !== "" || baris.length) { baris.push(isi); sel.push(baris); }
  const kepala = sel.shift();
  return sel.map((b) => Object.fromEntries(kepala.map((k, i) => [k, b[i]])));
}

const koreksi = bacaCsv(fs.readFileSync("gis/koreksi-titik.csv", "utf8"));

const dekat = (a, b) => Math.abs(parseFloat(a) - parseFloat(b)) < 2e-6;

const laporan = { diganti: 0, dihapus: 0, dipertahankan: 0, sudah: 0, gagal: [], labelDiambilDariPoligon: [] };

for (const layerNama of ["faskes", "sekolah"]) {
  const file = "public/data/" + layerNama + ".geojson";
  const g = JSON.parse(fs.readFileSync(file, "utf8"));
  const buang = new Set();

  for (const k of koreksi.filter((k) => k.layer === layerNama)) {
    const cocok = g.features.filter((f) => {
      const p = f.properties;
      if (p.nama !== k.nama || p.jenis !== k.jenis) return false;
      return dekat(f.geometry.coordinates[0], k.lon_lama) && dekat(f.geometry.coordinates[1], k.lat_lama);
    });

    if (cocok.length === 0) {
      // sudah diterapkan? cek di koordinat barunya
      const sudah = k.aksi === "hapus"
        ? !g.features.some((f) => f.properties.nama === k.nama && f.properties.jenis === k.jenis)
        : g.features.some((f) =>
            f.properties.nama === k.nama && f.properties.jenis === k.jenis &&
            dekat(f.geometry.coordinates[0], k.lon_baru) && dekat(f.geometry.coordinates[1], k.lat_baru));
      if (sudah) laporan.sudah++;
      else laporan.gagal.push(k.nama + " (" + k.jenis + "): koordinat lama tidak ketemu, koordinat baru juga tidak");
      continue;
    }
    if (cocok.length > 1) {
      laporan.gagal.push(k.nama + " (" + k.jenis + "): " + cocok.length + " titik cocok, tidak diubah");
      continue;
    }

    const f = cocok[0];
    if (k.aksi === "hapus") { buang.add(f); laporan.dihapus++; continue; }
    if (k.aksi === "pertahankan") { laporan.dipertahankan++; continue; }

    f.geometry.coordinates = [parseFloat(k.lon_baru), parseFloat(k.lat_baru)];
    if (k.poligon_cocok !== "ya") {
      laporan.labelDiambilDariPoligon.push(
        k.nama + ": alamat Google bilang " + k.kel_final + ", poligon bilang " + k.kel_poligon
      );
    }
    f.properties.kelurahan = k.kel_poligon;
    f.properties.kecamatan = k.kec_poligon;
    f.properties.kualitas = "terverifikasi";
    laporan.diganti++;
  }

  g.features = g.features.filter((f) => !buang.has(f));

  // tulis ulang dengan tata letak ogr2ogr: satu fitur per baris
  const keluar =
    '{\n"type": "FeatureCollection",\n"features": [\n' +
    g.features.map((f) => JSON.stringify(f)).join(",\n") +
    "\n]\n}\n";
  fs.writeFileSync(file + ".baru", keluar);
  fs.renameSync(file + ".baru", file);
  console.log(layerNama + ": " + g.features.length + " titik tersisa");
}

console.log("");
console.log("koordinat diganti :", laporan.diganti);
console.log("titik dihapus     :", laporan.dihapus);
console.log("dipertahankan     :", laporan.dipertahankan);
console.log("sudah diterapkan  :", laporan.sudah);

if (laporan.labelDiambilDariPoligon.length) {
  console.log("\n-- label diambil dari poligon, bukan dari alamat Google --");
  for (const b of laporan.labelDiambilDariPoligon) console.log("  " + b);
}
if (laporan.gagal.length) {
  console.log("\n-- GAGAL --");
  for (const b of laporan.gagal) console.log("  " + b);
  process.exitCode = 1;
}
