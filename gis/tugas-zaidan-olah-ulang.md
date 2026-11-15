# Tugas: olah ulang gpkg dengan koordinat yang sudah dibenahi

15 November 2026. Lanjutan dari `catatan-untuk-zaidan.md`.

## Ringkasnya

69 titik yang kolom `kualitas`-nya bukan "baik" sudah dicek satu per satu di Google
Maps. Hasilnya 64 koordinat diganti, 4 titik dihapus karena ternyata di luar Kota
Bogor, 1 dipertahankan.

Titik di `public/data/faskes.geojson` dan `sekolah.geojson` sudah diperbaiki, jadi
petanya sekarang benar. Tapi skornya belum, karena `jarak_*_m`, `n_*`, dan
`cakupan_*_pct` datang dari gpkg, bukan dari geojson itu. Jadi sekarang peta
menunjukkan titik yang benar sementara peringkatnya masih dari koordinat lama.

Itu yang perlu kamu benahi.

## Berkasnya

- `gis/koreksi-titik.csv` — 69 baris, kolomnya sudah disiapkan untuk join
- `gis/titik-meragukan-final.md` dan `gis/titik-fallback-final.md` — alasan tiap
  keputusan, lengkap dengan nama tempat menurut Google

## Cara join ke gpkg

Tabel yang kena: `titik_puskesmas`, `titik_klinik`, `titik_rs`, `titik_sd`,
`titik_smp`, `titik_sma_smk`.

Untuk sekolah pakai `npsn`. Semua 43 baris sekolah di CSV punya NPSN, jadi aman.
Untuk faskes pakai `nama` plus `lon_lama`/`lat_lama`, karena tabel klinik tidak punya
NPSN.

Kolom yang harus diubah per baris:

| Kolom gpkg | Diisi dari | Catatan |
|---|---|---|
| `geom` | `lon_baru`, `lat_baru` | |
| `lon`, `lat` | `lon_baru`, `lat_baru` | tabel titik menyimpan lon/lat terpisah dari geom, jangan sampai salah satu ketinggalan |
| `kel` | `kel_poligon` | |
| `kec` | `kec_poligon` | |
| `kualitas` | tulis `terverifikasi` | nilai baru, supaya bisa dibedakan dari `baik` yang asalnya dari sumber |
| `jarak_ke_kel_m` | hitung ulang | |

Baris dengan `aksi = hapus` dibuang dari tabelnya. Baris dengan
`aksi = pertahankan` jangan disentuh.

## Rincian per jenis

| Jenis | Koordinat diganti | Dihapus | Dipertahankan |
|---|---|---|---|
| klinik | 23 | 1 | 0 |
| puskesmas | 1 | 0 | 0 |
| rs | 1 | 0 | 0 |
| sd | 14 | 0 | 0 |
| smp | 11 | 1 | 0 |
| sma_smk | 14 | 2 | 1 |

### Empat yang dihapus

| Jenis | Nama | NPSN | Alasan |
|---|---|---|---|
| sma_smk | SMKS TARUNA BANGSA 1 BOGOR | 20220302 | alamatnya di Kec. Ciomas, Kabupaten Bogor |
| sma_smk | SMKS TARUNA BANGSA 2 BOGOR | 20220303 | alamat sama, satu entri dengan Taruna Bangsa 1 |
| smp | SMP PGRI 14 | 20220420 | alamatnya di Kec. Dramaga, Kabupaten Bogor |
| klinik | Klinik Dokter Gigi | - | namanya terlalu umum, tidak ada tempat bernama itu di Ranggamekar |

### Satu yang dipertahankan

SEKOLAH MENENGAH ATAS NEGERI 11 BOGOR masih dibangun dan belum ada di Google Maps,
jadi titik mewakili Kayu Manis tetap nilai terbaik yang ada. Kualitasnya masih
`fallback`, dan itu satu-satunya yang tersisa.

## Dua baris yang labelnya aku ambil dari poligon

Kolom "Kelurahan final" di dua laporan md itu dibaca dari alamat teks Google. Aku uji
semuanya terhadap poligon kelurahan dan 63 dari 65 cocok. Dua tidak, dan untuk dua itu
aku pakai hasil poligon:

| Titik | Alamat Google | Poligon | Kenapa poligon |
|---|---|---|---|
| Klinik Mata dr Hasri Ainun Habibie | Kebon Kelapa, Bogor Tengah | Menteng, Bogor Barat | titiknya 374 m di dalam Menteng, Kebon Kalapa bahkan tidak masuk tiga kelurahan terdekat |
| SMKS YZA 3 BOGOR | Menteng, Bogor Barat | Kebon Kalapa, Bogor Tengah | titiknya 54 m dari garis batas, memang di perbatasan |

Yang kedua masih bisa diperdebatkan. 54 m terlalu jauh untuk disalahkan ke
penyederhanaan poligon yang cuma 3,3 m, tapi kalau kamu lihat sendiri bangunannya di
sisi Menteng, bilang saja.

## Kenapa ini mengubah skor

Aku hitung ulang dari titik lama dan titik baru untuk melihat besarannya. Ini
hitunganku sendiri, bukan metodemu, jadi anggap ini perkiraan kasar besarnya saja:

| Indikator | Kelurahan yang berubah | Geseran terbesar |
|---|---|---|
| jarak klinik | 32 dari 68 | +1.042 m |
| jarak sekolah | 16 dari 68 | -305 m |
| jarak puskesmas | 3 dari 68 | +538 m |
| jarak RS | 4 dari 68 | +110 m |
| `n_sd` | 14 dari 68 | |
| `n_sma_smk` | 15 dari 68 | |
| `n_smp` | 13 dari 68 | |
| `n_klinik` | 7 dari 68 | |

Cibadak jarak kliniknya naik dari 58 m jadi 1.100 m, Ranggamekar dari 97 m jadi 907 m.
Dua kelurahan itu tadinya punya klinik `fallback` yang koordinatnya diturunkan dari
kelurahan, jadi angka 58 m itu memang tidak pernah nyata.

Cakupan kota hampir tidak bergerak: klinik 49,6% jadi 50,4%, puskesmas 79,2% jadi
78,6%, RS tetap 99,1%.

Yang kena cuma dimensi Kesehatan dan Pendidikan. Sosial, Ekonomi, Transportasi, dan
Lingkungan tidak memakai titik faskes atau sekolah, jadi tidak perlu dihitung ulang.
Tapi `skor_livable`, `kelas`, dan `peringkat` ikut bergeser karena dua dimensi itu
masuk ke rata-ratanya.

## Yang aku butuh balik

1. gpkg versi baru, atau hasil ekspornya ke `kelurahan.geojson`
2. Rumus `jarak_*_m` yang kamu pakai

Nomor 2 itu permintaan serius. Aku coba reproduksi dengan titik berat kelurahan ke
fasilitas terdekat, selisihnya rata-rata 500 sampai 700 m dari angka yang tersimpan.
Jadi aku tidak tahu definisinya, dan tanpa itu aku tidak bisa memeriksa hasilmu atau
menuliskan metodologinya di laporan. Cukup satu paragraf: diukur dari mana ke mana,
jarak lurus atau lewat jaringan jalan, dan apakah fasilitas di luar batas kota ikut
dihitung.

Hal yang sama berlaku untuk `n_*`. Tidak ada satu aturan pun yang cocok 68 dari 68.
Lewat kolom label cocok 58 sampai 62 dari 68, spasial 54 sampai 56, jadi masih ada
langkah di tengah yang belum ketahuan.

## Kalau kamu ekspor ulang geojson titiknya

`gis/sql/faskes.sql` dan `sekolah.sql` sudah aku ubah supaya kolom `kualitas` ikut
terekspor. Kalau ekspormu menimpa `public/data/faskes.geojson` atau `sekolah.geojson`
dengan koordinat yang lama, jalankan ini untuk menerapkan koreksinya lagi:

    node gis/terapkan-koreksi-titik.js
    .\gis\build-postgis.ps1

Skripnya aman dijalankan berulang. Kalau koordinatnya sudah benar, hasilnya nol
perubahan.
