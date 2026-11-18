# PRD — Ruang Bogor

**Product Requirements Document, versi berbasis implementasi**
Proyek: Bogor Livable City — Sistem Informasi Geografis Analisis Kelayakhunian Wilayah Kota Bogor
Kelompok A1_Kelompok 3_Liveable City · MPTI
Disusun 18 November 2026

---

## 0. Tentang dokumen ini

Dokumen ini mencatat produk **sebagaimana yang sudah dibangun** sampai 18 November 2026, bukan rencana yang belum dikerjakan. Dokumen perencanaan tim tetap PRD Bogor Liveable City v2.1 (25 Oktober 2026); yang ini melengkapinya dengan keadaan sebenarnya, termasuk bagian yang dibatalkan dan yang masih berupa tampilan tanpa fungsi.

Setiap kebutuhan diberi status:

| Status | Arti |
|---|---|
| Selesai | Berfungsi di aplikasi yang dibangun dan sudah diperiksa di peramban |
| Mockup | Tampilannya ada, logikanya tidak |
| Dibatalkan | Pernah dibangun atau direncanakan, lalu dikeluarkan dari lingkup rilis |
| Belum | Disepakati perlu, belum dikerjakan |

Sumber pemeriksaan: isi repositori pada commit `3924bea`, 19 commit sejak 8 November 2026.

---

## 1. Ringkasan produk

Ruang Bogor adalah atlas WebGIS yang memeringkat dan memetakan kelayakhunian 68 kelurahan di Kota Bogor. Pengguna dapat membuka peta interaktif, membaca skor tiap kelurahan beserta enam dimensi penyusunnya, melihat tabel peringkat, membandingkan dua kelurahan berdampingan, dan membuka profil tiap wilayah.

Skor kelayakhunian **tidak dihitung di dalam aplikasi**. Angkanya hasil pengolahan spasial di luar aplikasi, masuk sebagai data statis. Aplikasi hanya menghitung turunannya, misalnya rata-rata per kecamatan.

**Alamat produksi:** https://bogor-livable-city.vercel.app
**Repositori:** https://github.com/Bogor-Livable-City/bogor-livable-city

---

## 2. Masalah dan latar

Informasi kelayakhunian Kota Bogor tersebar di banyak sumber dengan satuan wilayah yang berbeda-beda, sebagian pada tingkat kota, sebagian kecamatan. Warga, mahasiswa, maupun perencana tidak punya satu tempat untuk membandingkan kelurahan secara setara. Ruang Bogor menyatukannya pada satu satuan wilayah, yaitu kelurahan, dengan metode yang sama untuk keenam puluh delapan wilayah dan dengan perhitungan yang dapat ditelusuri ulang.

---

## 3. Pengguna sasaran

| Pengguna | Yang dicari | Halaman yang melayaninya |
|---|---|---|
| Warga dan calon penghuni | Seberapa layak huni satu kelurahan, apa kekurangannya | Peta, profil wilayah |
| Mahasiswa dan peneliti | Angka per indikator, metode, data mentah | Metodologi, profil wilayah, unduhan GeoJSON |
| Perencana wilayah | Wilayah mana yang paling tertinggal, pada dimensi apa | Peringkat, statistik, perbandingan |

---

## 4. Lingkup

### 4.1 Masuk lingkup rilis

Enam halaman publik: beranda, peta, statistik, peringkat, perbandingan, dan profil wilayah, ditambah halaman metodologi. Seluruhnya berbahasa Indonesia, memakai format angka Indonesia.

### 4.2 Dibatalkan dari lingkup rilis

| Bagian | Keadaan | Alasan |
|---|---|---|
| Dashboard admin (`/admin` dan lima turunannya) | Mockup, enam halaman | Tidak ada basis data saat aplikasi berjalan, sehingga tidak ada yang bisa disunting. Halaman masih ada di repositori tapi tidak ditaut dari navigasi mana pun |
| Asisten AI | Bukan model bahasa | Lihat FR-7.1 |
| Simulasi bobot (`/sensitivitas`) | Rute masih ada, tautannya dihapus | Tab Simulasi dihapus dari halaman peta pada 16 November 2026 |
| Lapisan jangkauan faskes | Berkas `JANGKAUAN_PUSKESMAS_RUMAHSAKIT.geojson` tidak lagi dipanggil | Digantikan indikator cakupan yang dihitung dari grid permukiman |

### 4.3 Di luar lingkup

Survei primer, data deret waktu lebih dari satu periode, akun pengguna, dan penyuntingan data lewat antarmuka.

---

## 5. Arsitektur dan teknologi

| Lapis | Pilihan |
|---|---|
| Kerangka kerja | Next.js 16.4.3, App Router, Turbopack, React 19.3.0, TypeScript 5 |
| Peta 2D | Leaflet 1.9.4, basemap Esri dan OpenStreetMap |
| Peta 3D | Kanvas 2D murni, proyeksi isometrik ditulis sendiri, tanpa pustaka tambahan |
| Gaya | CSS berkas statis, Tailwind 4 terpasang tetapi tidak dipakai di halaman publik |
| Data saat berjalan | GeoJSON statis di `public/data/` dan TypeScript di `app/kelurahan-data.ts` |
| Basis data | **Tidak ada saat aplikasi berjalan.** PostgreSQL 18 + PostGIS 3.6 hanya dipakai di luar aplikasi untuk mengolah data |
| Hosting | Vercel, paket Hobby, tanpa variabel lingkungan |

Keputusan terpenting: aplikasi yang terbit sepenuhnya statis. Tidak ada koneksi basis data, tidak ada kredensial, tidak ada variabel rahasia. Build menghasilkan 89 halaman.

---

## 6. Sumber data dan alur pengolahan

### 6.1 Sumber

| Data | Sumber | Tahun |
|---|---|---|
| Batas kelurahan dan kecamatan | RBI BIG | 2023 |
| Jaringan jalan | OpenStreetMap dan RBI BIG | 2026 |
| Fasilitas kesehatan | Dinas Kesehatan dan OpenStreetMap | 2026 |
| Sekolah | Kemendikbud | 2026 |
| Penduduk | SIMDATA Kota Bogor | 2026 |
| Penggunaan lahan dan vegetasi | Penggunaan lahan | 2023 |

### 6.2 Alur

GeoPackage hasil olahan QGIS → PostGIS (`gis/build-postgis.ps1`) → skrip Python di `gis/olah/` → `public/data/*.geojson` dan `app/kelurahan-data.ts`.

GeoJSON adalah sumber kebenarannya. Tabel PostGIS turunan, jadi tidak boleh disunting langsung. Pipeline memerlukan `ogr2ogr` dari QGIS.

### 6.3 Koreksi koordinat

Pada 12 sampai 15 November 2026 ditemukan 56 titik fasilitas yang label kelurahannya bertentangan dengan koordinatnya, dan 32 titik yang koordinatnya diturunkan dari kelurahan sehingga tidak pernah mewakili lokasi sebenarnya. Dua puluh empat klinik di antaranya menempati hanya 13 koordinat.

Hasil koreksi: 69 titik diperiksa manual, 64 koordinat diganti, 4 titik dihapus, 1 dipertahankan. Setelah perhitungan ulang, 47 dari 68 kelurahan berubah peringkatnya, bergeser paling jauh 7 posisi, dan 7 kelurahan berpindah kelas. Lima besar tidak berubah urutannya.

---

## 7. Metodologi skor

Dua belas indikator, dua per dimensi, berbobot sama di dalam dimensinya.

| Dimensi | Indikator | Arah |
|---|---|---|
| Kesehatan | Cakupan layanan faskes gabungan | Positif |
| | Jarak komposit ke fasilitas kesehatan | Negatif |
| Pendidikan | Sekolah per 10.000 penduduk | Positif |
| | Jarak jaringan jalan ke sekolah | Negatif |
| Sosial kependudukan | Kepadatan penduduk | Negatif |
| | Kriminalitas per 10.000 penduduk | Negatif |
| Ekonomi | Kawasan perdagangan | Positif |
| | Kawasan industri | Positif |
| Transportasi | Badan jalan | Positif |
| | Kerapatan jaringan jalan | Positif |
| Lingkungan | Tutupan vegetasi | Positif |
| | Vegetasi per penduduk | Positif |

Rantai perhitungan: min-max per indikator (dibalik untuk yang berarah negatif) → rata-rata dalam dimensi → min-max lagi di tingkat dimensi → `skor_livable` = min-max dari rata-rata enam dimensi → lima kelas interval setara → peringkat menurun.

Jarak diukur lewat jaringan jalan dengan Dijkstra multi-sumber, bukan garis lurus, dirata-ratakan atas grid permukiman 75 meter. Cakupan dihitung dari persentase titik grid di dalam radius, bukan dari luas buffer.

Metodologi ini tercatat di `gis/metodologi-skor.md` dan sudah diuji dapat direproduksi dengan selisih 0,000000 terhadap sumbernya.

**Yang perlu dicatat pembaca:** bobot dan ambang kelas adalah keputusan tim, bukan rujukan jurnal. `industri_pct` diperlakukan positif, dan itu dapat diperdebatkan.

---

## 8. Kebutuhan fungsional

### 8.1 Beranda (`/`)

| ID | Kebutuhan | Status |
|---|---|---|
| FR-1.1 | Menampilkan ringkasan indeks kota dan ajakan membuka peta | Selesai |
| FR-1.2 | Pratinjau peta interaktif dengan pita kecamatan | Selesai |

### 8.2 Peta (`/peta`)

| ID | Kebutuhan | Status |
|---|---|---|
| FR-2.1 | Choropleth 68 kelurahan, lima kelas warna | Selesai |
| FR-2.2 | Pilihan peta tematik: indeks dan enam dimensi | Selesai |
| FR-2.3 | Pengatur transparansi poligon | Selesai |
| FR-2.4 | Lapisan nama dan batas kelurahan serta kecamatan | Selesai |
| FR-2.5 | Lapisan jaringan jalan | Selesai |
| FR-2.6 | Titik fasilitas kesehatan (RS, puskesmas, klinik) dengan dropdown dan toggle induk per grup | Selesai |
| FR-2.7 | Titik fasilitas pendidikan (SD, SMP, SMA/SMK) dengan dropdown dan toggle induk per grup | Selesai |
| FR-2.8 | Tiga basemap: terang, satelit, dan jalan OSM | Selesai |
| FR-2.9 | Mode 3D ekstrusi: tinggi balok mengikuti skor, dapat diputar, skala tinggi 0,5 sampai 1,5 | Selesai |
| FR-2.10 | Cubitan dua jari untuk zoom, terbatas pada peta saja | Selesai |
| FR-2.11 | Pencarian kelurahan dan kecamatan | Selesai |
| FR-2.12 | Panel detail kelurahan terpilih: skor, enam dimensi, populasi, luas, kepadatan, cakupan faskes | Selesai |
| FR-2.13 | Tooltip saat hover, batas kelurahan jadi garis putus-putus bergerak | Selesai |
| FR-2.14 | Legenda satu kartu, dua tab (indeks dan fasilitas), dapat disembunyikan | Selesai |
| FR-2.15 | Petunjuk pemakaian memudar sendiri setelah lima detik | Selesai |
| FR-2.16 | Batas zoom terjauh dihitung dari batas kota, sehingga 68 kelurahan selalu muat dan wilayah kabupaten tidak ikut tampil | Selesai |
| FR-2.17 | Simulasi bobot | Dibatalkan |

### 8.3 Statistik (`/dashboard`)

| ID | Kebutuhan | Status |
|---|---|---|
| FR-3.1 | Indeks agregat kota, ditimbang jumlah penduduk | Selesai |
| FR-3.2 | Kartu ringkas: kelurahan tertinggi, jumlah kelurahan perlu perhatian, cakupan puskesmas | Selesai |
| FR-3.3 | Peta SVG sebaran indeks dengan nama enam kecamatan | Selesai |
| FR-3.4 | Cubitan dua jari pada peta SVG, halaman tetap dapat digulir satu jari | Selesai |
| FR-3.5 | Legenda ringkas: judul, bar gradien, nama kelas di kedua ujung | Selesai |
| FR-3.6 | Rata-rata skor enam dimensi se-kota | Selesai |
| FR-3.7 | Tabel perbandingan enam kecamatan | Selesai |
| FR-3.8 | Unduh GeoJSON | Selesai |

### 8.4 Peringkat (`/peringkat`)

| ID | Kebutuhan | Status |
|---|---|---|
| FR-4.1 | Tabel 68 kelurahan terurut indeks, 12 baris per halaman | Selesai |
| FR-4.2 | Pencarian menurut nama kelurahan maupun kecamatan | Selesai |
| FR-4.3 | Filter kecamatan dan filter klasifikasi | Selesai |
| FR-4.4 | Ringkasan: skor tertinggi, median, rentang, sebaran klasifikasi | Selesai |

### 8.5 Perbandingan (`/perbandingan`)

| ID | Kebutuhan | Status |
|---|---|---|
| FR-5.1 | Memilih dua kelurahan, dapat diisi lewat parameter URL `a` dan `b` | Selesai |
| FR-5.2 | Perbandingan indeks dan enam dimensi berdampingan | Selesai |
| FR-5.3 | Tabel indikator mentah | Dibatalkan |

### 8.6 Profil wilayah (`/wilayah/[slug]`)

| ID | Kebutuhan | Status |
|---|---|---|
| FR-6.1 | Dibuat statis untuk 68 kelurahan | Selesai |
| FR-6.2 | Indeks, klasifikasi, peringkat, dan letak pada peta kota | Selesai |
| FR-6.3 | Penduduk, luas, kepadatan, cakupan faskes | Selesai |
| FR-6.4 | Enam dimensi dengan pembanding rata-rata kota | Selesai |
| FR-6.5 | Monografi: kode wilayah, kecamatan, klasifikasi, peringkat kota dan kecamatan, sarana kesehatan dan pendidikan, vegetasi, kerapatan jalan, guna lahan | Selesai, dengan catatan di bagian 11 |
| FR-6.6 | Tabel dua belas indikator, bersanding dengan rata-rata 68 kelurahan dan selisihnya | Selesai |
| FR-6.7 | Fun fact yang dihitung dari data: posisi di kecamatan, rekor tingkat kota, ruang hijau per jiwa, jarak ke fasilitas terdekat | Selesai, dengan catatan di bagian 11 |

### 8.7 Lainnya

| ID | Kebutuhan | Status |
|---|---|---|
| FR-7.1 | Tanya Bogor (`/asisten`): menjawab pertanyaan seputar data | Mockup. **Bukan model bahasa.** Pencocokan kata kunci terhadap `kelurahanData`, dengan jawaban yang sudah dirancang untuk pola tertentu. Di luar pola itu tidak menjawab |
| FR-7.2 | Metodologi (`/metodologi`): penjelasan metode dan daftar sumber | Selesai |
| FR-7.3 | Dashboard admin | Dibatalkan. Enam halaman tampilan. Halaman masuk menerima sandi apa pun dan sandinya terisi otomatis di formulir |

---

## 9. API

Ketiga endpoint ini berfungsi dan mengembalikan JSON, tetapi **belum ada halaman yang memanggilnya**. Halaman mengimpor data langsung dari modul TypeScript. Endpoint disediakan untuk pemakaian luar dan untuk pemenuhan WBS 1.4.2.

| Endpoint | Parameter | Keluaran |
|---|---|---|
| `GET /api/regions` | `kecamatan`, `kelas`, `q` | Daftar kelurahan tersaring beserta seluruh atributnya, dengan `count` |
| `GET /api/analysis/ranking` | — | Peringkat 68 kelurahan |
| `GET /api/analysis/compare` | `a`, `b` (bawaan Pabaton dan Bantarjati) | Perbandingan dua kelurahan |

Belum ada dokumentasi API tertulis. Lihat bagian 12.

---

## 10. Kebutuhan non-fungsional

| ID | Kebutuhan | Keadaan |
|---|---|---|
| NFR-1 | Bahasa antarmuka Indonesia, angka berformat Indonesia | Terpenuhi |
| NFR-2 | Layout luwes dari layar ponsel sampai desktop | Terpenuhi sebagian. Lihat bagian 11 |
| NFR-3 | Penyajian layer spasial di bawah 500 ms | **Belum diuji formal.** Berkas terberat `jalan.geojson` 815 KB, `kelurahan.geojson` 260 KB, seluruh `public/data/` sekitar 1,35 MB. Geometri sudah disederhanakan 0,00003 derajat di pipeline |
| NFR-4 | Tidak ada kredensial pada aplikasi yang terbit | Terpenuhi. Tidak ada basis data, variabel lingkungan, maupun endpoint tulis |
| NFR-5 | Kontras, fokus papan ketik, dan sasaran sentuh 44 piksel | Terpenuhi sebagian, diatur di `app/revision.css` |
| NFR-6 | Build produksi lolos tanpa galat | Terpenuhi, 89 halaman |

---

## 11. Batasan yang diketahui

1. **Monografi dan fun fact berasal dari data proyek, bukan riset luar.** Pemilik produk menghendaki paragraf hasil penelusuran tentang tiap kelurahan. Penelusuran menunjukkan profil kelurahan resmi tidak tersedia secara daring bahkan untuk kelurahan paling terdokumentasi seperti Batutulis, sehingga menulis 68 paragraf akan berarti mengarang sebagian besarnya. Bagian ini menunggu teks dari sumber resmi, misalnya "Kecamatan Dalam Angka" terbitan BPS Kota Bogor.
2. **Penyederhanaan geometri menggeser batas sekitar 3,3 meter.** Untuk titik fasilitas yang tepat berada di tepi batas, hasil uji titik-dalam-poligon dapat berubah. Tersisa 11 titik dalam kondisi demikian.
3. **Halaman admin masih ada di repositori.** Enam halaman tanpa fungsi yang dapat disangka berfungsi oleh siapa pun yang membukanya lewat alamat langsung.
4. **Kartu legenda menutupi tombol kontrol 3D pada layar sempit.**
5. **Next.js 16.4.3 terkena advisory keamanan.** CLI-nya menghentikan build sekali untuk memberitahukannya, lalu melanjutkan saat perintah diulang. Belum diupgrade.
6. **Rute `/sensitivitas` masih ada tanpa tautan.** Tidak dapat dicapai dari navigasi, tetapi masih dibangun dan terbit.
7. **Data hanya satu periode.** Tidak ada deret waktu, sehingga perubahan antar tahun tidak dapat ditampilkan.

---

## 12. Yang belum dikerjakan

| Prioritas | Pekerjaan |
|---|---|
| 1 | Dokumentasi API tertulis untuk ketiga endpoint |
| 2 | Pengukuran formal waktu muat layer terhadap ambang 500 ms |
| 3 | Monografi berbasis sumber resmi untuk 68 kelurahan |
| 4 | Upgrade Next.js menutup advisory keamanan |
| 5 | Pembersihan: hapus halaman admin, rute `/sensitivitas`, dan `JANGKAUAN_PUSKESMAS_RUMAHSAKIT.geojson` yang tidak lagi dipakai |

---

## 13. Tim

| Peran | Nama |
|---|---|
| Project Manager | M. Karel Putra Shelvion |
| System Analyst | Vezajiva Arieesta Maheswari |
| GIS Developer | Muhamad Zaidan |
| Back End Programmer | Radithya Dhiyaurrahman |
| Front End Programmer | Nur Izza Yarismen |

---

## 14. Lampiran: susunan berkas

```
app/
  page.tsx                 Beranda
  peta/                    Peta interaktif 2D dan 3D
  dashboard/               Statistik kota
  peringkat/               Tabel peringkat
  perbandingan/            Perbandingan dua kelurahan
  wilayah/[slug]/          Profil 68 kelurahan
  metodologi/              Penjelasan metode
  asisten/                 Tanya Bogor (pencocokan kata kunci)
  sensitivitas/            Simulasi bobot (tidak ditaut)
  admin/                   Dashboard admin (mockup, tidak ditaut)
  api/                     Tiga endpoint JSON
  kelurahan-data.ts        Atribut 68 kelurahan
  lib/livability.ts        Tipe, klasifikasi, format angka
  lib/pinch.ts             Cubitan dua jari
  lib/simbol.ts            Simbol titik fasilitas
  components/              Peta Leaflet, peta 3D, peta SVG, legenda, select
public/data/               GeoJSON statis
gis/
  olah/                    Skrip Python perhitungan indikator dan skor
  sql/                     Skema dan kueri PostGIS
  metodologi-skor.md       Rantai perhitungan lengkap
  README.md                Urutan menjalankan pipeline
dokumen/                   Dokumen praktikum dan PRD ini
```
