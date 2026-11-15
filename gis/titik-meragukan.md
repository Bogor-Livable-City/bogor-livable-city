# Titik meragukan

Diperbarui 15 November 2026.

Sudah tidak ada. Tidak ada titik di `public/data/faskes.geojson` dan
`public/data/sekolah.geojson` yang kolom `kualitas`-nya bernilai "meragukan".
Seluruhnya sudah dicek manual dan koordinatnya diganti, jejaknya di
`gis/koreksi-titik.csv` dan dua laporan `*-final.md`.

## Catatan

Kolom "Kelurahan menurut koordinat" diisi dengan uji titik-dalam-poligon terhadap
`public/data/kelurahan.geojson`. Isinya "sama" kalau cocok dengan label, nama
kelurahan lain kalau berbeda, atau "di luar batas" kalau titiknya jatuh di luar
seluruh wilayah Kota Bogor.

File ini dibuat ulang dengan `node gis/buat-laporan-titik.js`.
