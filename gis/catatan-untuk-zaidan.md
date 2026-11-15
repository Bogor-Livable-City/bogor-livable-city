# Catatan untuk GIS Developer — label kelurahan pada titik

Diperbarui 13 November 2026, setelah gpkg dikirim dan jawabanmu diuji ulang.

> Sudah ada lanjutannya: `tugas-zaidan-olah-ulang.md` (15 November). Koordinat 69
> titik sudah dibenahi manual dan gpkg perlu diolah ulang. Baca yang itu dulu.

## Ralat dulu

Catatan versi pertama minta kamu menjalankan ulang normalisasi dimensi Pendidikan.
**Permintaan itu salah dan sudah dicabut.** Skor Pendidikan tidak pernah membaca
`sekolah.geojson`, jadi koreksi label di sana tidak menggeser skor satu angka pun.

Jawabanmu benar di semua titik yang bisa diuji:

| Klaim | Hasil pengujian |
|---|---|
| Angka dari tabel `2_pendidikan` | Benar, `kelurahan.sql` baris 46 |
| Total sama persis per jenjang | Benar: 270 SD, 129 SMP, 157 SMA/SMK |
| `build-data.ps1` menyederhanakan poligon 0,00003 derajat | Benar, baris 33 |
| `skor_pendidikan` bisa dihasilkan ulang dari dua kolom tersimpan | Benar, selisih maksimum 0,000295 |

`selisih-jumlah-titik.csv` sudah dihapus karena isinya mendukung klaim yang salah itu.

## Dugaan Dapodik-mu terbukti, dan buktinya di gpkg sendiri

Tabel titik di gpkg punya kolom `metode`, `kualitas`, dan `jarak_ke_kel_m` yang
selama ini hilang waktu diekspor ke GeoJSON. Isinya:

| Kualitas | Sekolah | Faskes | Rata-rata jarak ke kelurahan yang tertulis |
|---|---|---|---|
| baik | 513 | 94 | 3 m |
| meragukan | 35 | 2 | 653 m |
| fallback | 8 | 24 | (koordinatnya diturunkan dari kelurahan) |

Titik "baik" rata-rata cuma 3 meter dari kelurahan yang tertulis, jadi label dan
koordinatnya sepakat. Pertentangan yang kemarin aku laporkan hampir seluruhnya
datang dari titik yang kualitasnya bukan "baik".

Dari 41 titik yang kemarin aku koreksi, 29 ternyata berkualitas "meragukan". Jadi
aku memakai koordinat yang datanya sendiri tandai tidak bisa dipercaya untuk
menimpa label yang kemungkinan besar benar. Itu sudah dikembalikan.

## Yang sekarang berlaku

Koreksi label hanya dijalankan kalau `kualitas = 'baik'` **dan** titiknya lebih dari
10 meter dari garis batas. Hasilnya **12 titik**, bukan 41:

| Layer | Dikoreksi |
|---|---|
| faskes | 4 |
| sekolah | 8 |

Contohnya UPTD Puskesmas Bondongan, yang ditulis EMPANG padahal koordinatnya
berkualitas baik dan jatuh di Bondongan. Namanya juga Bondongan.

Kolom `kualitas` sekarang ikut diekspor ke `faskes.geojson` dan `sekolah.geojson`
lewat `gis/sql/faskes.sql` dan `gis/sql/sekolah.sql`. Popup di peta menandai titik
yang letaknya cuma perkiraan, supaya pembaca tidak menyangka semua titik sama
telitinya.

## Yang masih buat kamu

### 1. 11 titik di `gis/label-ragu.csv` (dulu 44)

Sudah menyusut sendiri. Yang 33 titik berkualitas "meragukan" sudah terjawab lewat
pengecekan manual 15 November. Sisanya 11, semuanya berkualitas "baik" dan menempel
garis batas, jadi pertentangannya datang dari batas poligonnya bukan dari titiknya.

### 2. Satu titik yang geometrinya memang keliru (dulu dua)

SMK PUTRA HARAPAN BOGOR sudah terjawab: kualitasnya ternyata "meragukan", dan
koordinat barunya ada di Sindang Barang, 9,5 km dari titik lamanya.

Tinggal SDIT AL HIKMAH, 57,7 m di luar semua batas dan kualitasnya "baik". Sejauh itu
bukan efek penyederhanaan 3,3 meter, jadi geometrinya memang perlu kamu cek ke
sumber aslinya.

### 3. Aturan agregasi `2_pendidikan` masih belum pasti

Dengan gpkg di tangan aku coba reproduksi `n_SD` dari `titik_sd`:

| Cara | Cocok |
|---|---|
| spasial terhadap poligon asli | 54 dari 68 |
| lewat kolom label `kel` | 62 dari 68 |

Label lebih dekat tapi tetap tidak 68 dari 68. Jadi masih ada langkah di tengah yang
belum ketahuan, mungkin pembersihan nama kelurahan atau perlakuan khusus untuk titik
`fallback`. Angka skornya sendiri konsisten, jadi ini bukan masalah mendesak, tapi
enak kalau metodologinya bisa ditulis pasti di laporan.

## Berkas

- `gis/label-ragu.csv` — 44 titik yang perlu dicek manual
- `gis/fix-label-titik.ps1` — skrip koreksinya
- `gis/sql/03-*-terkoreksi.sql` — aturan koreksinya
- `gis/README.md` — urutan menjalankannya
