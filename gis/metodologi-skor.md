# Metodologi skor kelayakhunian

15 November 2026. Diverifikasi langsung terhadap kolom perantara di
`livable_kelurahan_v3_lengkap.gpkg`, bukan ditebak dari hasil akhirnya. Angka
"selisih maks" di bawah ini diuji atas 68 kelurahan.

Gpkg menyimpan setiap langkah antara sebagai kolom tersendiri, jadi rumusnya bisa
dibuktikan, bukan disimpulkan.

## Rantai perhitungannya

| Langkah | Rumus | Selisih maks |
|---|---|---|
| `P1_sekolah_per_10rb_pddk` | 10.000 × (n_SD + n_SMP + n_SMA_SMK) / penduduk | 0,000000 |
| `P2_jarak_jalan_rata2_m` | rata-rata `jarak_SD_m`, `jarak_SMP_m`, `jarak_SMA_SMK_m` | 0,000000 |
| `K1_cakupan_gabungan_pct` | rata-rata cakupan puskesmas 2 km, klinik 1 km, RS 5 km | 0,000000 |
| `K2_jarak_komposit_0_1` | rata-rata min-max tiga jarak faskes | 0,000000 |
| `norm_*` | min-max ke 0–1; yang berakhiran `_dibalik` dikurangkan dari 1 | 0,000000 |
| `skor_dimensi` | min-max dari rata-rata dua kolom `norm_*` | 0,000000 |
| `total_6_dimensi` | jumlah enam `skor_dimensi` | 0,000000 |
| `skor_livable` | min-max dari `total_6_dimensi` dibagi 6 | 0,000000 |
| `kelas` | lima interval sama lebar: 0,2 / 0,4 / 0,6 / 0,8 | cocok 68/68 |
| `peringkat` | urutan `skor_livable` menurun | cocok 68/68 |

Min-max muncul dua kali, di tingkat indikator dan lagi di tingkat dimensi, lalu
sekali lagi di `skor_livable`. Akibatnya setiap dimensi selalu punya tepat satu
kelurahan bernilai 0 dan satu bernilai 1, dan skor tidak bisa dibandingkan antar
periode. Begitu satu nilai berubah, pembaginya berubah dan semua angka bergeser.

## Dua belas indikator

| Dimensi | Indikator | Arah |
|---|---|---|
| Kesehatan | `K1_cakupan_gabungan_pct` | positif |
| | `K2_jarak_komposit_0_1` | negatif |
| Pendidikan | `P1_sekolah_per_10rb_pddk` | positif |
| | `P2_jarak_jalan_rata2_m` | negatif |
| Sosial Kependudukan | `S1_kepadatan_jiwa_km2` | negatif |
| | `S2_kriminalitas_per_10rb` | negatif |
| Ekonomi | `E1_kawasan_perdagangan_pct` | positif |
| | `E2_kawasan_industri_pct` | positif |
| Transportasi | `T1_badan_jalan_pct` | positif |
| | `T2_kerapatan_jalan_osm_km_km2` | positif |
| Lingkungan | `L1_vegetasi_pct` | positif |
| | `L2_vegetasi_m2_per_jiwa` | positif |

Tiap dimensi punya dua indikator berbobot sama. Kesehatan terlihat seperti punya
empat dan Pendidikan lima, tapi jarak-jaraknya sudah digabung dulu jadi satu
komposit sebelum masuk hitungan dimensi. Itu sebabnya `jarak_rs_m` efektifnya cuma
berbobot seperenam, bukan seperempat.

Dua hal yang perlu diputuskan sadar, bukan diwarisi begitu saja:

`E2_kawasan_industri_pct` diperlakukan **positif**, jadi kelurahan dengan kawasan
industri lebih luas dinilai lebih layak huni.

Aplikasi menulis "10 indikator" di tiga tempat: `app/layout.tsx:11`,
`app/page.tsx:70`, dan `app/components/ui.tsx:285`. Yang benar dua belas.

## Jarak diukur lewat jaringan jalan, dirata-rata atas kisi permukiman

Ini bukan hasil tebakan lagi. Skrip pembuatnya ada di
`Bogor Liveable City/hasil_prototipe/v3/skrip/`.

`jarak_*_m` **bukan** jarak dari titik berat kelurahan. Caranya:

1. Area permukiman tiap kelurahan diambil dari `PEMUKIMAN_AR_25K.csv`, dipotong
   batas kelurahan. Kalau kelurahan itu tidak punya poligon permukiman, seluruh
   wilayahnya dipakai.
2. Area itu diisi kisi titik berjarak 75 m. Kalau titiknya kurang dari lima, kisinya
   dirapatkan ke 25 m. Kalau tetap nol, dipakai satu titik perwakilan.
3. Tiap titik kisi di-snap ke jaringan jalan OSM, lalu dihitung jarak tempuhnya ke
   fasilitas terdekat dari jenis itu. Jarak snap di kedua ujung ikut ditambahkan.
4. `jarak_X_m` adalah **rata-rata** jarak itu atas seluruh titik kisi di kelurahan.

Jadi angkanya mengukur keterjangkauan rata-rata penduduk, bukan jarak satu titik.
Itu sebabnya tidak ada nilai nol meski ada puskesmas di dalam kelurahan, dan
angkanya ikut membesar seiring luas kelurahan.

Jaringannya `hasil_prototipe/data_input/jalan_osm_bogor.geojson`, 21.276 ruas, jauh
lebih padat daripada 4.236 ruas RBI. Kelas jalan yang dibuang: motorway,
motorway_link, construction, proposed, raceway. Hanya komponen tersambung terbesar
yang dipakai, sisanya diabaikan.

Routingnya di `netlib.py`: proyeksi ke EPSG:32748, simpul dibulatkan ke enam
desimal, bobot minimum untuk pasangan simpul yang sama, Dijkstra multi-sumber dari
seluruh fasilitas sekaligus.

### Jaringan RBI memang tidak dipakai

Untuk catatan: graf dari `public/data/jalan.geojson` cuma tersambung 61,6 persen,
dan 78,8 persen setelah `ST_Node`. Jaringan itu tidak pernah dipakai untuk
menghitung jarak. Yang memakainya hanya `T2_kerapatan_jalan_osm_km_km2`, dan itu
pun dari OSM, bukan RBI.

## Cakupan dihitung dari titik kisi, bukan luas buffer

`cakupan_X_pct` adalah **persentase titik kisi permukiman** yang jarak tempuhnya ke
fasilitas terdekat berada dalam radius. Radiusnya: klinik 1 km, puskesmas 2 km,
rumah sakit 5 km, tiap jenjang sekolah 3 km.

Ini mengoreksi dugaan sebelumnya. Metode gabungan buffer dipotong batas wilayah
memang menghasilkan total se-kota yang mirip (55,17 berbanding 55,34 km² untuk
klinik), tapi itu kebetulan. Per kelurahan hasilnya akan berbeda, karena buffer
mengukur luas sedangkan yang asli mengukur titik permukiman, dan keduanya memakai
jarak yang berbeda pula: buffer memakai jarak lurus, aslinya jarak tempuh.

`K1_cakupan_gabungan_pct` adalah rata-rata tiga cakupan itu, terverifikasi
0,000000.

## Jumlah fasilitas

Faskes dihitung dari kolom `kel`, cocok 68/68.

Sekolah memakai aturan campuran, dan itu sebabnya tidak ada satu aturan tunggal yang
cocok. Di `build_v3.py`: sekolah yang kolom `akurasi_koordinat`-nya dimulai dengan
"perlu dicek" **dan** koordinatnya masuk kotak Bogor dipindah ke kelurahan tempat
titiknya jatuh secara spasial. Sekolah lainnya tetap memakai kelurahan yang tertulis
di sumbernya.

Jadi 62/68 lewat label dan 54/68 spasial itu wajar: metodenya campuran keduanya.

## Bagaimana koordinat dipilih

Fungsi `pick()` di `build_v2.py` menjelaskan asal masalah koordinat yang kita
benahi kemarin:

| Jarak koordinat ke kelurahan yang tertulis | Hasil | Kualitas |
|---|---|---|
| sampai 300 m | koordinat dipakai | baik |
| 300 m sampai 1.500 m | koordinat dipakai, ditandai `_jauh` | meragukan |
| lebih dari 1.500 m, atau tidak ada koordinat | titik perwakilan kelurahan | fallback |

Puskesmas dan rumah sakit yang gagal geocode dipulihkan dulu dari `PUSKESMAS_PT.csv`
dan `RUMAHSAKIT_PT_25K.csv` lewat pencocokan nama Jaccard dengan ambang 0,5.

Yang dibuang dari daftar faskes: Puskesmas Pembantu dan yang namanya memuat PUSTU,
Klinik Kecantikan, dan baris yang ditandai dugaan duplikat. Itu sebabnya faskesnya
120, bukan jumlah mentah dari Dinkes.

## Tidak ada dua versi skor resmi

Dugaan sebelumnya salah. `skor_livable_v2` di `7_livable` bukan skema pembobotan
alternatif, melainkan skor dari prototipe v2 yang dibawa serta untuk pembanding.
Di `score_v3.py` barisnya begini:

    out[Skor_Livable_v2] = v2[Skor_Livable].reindex(d.kode).values

Yang resmi `skor_livable`, dan itu yang dipakai aplikasi. Peringkat yang berbeda di
64 dari 68 kelurahan itu memang perbedaan antar versi prototipe, bukan perselisihan
metode.

## Uji sensitivitas yang sudah pernah dijalankan

`score_v3.py` sudah memuat varian berikut, jadi tidak perlu dikerjakan ulang:

- kepadatan penduduk diperlakukan positif, sesuai Tabel 1 jurnal acuan
- Sosial hanya kepadatan, atau hanya kriminalitas
- Ekonomi dengan `ikp` menggantikan industri, atau hanya perdagangan
- Kesehatan hanya `K1`, atau hanya `K2`
- Pendidikan hanya `P1`, atau hanya `P2`
- Transportasi hanya `T1`
- radius rumah sakit 3, 4, dan 6 km selain 5 km
- mode `strict`, memakai hanya titik berkualitas "baik"

Kecocokannya diukur dengan korelasi Spearman terhadap skor dasar.
