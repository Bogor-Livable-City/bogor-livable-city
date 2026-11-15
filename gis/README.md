# Folder GIS — Bogor Livable City

Folder kerja GIS Developer (WBS 1.3.x). Berisi skrip pemrosesan data spasial
yang menghasilkan file GeoJSON untuk WebGIS di `public/data/`.

- `source/` — data mentah (GeoPackage hasil QGIS, Shapefile RBI BIG 1:25K). Tidak di-commit.
- `build-data.ps1` — skrip ekspor/analisis (ogr2ogr dari QGIS) → `public/data/*.geojson`.

## Database PostGIS (WBS 1.4.1)

Database lokal untuk backend. Isinya sama dengan `public/data/*.geojson`, bedanya
bisa di-query spasial. GeoJSON statis tetap jadi sumbernya, database ini turunan.

Sekali saja, butuh password superuser:

    psql -U postgres -f gis/sql/00-setup-db.sql

Impor ulang setiap kali `public/data/` berubah:

    .\gis\build-postgis.ps1

Periksa hasilnya, sepuluh baris dan semuanya harus OK:

    psql -U ruang_bogor -d ruang_bogor -f gis/sql/02-cek-postgis.sql

Tabel yang terbentuk: `kelurahan` (68), `kecamatan` (6), `faskes` (120),
`sekolah` (556), `jalan` (4.236), `jangkauan_faskes` (4). Semuanya EPSG:4326,
kolom geometrinya bernama `geom`, masing-masing punya indeks GiST.

Koneksi: `postgresql://ruang_bogor:ruang_bogor@localhost:5432/ruang_bogor`.
Password itu sengaja terbuka supaya satu kelompok dapat database yang sama
persis. Ganti sebelum dipakai di server mana pun.

## Koreksi label titik

`faskes.geojson` dan `sekolah.geojson` punya kolom teks `kelurahan` yang untuk
sebagian titik bertentangan dengan koordinat titik itu sendiri.
`fix-label-titik.ps1` mengambil ulang label dari lokasinya, lewat database:

    .\gis\build-postgis.ps1
    .\gis\fix-label-titik.ps1
    .\gis\build-postgis.ps1

Label hanya diganti kalau koordinatnya memang bisa dipercaya, yaitu
`kualitas = 'baik'` dan titiknya lebih dari 10 meter dari garis batas. Hasilnya
12 titik.

Kolom `kualitas` datang dari gpkg dan mencatat asal koordinat tiap titik.
"fallback" berarti koordinatnya diturunkan dari kelurahan, "meragukan" berarti
hasil geocode yang jauh dari alamatnya. Untuk keduanya label justru lebih bisa
dipercaya daripada koordinat, jadi tidak disentuh.

Titik yang labelnya bertentangan tapi tidak dikoreksi masuk `label-ragu.csv`,
Setelah koreksi koordinat 15 November tinggal 11 baris, semuanya berkualitas
"baik" dan menempel garis batas, jadi pertentangannya datang dari batas
poligonnya, bukan dari titiknya.

Jalankan ulang setiap kali `build-data.ps1` menimpa kedua file itu.

## Koreksi koordinat titik (sudah dijalankan)

69 titik yang kualitasnya "meragukan" atau "fallback" dicek manual satu per satu di
Google Maps pada 15 November 2026. Hasilnya: 64 koordinat diganti, 4 titik dihapus
karena ternyata di luar Kota Bogor, 1 dipertahankan.

Jejaknya:

- `titik-meragukan-final.md`, `titik-fallback-final.md` — hasil pengecekan manual,
  lengkap dengan nama tempat menurut Google dan alasan tiap keputusan. Ditulis tangan,
  jadi jangan dibuat ulang oleh skrip.
- `koreksi-titik.csv` — dua file di atas dalam bentuk yang bisa dijalankan.
  Dibuat ulang dengan `node gis/baca-koreksi-titik.js <meragukan-final.md> <fallback-final.md>`.
- `titik-meragukan.md`, `titik-fallback.md` — status sekarang, dibuat ulang dengan
  `node gis/buat-laporan-titik.js`. Sekarang tinggal 1 titik fallback.

Urutan menerapkannya ulang setiap kali `build-data.ps1` menimpa kedua geojson:

    node gis/terapkan-koreksi-titik.js
    .\gis\build-postgis.ps1

Skrip penerapnya aman dijalankan berulang. Label kelurahan diambil dari uji
titik-dalam-poligon, bukan dari alamat teks Google, dan dua baris yang kedua sumbernya
berbeda dilaporkan ke layar. Titik yang koordinatnya sudah dicek diberi
`kualitas = 'terverifikasi'`.

### Yang belum ikut diperbarui

Koreksi ini menyentuh titiknya saja. Indikator di `public/data/kelurahan.geojson` dan
`app/kelurahan-data.ts` (`jarak_*_m`, `n_*`, `cakupan_*_pct`) masih dihitung dari
koordinat yang lama, karena angka itu datang dari gpkg hasil olahan QGIS, bukan dari
geojson ini. Jadi sekarang peta menunjukkan titik yang benar sementara skornya belum.

## Hitung ulang skor (WBS 1.3.4, diambil alih dari GIS Developer)

Dijalankan 15 November 2026 setelah 69 koordinat titik dibenahi. Metodenya mengikuti
skrip asli di `Bogor Liveable City/hasil_prototipe/v3/skrip/`, bukan definisi baru.
Rinciannya di `gis/metodologi-skor.md`.

Butuh Python dengan pandas, numpy, scipy, shapely, pyproj, dan folder sumber:

    export BL_DIR="C:/Users/User/Documents/IPB 2024/Semester 5/Bogor Liveable City"
    export GPKG_CSV=<folder hasil ekspor tabel gpkg ke CSV>

Tiga langkah, dari folder `gis/olah`:

    python hitung-indikator.py <titik_faskes.csv> <titik_sekolah.csv> indikator.csv
    python hitung-skor.py indikator.csv <titik_faskes.csv> <titik_sekolah.csv> skor.csv
    node tulis-hasil.js skor.csv

Berkas titik butuh kolom `g`, `kel`, `kec`, `lon`, `lat`. Nilai `g`:
puskesmas/klinik/rs untuk faskes, SD/SMP/SMA untuk sekolah. Dibuat dari
`public/data/*.geojson` dengan memetakan `jenis` sd/smp/sma_smk ke SD/SMP/SMA.

`tulis-hasil.js` menimpa `public/data/kelurahan.geojson` dan `app/kelurahan-data.ts`.
Geometri poligonnya dipertahankan, hanya propertinya yang diganti. Setelah itu:

    .\gis\build-postgis.ps1

### Reproduksi diuji dulu

Sebelum dipakai, skripnya dijalankan dengan koordinat lama dan hasilnya dibandingkan
ke gpkg:

| Yang diuji | Selisih maks |
|---|---|
| enam kolom `jarak_*_m` | 0,03 sampai 0,26 meter |
| enam kolom `cakupan_*_pct` | 0,0000 |
| `n_puskesmas`, `n_klinik`, `n_rs` | cocok 68/68 |
| `n_SD`, `n_SMP` | cocok 68/68 |
| `n_SMA_SMK` | cocok 66/68 |
| skor Sosial, Ekonomi, Transportasi, Lingkungan | 0,000000 |
| `skor_kesehatan` | 0,000004 |
| `skor_pendidikan` | 0,013575 |
| `skor_livable` | 0,004965 |
| sebaran kelas | cocok persis |

Sisa selisihnya dari satu sekolah SMA/SMK yang pemindahan spasialnya berbeda, titiknya
tepat di perbatasan Tegallega dan Tegal Gundil. Tidak mengganggu hitungan baru, karena
21 sekolah bertanda "perlu dicek" semuanya sudah termasuk 69 titik yang diperiksa
manual, jadi labelnya tidak lagi ditentukan otomatis.

### Dampak koreksi koordinat

| Yang berubah | Besarnya |
|---|---|
| `skor_kesehatan` | 40 dari 68 kelurahan bergeser lebih dari 0,01; terbesar 0,132 |
| `skor_pendidikan` | 35 dari 68; terbesar 0,103 |
| `skor_livable` | 38 dari 68; terbesar 0,051, median 0,012 |
| `peringkat` | 47 dari 68 berubah; pergeseran terbesar 7 posisi |
| `kelas` | 7 kelurahan berpindah |

Lima teratas tidak berubah urutannya: Pabaton, Babakan, Batutulis, Gudang, Paledang.

Yang pindah kelas: Genteng dan Gunung Batu naik dari Sangat Tidak Layak Huni ke Tidak
Layak Huni; Tajur dan Katulampa dari Tidak Layak Huni ke Cukup Layak Huni; Sukasari,
Cibogor, dan Ciwaringin dari Cukup Layak Huni ke Layak Huni.

### Yang belum ikut diperbarui

`public/data/JANGKAUAN_PUSKESMAS_RUMAHSAKIT.geojson` masih poligon buffer dari
koordinat lama, termasuk angka `cakupan_kota_pct` di dalamnya. Layer itu hanya tampilan
peta dan tidak masuk hitungan skor, tapi sekarang tidak sejalan lagi dengan titiknya.
