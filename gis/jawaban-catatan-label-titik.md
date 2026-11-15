# Jawaban atas catatan label titik

Balasan untuk `catatan-untuk-zaidan.md`. Ditulis 13 November 2026, setelah
menelusuri `gis/sql/*.sql`, `build-data.ps1`, dan tiga berkas di `public/data/`.

## Ringkasan

1. `n_sd`, `n_smp`, `n_sma_smk` berasal dari tabel **`2_pendidikan`** di dalam
   gpkg, bukan dari `sekolah.geojson`. Dua keturunan berbeda dari satu gpkg.
2. Dugaan "daftar sekolahnya berbeda" tidak terbukti. Totalnya sama persis,
   556 sekolah, bahkan sama per jenjang. Sekolahnya sama, pembagian ke
   kelurahannya yang berbeda.
3. **Normalisasi ulang tidak perlu dijalankan.** Skor Pendidikan tidak pernah
   membaca `sekolah.geojson`, jadi koreksi label di sana tidak menggeser skor
   satu angka pun.

## 1. Asal angkanya

`gis/sql/kelurahan.sql`:

```sql
p.n_SD AS n_sd, p.n_SMP AS n_smp, p.n_SMA_SMK AS n_sma_smk,
round(p.P1_sekolah_per_10rb_pddk, 2) AS sekolah_per_10rb,
round(p.P2_jarak_jalan_rata2_m, 0)   AS jarak_sekolah_m,
...
LEFT JOIN "2_pendidikan" p ON p.kode = l.kode
```

`gis/sql/sekolah.sql`:

```sql
SELECT nama, 'sd' AS jenis, npsn, kel AS kelurahan, kec AS kecamatan, geom FROM titik_sd
UNION ALL SELECT nama, 'smp',     npsn, kel, kec, geom FROM titik_smp
UNION ALL SELECT nama, 'sma_smk', npsn, kel, kec, geom FROM titik_sma_smk
```

Jadi `kelurahan.geojson` mengambil angka dari tabel agregasi `2_pendidikan`,
sedangkan `sekolah.geojson` mengambil titik dari `titik_sd`, `titik_smp`, dan
`titik_sma_smk`. Keduanya tidak saling menurunkan.

## 2. Bukti bahwa sekolahnya sama

| | SD | SMP | SMA/SMK | Jumlah |
|---|---|---|---|---|
| Tersimpan di `kelurahan.geojson` | 270 | 129 | 157 | **556** |
| Titik di `sekolah.geojson` | 270 | 129 | 157 | **556** |

Sama sampai per jenjang. Kalau `2_pendidikan` diagregasi dari daftar sekolah
yang berbeda atau dari gpkg yang lebih lama, totalnya hampir pasti meleset.
Ini tidak meleset sama sekali, jadi 556 sekolahnya memang sekolah yang sama.

Cara mengecek ulang:

```python
import json
D = r"public\data"
kel = json.load(open(D + r"\kelurahan.geojson", encoding="utf-8"))["features"]
sek = json.load(open(D + r"\sekolah.geojson",   encoding="utf-8"))["features"]
print(sum((f["properties"]["n_sd"] or 0) + (f["properties"]["n_smp"] or 0)
          + (f["properties"]["n_sma_smk"] or 0) for f in kel), len(sek))
# 556 556
```

## 3. Kenapa tidak bisa direproduksi

`build-data.ps1` menyederhanakan poligon kelurahan saat ekspor:

```
Export $Gpkg "kelurahan.sql" "kelurahan" @("-nlt","MULTIPOLYGON","-simplify","0.00003", ...)
```

Nilai 0,00003 derajat setara **sekitar 3,3 meter** di lintang Bogor. Poligon di
`public/data/kelurahan.geojson` karena itu bukan batas aslinya, sedangkan
`2_pendidikan` hampir pasti diagregasi di QGIS terhadap batas asli di dalam
gpkg. Menghitung ulang terhadap batas yang sudah bergeser 3,3 meter tidak akan
pernah cocok 68 dari 68.

Angka pada catatan sudah aku dapat ulang persis: cocok lewat label 40 dari 68,
cocok lewat lokasi 37 dari 68, dengan membandingkan total sekolah per kelurahan.

## 4. Kenapa normalisasi ulang tidak perlu

Dua pemeriksaan:

- `sekolah_per_10rb` konsisten dengan `n_sd + n_smp + n_sma_smk` yang tersimpan,
  pada **68 dari 68** kelurahan.
- `skor_pendidikan` dapat dihasilkan ulang dari `sekolah_per_10rb` dan
  `jarak_sekolah_m` dengan min-max, dijumlahkan, lalu dinormalisasi ulang.
  Selisih maksimum **0,0003**, sebesar efek pembulatan saja.

Rantai datanya:

```
2_pendidikan → sekolah_per_10rb + jarak_sekolah_m → skor_pendidikan → skor_livable
sekolah.geojson → hanya layer titik di peta, tidak masuk ke skor
```

`selisih-jumlah-titik.csv` menunjukkan selisih antara dua cara menghitung,
bukan perubahan pada angka yang dipakai sistem. Selama `2_pendidikan` tidak
diubah, skor tidak bergerak.

Menghitung ulang dari titik tetap boleh dilakukan, tetapi itu **penggantian
metodologi, bukan perbaikan bug**. Kalau ditempuh, harus konsisten untuk semua
indikator berbasis titik, bukan Pendidikan saja, dan harus memakai batas asli.

## 5. Catatan tentang koreksi labelnya

`fix-label-titik.ps1` berjalan lewat PostGIS, yang isinya diimpor dari
`public/data`, sehingga batas yang dipakai adalah batas yang sudah
disederhanakan 3,3 meter. Ambang 10 meter yang dipakai hanya sekitar tiga kali
besar galat tersebut.

Sebaran jarak titik sekolah ke garis batas terdekat:

| Jarak | Jumlah titik |
|---|---|
| < 5 m | 2 |
| < 10 m | 15 |
| < 20 m | 37 |
| < 50 m | 95 |

Tiga klinik Cibuluh yang jatuh 0,6 meter di luar batas berada jauh di dalam
rentang galat itu. Pada jarak sekecil itu yang meleset kemungkinan besar
geometrinya, bukan labelnya, jadi ketiganya sebaiknya tetap CIBULUH.

Satu asumsi lagi yang belum diuji: untuk sekolah, kolom `kel` kemungkinan
berasal dari Dapodik, yaitu alamat administratif resmi, sedangkan koordinatnya
sering merupakan hasil geocoding kasar. Jadi "koordinat lebih benar daripada
label" belum tentu berlaku untuk layer sekolah.

Dua titik yang geometrinya memang salah dan layak diperbaiki:

| Titik | Jarak di luar batas |
|---|---|
| SDIT AL HIKMAH | 57,7 m |
| SMK PUTRA HARAPAN BOGOR | 307,1 m |

Jarak sebesar itu bukan efek penyederhanaan.

Catatan kecil: contoh UPTD Puskesmas Bondongan pada catatan sudah tidak cocok
dengan isi berkas sekarang, karena koreksinya sudah dijalankan. Isi berkas saat
ini sudah berlabel Bondongan.

## 6. Yang perlu diputuskan

Pilih satu sumber kebenaran, lalu konsisten:

| Pilihan | Konsekuensi |
|---|---|
| `2_pendidikan` tetap acuan | Label di `sekolah.geojson` hanya untuk popup dan filter, tidak perlu dibenahi demi skor |
| Hitung ulang dari titik | Semua indikator berbasis titik ikut dihitung ulang, terhadap batas asli, bukan yang disederhanakan |

Untuk seterusnya: poligon sederhana dipakai untuk tampilan saja, dan setiap
spatial join dilakukan terhadap geometri asli.

## 7. Yang masih perlu dikirim

Berkas `livable_kelurahan_v3_lengkap.gpkg` tidak ikut di-commit, dan jalurnya
menunjuk ke D: milik Zaidan. Tanpa gpkg itu, aturan agregasi `2_pendidikan`
masih berupa dugaan terkuat, bukan fakta yang terbukti. Minimal kirimkan tabel
`2_pendidikan` dan `titik_sd`, `titik_smp`, `titik_sma_smk` supaya aturannya
bisa dipastikan.
