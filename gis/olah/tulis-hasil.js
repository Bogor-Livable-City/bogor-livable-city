// Menulis hasil hitung ulang ke public/data/kelurahan.geojson dan app/kelurahan-data.ts.
// Geometri poligon tidak disentuh, hanya propertinya yang diganti.
// Pemetaan nama kolom dan pembulatannya mengikuti gis/sql/kelurahan.sql.

const fs = require("fs");
const path = require("path");

const [fileSkor] = process.argv.slice(2);
if (!fileSkor) {
  console.error("pakai: node tulis-hasil.js <skor-baru.csv>");
  process.exit(1);
}
const AKAR = path.resolve(__dirname, "..", "..");

function bacaCsv(teks) {
  const baris = [];
  let sel = [], isi = "", kutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (kutip) {
      if (c === '"' && teks[i + 1] === '"') { isi += '"'; i++; }
      else if (c === '"') kutip = false;
      else isi += c;
    } else if (c === '"') kutip = true;
    else if (c === ",") { sel.push(isi); isi = ""; }
    else if (c === "\n") { sel.push(isi); baris.push(sel); sel = []; isi = ""; }
    else if (c !== "\r") isi += c;
  }
  if (isi !== "" || sel.length) { sel.push(isi); baris.push(sel); }
  const kep = baris.shift();
  return baris.filter((b) => b.length === kep.length).map((b) => {
    const o = {};
    kep.forEach((k, i) => { o[k] = b[i]; });
    return o;
  });
}

const bulat = (v, n) => {
  const x = Number(v);
  const f = Math.pow(10, n);
  return Math.round(x * f) / f;
};

const skor = bacaCsv(fs.readFileSync(fileSkor, "utf8"));
if (skor.length !== 68) { console.error("baris skor bukan 68: " + skor.length); process.exit(1); }

// urutan kolom harus sama dengan gis/sql/kelurahan.sql
function props(r) {
  return {
    kode: r.kode,
    kecamatan: r.kecamatan,
    kelurahan: r.kelurahan,
    penduduk: Number(r.penduduk),
    luas_km2: bulat(r.luas_km2, 3),
    skor_kesehatan: bulat(r.skor_kesehatan, 4),
    skor_pendidikan: bulat(r.skor_pendidikan, 4),
    skor_sosial: bulat(r.skor_sosial, 4),
    skor_ekonomi: bulat(r.skor_ekonomi, 4),
    skor_transportasi: bulat(r.skor_transportasi, 4),
    skor_lingkungan: bulat(r.skor_lingkungan, 4),
    skor_livable: bulat(r.skor_livable, 4),
    kelas: r.kelas,
    peringkat: Number(r.peringkat),
    n_puskesmas: Number(r.n_puskesmas),
    n_klinik: Number(r.n_klinik),
    n_rs: Number(r.n_rs),
    cakupan_faskes_pct: bulat(r.K1, 2),
    cakupan_puskesmas_pct: bulat(r.cakupan_puskesmas, 2),
    cakupan_rs_pct: bulat(r.cakupan_rs, 2),
    jarak_puskesmas_m: bulat(r.jarak_puskesmas, 0),
    jarak_klinik_m: bulat(r.jarak_klinik, 0),
    jarak_rs_m: bulat(r.jarak_rs, 0),
    n_sd: Number(r.n_SD),
    n_smp: Number(r.n_SMP),
    n_sma_smk: Number(r.n_SMA),
    sekolah_per_10rb: bulat(r.P1, 2),
    jarak_sekolah_m: bulat(r.P2, 0),
    kepadatan_jiwa_km2: bulat(r.S1, 0),
    kriminalitas_per_10rb: bulat(r.S2, 2),
    perdagangan_pct: bulat(r.E1, 2),
    industri_pct: bulat(r.E2, 2),
    badan_jalan_pct: bulat(r.T1, 2),
    kerapatan_jalan_km_km2: bulat(r.T2, 2),
    vegetasi_pct: bulat(r.L1, 2),
    vegetasi_m2_per_jiwa: bulat(r.L2, 2),
  };
}

const perKode = new Map(skor.map((r) => [r.kode, props(r)]));
const urut = [...perKode.values()].sort((a, b) => a.peringkat - b.peringkat);

// --- geojson: geometri dipertahankan ---
const fileGeo = path.join(AKAR, "public", "data", "kelurahan.geojson");
const geo = JSON.parse(fs.readFileSync(fileGeo, "utf8"));
const geomPerKode = new Map(geo.features.map((f) => [f.properties.kode, f.geometry]));
for (const kode of perKode.keys()) {
  if (!geomPerKode.has(kode)) { console.error("geometri tidak ada untuk kode " + kode); process.exit(1); }
}
geo.features = urut.map((p) => ({ type: "Feature", properties: p, geometry: geomPerKode.get(p.kode) }));

const kepala = Object.entries(geo)
  .filter(([k]) => k !== "features")
  .map(([k, v]) => JSON.stringify(k) + ": " + JSON.stringify(v));
const keluarGeo = "{\n" + kepala.join(",\n") + ',\n"features": [\n' +
  geo.features.map((f) => JSON.stringify(f)).join(",\n") + "\n]\n}\n";
fs.writeFileSync(fileGeo + ".baru", keluarGeo);
fs.renameSync(fileGeo + ".baru", fileGeo);
console.log("kelurahan.geojson: " + geo.features.length + " fitur");

// --- kelurahan-data.ts ---
const fileTs = path.join(AKAR, "app", "kelurahan-data.ts");
const lamaTs = fs.readFileSync(fileTs, "utf8");
const kepalaTs = lamaTs.slice(0, lamaTs.indexOf("export const kelurahanData"));
const keluarTs = kepalaTs + "export const kelurahanData: KelurahanProps[] = [\n" +
  urut.map((p) => "  " + JSON.stringify(p) + ",").join("\n") + "\n];\n";
fs.writeFileSync(fileTs, keluarTs);
console.log("kelurahan-data.ts: " + urut.length + " baris");
