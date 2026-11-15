# Perubahan pada cabang `radit`

Dikerjakan 12 sampai 16 November 2026, dari commit `4fd3c86`. Ditulis supaya satu
kelompok tahu apa yang berubah tanpa harus membaca diff.

Ada tiga hal besar: database PostGIS untuk backend, pembenahan koordinat titik
fasilitas, dan perhitungan ulang skor kelayakhunian. Sisanya perbaikan tampilan peta.

---

## 1. Database PostGIS (WBS 1.4.1)

GeoJSON di `public/data/` sekarang bisa diimpor ke PostgreSQL + PostGIS lokal supaya
bisa di-query spasial. GeoJSON tetap sumbernya, database ini turunan.

| Berkas | Isi |
|---|---|
| `gis/sql/00-setup-db.sql` | Membuat role dan database, memasang ekstensi PostGIS. Sekali saja. |
| `gis/build-postgis.ps1` | Mengimpor 6 layer GeoJSON ke PostGIS lewat ogr2ogr. |
| `gis/sql/02-cek-postgis.sql` | Sepuluh pemeriksaan hasil impor, semuanya harus OK. |

Tabel yang terbentuk: `kelurahan` (68), `kecamatan` (6), `faskes` (119),
`sekolah` (553), `jalan` (4.236), `jangkauan_faskes` (4). Semuanya EPSG:4326 dengan
indeks GiST.

Cara menjalankannya ada di `gis/README.md`.

---

## 2. Koordinat titik fasilitas dibenahi

### Masalahnya

Kolom `kelurahan` pada sebagian titik faskes dan sekolah bertentangan dengan
koordinatnya sendiri. Penyebabnya ketahuan dari skrip pembuat data di folder
prototipe: koordinat diterima kalau jaraknya sampai 300 m dari kelurahan yang
tertulis, ditandai "meragukan" kalau 300 sampai 1.500 m, dan diganti titik perwakilan
kelurahan kalau lebih jauh atau tidak ada sama sekali.

Akibatnya 32 titik berkoordinat karangan, dan 24 klinik di antaranya cuma menempati
13 koordinat yang sama. Di peta beberapa klinik tampak berdiri persis di satu tempat.

### Yang dikerjakan

69 titik berkualitas "meragukan" dan "fallback" dicek satu per satu di Google Maps.
Hasilnya 64 koordinat diganti, 4 titik dihapus karena ternyata di luar Kota Bogor,
1 dipertahankan.

| Berkas | Isi |
|---|---|
| `gis/titik-meragukan-final.md`, `gis/titik-fallback-final.md` | Hasil pengecekan manual, lengkap dengan alasan tiap keputusan. Ditulis tangan. |
| `gis/koreksi-titik.csv` | Dua berkas di atas dalam bentuk yang bisa dijalankan. |
| `gis/baca-koreksi-titik.js` | Membaca kedua md jadi CSV, sekaligus menguji koordinatnya ke poligon kelurahan. |
| `gis/terapkan-koreksi-titik.js` | Menerapkan CSV ke `public/data/*.geojson`. Aman dijalankan berulang. |
| `gis/buat-laporan-titik.js` | Mendaftar titik yang koordinatnya masih belum beres. |

Yang dihapus: SMKS Taruna Bangsa 1 dan 2 (Kec. Ciomas), SMP PGRI 14 (Kec. Dramaga),
dan Klinik Dokter Gigi yang namanya terlalu umum dan tidak ditemukan.

Kolom `kualitas` sekarang ikut diekspor ke GeoJSON lewat `gis/sql/faskes.sql` dan
`sekolah.sql`. Titik yang sudah dicek manual bernilai `terverifikasi`. Sisa titik
`fallback` tinggal satu, SMAN 11 yang sekolahnya masih dibangun.

---

## 3. Skor kelayakhunian dihitung ulang

### Metodologinya dibongkar dulu

Sebelum menghitung ulang, metode aslinya dipastikan dengan menguji tiap langkah ke
kolom perantara di `livable_kelurahan_v3_lengkap.gpkg`. Seluruhnya cocok dengan
selisih **0,000000**. Hasilnya ditulis di `gis/metodologi-skor.md`.

Ringkasnya: tiap indikator di-min-max ke 0 sampai 1 (dibalik untuk yang negatif),
dirata-rata dalam dimensi, lalu di-min-max sekali lagi. `skor_livable` adalah
rata-rata enam dimensi lalu di-min-max lagi. Kelas dari lima interval sama lebar.

Dua temuan yang perlu dicatat di laporan. Indikatornya **dua belas**, bukan sepuluh.
Dan `jarak_*_m` bukan jarak lurus, melainkan rata-rata jarak tempuh lewat jaringan
jalan OSM dari kisi titik permukiman 75 m di tiap kelurahan.

### Hitungannya dijalankan ulang

Skrip aslinya dipindahkan ke `gis/olah/` dan dijalankan dengan koordinat yang sudah
dibenahi.

| Berkas | Isi |
|---|---|
| `gis/olah/netlib.py` | Router jaringan jalan. Salinan apa adanya dari folder prototipe. |
| `gis/olah/hitung-indikator.py` | Menghitung `jarak_*` dan `cakupan_*` dari jaringan OSM. |
| `gis/olah/hitung-skor.py` | Menghitung skor dimensi, `skor_livable`, kelas, peringkat. |
| `gis/olah/tulis-hasil.js` | Menulis hasilnya ke `kelurahan.geojson` dan `app/kelurahan-data.ts`. |

Butuh Python dengan pandas, numpy, scipy, shapely, pyproj.

### Validasinya

Dijalankan dulu dengan koordinat lama lalu dibandingkan ke gpkg:

| Yang diuji | Selisih maks |
|---|---|
| enam kolom `jarak_*_m` | 0,03 sampai 0,26 meter |
| enam kolom `cakupan_*_pct` | 0,0000 |
| `n_puskesmas`, `n_klinik`, `n_rs`, `n_SD`, `n_SMP` | cocok 68/68 |
| skor Sosial, Ekonomi, Transportasi, Lingkungan | 0,000000 |
| `skor_kesehatan` | 0,000004 |
| sebaran kelas | cocok persis |

### Dampaknya

| Yang berubah | Besarnya |
|---|---|
| `skor_kesehatan` | 40 dari 68 kelurahan bergeser lebih dari 0,01; terbesar 0,132 |
| `skor_pendidikan` | 35 dari 68; terbesar 0,103 |
| `skor_livable` | 38 dari 68; terbesar 0,051, median 0,012 |
| `peringkat` | 47 dari 68 berubah; pergeseran terbesar 7 posisi |
| `kelas` | 7 kelurahan berpindah |

Lima teratas tidak berubah urutannya: Pabaton, Babakan, Batutulis, Gudang, Paledang.

Yang pindah kelas: Genteng dan Gunung Batu naik ke Tidak Layak Huni; Tajur dan
Katulampa ke Cukup Layak Huni; Sukasari, Cibogor, dan Ciwaringin ke Layak Huni.

---

## 4. Tampilan peta

### Dua bug diperbaiki

`jalan.geojson` ternyata memuat 7 Point, 1 MultiPoint, dan 2 GeometryCollection di
antara 4.226 MultiLineString. Leaflet menggambarnya sebagai marker default yang
ikonnya tidak termuat, jadi muncul teks "Marker" berserakan di peta. Sekarang hanya
geometri garis yang digambar.

Titik fasilitas dulu masuk `overlayPane` bawaan Leaflet yang z-index-nya sama dengan
pane choropleth, jadi tertimbun poligon. Sekarang punya pane sendiri di z-index 470.

### Basemap "Terang" diganti

CARTO menutup basemap gratisnya; tile-nya dibalas gambar "API key required". Diganti
ke Esri Light Gray, yang sudah dipakai proyek ini untuk mode Satelit. Lapisan label
mode Satelit juga ikut dipindah dari CARTO ke Esri.

### Panel layer

- Kelurahan sekarang punya garis batas seperti kecamatan, ikut tombol yang sama
  dengan namanya.
- Fasilitas Kesehatan dan Fasilitas Pendidikan jadi dropdown berisi per jenis.
- Layer "Jangkauan faskes & blank spot" dihapus.
- Keempat `<select>` diganti dropdown beranimasi (`app/components/select.tsx`).

### Simbol dan legenda

Simbol titik mengikuti `panduan_desain_legenda_webgis.md`: badge lingkaran berbingkai
putih dengan bayangan, ikon palang untuk kesehatan dan topi toga untuk pendidikan,
dibedakan warnanya saja. Spesifikasinya di `app/lib/simbol.ts` supaya peta dan
legenda tidak pernah berbeda.

Legenda jadi satu kartu bertab di kiri bawah (`app/components/legenda.tsx`), bisa
disembunyikan jadi pil bertuliskan "Legenda". Titik fasilitas punya ringkasan saat
disorot, tiga baris bertumpuk seperti Google Maps.

### Perbaikan teks

Tulisan "10 indikator" di empat tempat diperbaiki jadi 12, sesuai jumlah indikator
yang sebenarnya dipakai.

---

## Yang belum selesai

- `public/data/JANGKAUAN_PUSKESMAS_RUMAHSAKIT.geojson` masih poligon buffer dari
  koordinat lama. Layer itu sudah tidak dibaca aplikasi, tapi isinya tidak sejalan
  lagi dengan titiknya.
- `livable_kelurahan_v3_lengkap.gpkg` di folder prototipe masih berisi angka lama.
  Aplikasi tidak membacanya, tapi kalau `build-data.ps1` dijalankan, angka lama akan
  menimpa hasil perhitungan ulang. Perlu disinkronkan dengan Zaidan.
- 11 titik di `gis/label-ragu.csv` labelnya masih bertentangan dengan koordinat.
  Semuanya berkualitas "baik" dan menempel garis batas, jadi pertentangannya datang
  dari batas poligonnya.
- SDIT AL HIKMAH koordinatnya 57,7 m di luar semua batas kelurahan.
- Kriminalitas (`S2`) belum muncul di tabel profil kelurahan.
- Aturan agregasi `n_SMA_SMK` belum bisa direproduksi 68 dari 68, meleset satu
  sekolah yang titiknya tepat di perbatasan Tegallega dan Tegal Gundil.

## Catatan untuk anggota lain

- `gis/tugas-zaidan-olah-ulang.md` dan `gis/catatan-untuk-zaidan.md` ditulis sebelum
  perhitungan diambil alih. Isinya masih berguna sebagai catatan temuan, tapi
  permintaan mengolah ulang di dalamnya sudah dikerjakan sendiri.
- `.claude/skills/` tidak ikut repo. Dipasang per-mesin dari
  github.com/miqdadbadjuber/anti-slop.
