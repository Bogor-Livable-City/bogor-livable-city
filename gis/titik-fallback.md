# Titik fallback

Diperbarui 15 November 2026.

1 titik, dari `public/data/faskes.geojson` dan `public/data/sekolah.geojson`,
yaitu yang kolom `kualitas`-nya bernilai "fallback".

"Fallback" artinya koordinatnya tidak pernah diketahui. Yang dipakai adalah titik
mewakili kelurahannya, jadi koordinat di file ini bukan lokasi tempat itu sebenarnya.
Label kelurahannya benar, koordinatnya tidak.

Fallback ikut dipakai menghitung jarak dan cakupan dalam skor kelayakhunian, dan
jarak yang diukur dari titik yang dikarang sendiri tidak mengukur apa pun.

### Sekolah (1)

| Nama | Jenis | Kelurahan tertulis | Kecamatan | Koordinat sekarang | Kelurahan menurut koordinat | Peta |
|---|---|---|---|---|---|---|
| SEKOLAH MENENGAH ATAS NEGERI 11 BOGOR | sma_smk | KAYU MANIS | Tanah Sareal | -6.527083, 106.770782 | sama | [cari](https://www.google.com/maps/search/SEKOLAH%20MENENGAH%20ATAS%20NEGERI%2011%20BOGOR%20Bogor) |

## Catatan

Kolom "Kelurahan menurut koordinat" diisi dengan uji titik-dalam-poligon terhadap
`public/data/kelurahan.geojson`. Isinya "sama" kalau cocok dengan label, nama
kelurahan lain kalau berbeda, atau "di luar batas" kalau titiknya jatuh di luar
seluruh wilayah Kota Bogor.

File ini dibuat ulang dengan `node gis/buat-laporan-titik.js`.
