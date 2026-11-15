# Rumus `jarak_*_m`, hasil pembongkaran

Jawaban untuk permintaan nomor 2 di `tugas-zaidan-olah-ulang.md`. Ditulis
15 November 2026, dari uji terhadap angka yang tersimpan di
`public/data/kelurahan.geojson`.

## Jawabannya

`jarak_*_m` adalah **jarak tempuh melalui jaringan jalan**, bukan jarak lurus.
Diukur dari titik berat kelurahan ke fasilitas terdekat. Untuk sekolah, hasilnya
dirata-ratakan atas tiga jenjang.

Paragraf siap pakai untuk metodologi:

> `jarak_puskesmas_m`, `jarak_klinik_m`, dan `jarak_rs_m` diukur sebagai jarak
> tempuh melalui jaringan jalan, dari titik berat kelurahan ke fasilitas
> terdekat dari jenis tersebut, tanpa memandang fasilitas itu berada di
> kelurahan mana. `jarak_sekolah_m` diukur dengan cara yang sama, lalu
> dirata-ratakan atas tiga jenjang: jarak ke SD terdekat, ke SMP terdekat, dan
> ke SMA/SMK terdekat.

## Cara mengujinya

Angka yang tersimpan dihitung dari koordinat **sebelum** koreksi, sedangkan
`faskes.geojson` dan `sekolah.geojson` sudah terlanjur diperbaiki. Jadi
koordinat lama disusun ulang dulu dari `koreksi-titik.csv`: 64 baris `ganti`
dikembalikan ke `lon_lama`/`lat_lama`, dan 4 baris `hapus` ditambahkan kembali.

Hasil rekonstruksi cocok dengan jumlah asli sebelum penghapusan:

| Jenis | Titik hasil rekonstruksi |
|---|---|
| puskesmas | 25 |
| klinik | 72 |
| rs | 23 |
| sekolah | 556 |

Jaringan jalan yang dipakai untuk menguji adalah OpenStreetMap, bukan RBI.
Alasannya ada di bagian temuan sampingan di bawah.

## Hasil untuk kesehatan

Jarak jaringan dari titik berat kelurahan ke fasilitas terdekat:

| Kolom | Rasio tersimpan/hitungan | Korelasi | Selisih median |
|---|---|---|---|
| `jarak_puskesmas_m` | **1,03** | 0,975 | 187 m |
| `jarak_klinik_m` | **1,03** | 0,948 | 170 m |
| `jarak_rs_m` | **1,00** | 0,975 | 180 m |

Rasio 1,00 sampai 1,03 dengan korelasi di atas 0,94 sudah cukup untuk disebut
cocok.

Sebagai pembanding, jarak **lurus** dari titik berat menghasilkan rasio 1,51
untuk puskesmas, 1,61 untuk klinik, dan 1,58 untuk rumah sakit. Itu persis
selisih 500 sampai 700 m yang dilaporkan sebelumnya. Jarak lurus memang selalu
lebih pendek daripada jarak tempuh.

## Hasil untuk pendidikan

Jarak jaringan ke sekolah terdekat saja tidak cocok, rasionya 1,74. Yang cocok
adalah rata-rata dari tiga jarak:

| Dugaan | Rasio | Korelasi | Selisih median |
|---|---|---|---|
| ke sekolah terdekat (jenjang apa pun) | 1,74 | 0,565 | 286 m |
| hanya titik `kualitas = baik` | 1,56 | 0,594 | 241 m |
| rata-rata atas simpul jalan di kelurahan | 1,72 | 0,882 | 287 m |
| **rata-rata tiga jenjang: SD, SMP, SMA/SMK** | **1,05** | 0,790 | **132 m** |

Ini juga menjelaskan nama kolom aslinya di gpkg, `P2_jarak_jalan_rata2_m`.
Kata "rata2" di situ bukan rata-rata atas wilayah, melainkan rata-rata atas
tiga jenjang. SMA/SMK hanya 155 titik berbanding SD 270, sehingga jaraknya jauh
lebih besar dan menarik naik rata-ratanya. Itu sebabnya angka tersimpan terlihat
terlalu besar kalau dibandingkan dengan jarak ke sekolah terdekat mana pun.

## Yang ternyata bukan penyebabnya

Sempat diduga titik berkualitas rendah disaring dulu sebelum dihitung. Bukan.
Menyaring ke `kualitas = baik` justru memperburuk kecocokan, rasionya naik dari
1,74 ke 1,56 tapi tetap jauh dari 1,00. Jadi semua titik ikut dihitung, termasuk
yang `fallback`.

## Temuan sampingan: jaringan RBI terputus-putus

Perlu dicek sebelum olah ulang.

Graf yang dibangun dari `public/data/jalan.geojson` menghasilkan 8.446 simpul,
dan **komponen tersambung terbesarnya hanya 61,6%**. Hampir 40% simpul terputus
dari jaringan utama. Sebagai pembanding, graf OpenStreetMap untuk wilayah yang
sama tersambung 98,2%, dengan 124.635 simpul.

Artinya `JALAN_LN_25K` tidak ter-*noding* dengan benar: ruas-ruas yang di peta
terlihat bersambung ternyata tidak berbagi simpul, sehingga rute tidak bisa
lewat.

Kalau `jarak_*_m` dihitung di atas jaringan itu tanpa noding dulu, sebagian
kelurahan akan mendapat jarak yang terlalu besar, atau tidak terhitung sama
sekali karena rutenya terputus. Ini penting karena seluruh `jarak_*_m` akan
dihitung ulang dengan koordinat baru.

Yang perlu dilakukan sebelum menghitung ulang: jalankan *noding* pada jaringan
jalan terlebih dahulu, lalu periksa persentase komponen tersambungnya. Kalau
masih jauh di bawah 95%, pertimbangkan memakai OpenStreetMap sebagai jaringan,
atau gabungkan keduanya.

## Batas dari pengujian ini

Jaringan yang dipakai di sini OpenStreetMap, sedangkan angka tersimpan dihitung
dengan RBI, jadi sisa selisih 130 sampai 190 m memang wajar dan bukan tanda
rumusnya berbeda. Dua jaringan yang berbeda tidak akan menghasilkan rute yang
sama persis.

Korelasi untuk sekolah 0,790, lebih rendah daripada kesehatan yang di atas 0,94.
Rasio 1,05 sudah meyakinkan, tetapi kalau ternyata rata-rata tiga jenjangnya
ditimbang, misalnya menurut jumlah sekolah tiap jenjang, angkanya akan bergeser
sedikit. Konfirmasi dari Zaidan tetap diperlukan untuk hal itu.

Yang belum diuji sama sekali: `n_sd`, `n_smp`, `n_sma_smk`, dan
`cakupan_*_pct`. Baru `jarak_*_m` yang dibongkar.

Rekonstruksi koordinat lama bertumpu pada anggapan bahwa `koreksi-titik.csv`
memuat seluruh perubahan yang pernah terjadi pada kedua berkas titik. Kalau ada
koreksi lain di luar berkas itu, rekonstruksinya meleset dan hasil di atas ikut
bergeser.
