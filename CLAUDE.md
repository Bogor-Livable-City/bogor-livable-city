# Ruang Bogor — panduan kerja

WebGIS kelayakhunian 68 kelurahan Kota Bogor. Next.js 16 (App Router, Turbopack) + Leaflet.
Data spasial diolah di luar aplikasi lalu di-commit sebagai GeoJSON statis di `public/data/`.
GeoJSON itu juga diimpor ke PostGIS lokal untuk backend (`gis/build-postgis.ps1`, lihat `gis/README.md`).
GeoJSON tetap sumbernya; database adalah turunan, jadi jangan edit tabelnya langsung.

## Skill yang dipakai di project ini

| Skill | Dipakai untuk |
|---|---|
| `ponytail:ponytail` | Semua pekerjaan koding. Perubahan sekecil mungkin yang menyelesaikan tugas. |
| `antislop` + `antislop-ui` | Setiap kali menyentuh tampilan. `antislop` selalu, `antislop-ui` untuk warna/layout/komponen. |
| `antislop-human` | Kontras, fokus keyboard, tap target. |
| `antislop-layoutmobile` | Layout yang harus luwes dari HP sampai desktop. |
| `antislop-copywriting` | Teks yang dibaca orang: judul, CTA, penjelasan metodologi. |
| `antislop-code` | Komentar kode. |
| `humanizer:humanizer` | Prosa berbahasa Indonesia supaya tidak berbunyi seperti hasil AI. |
| `design-taste-frontend` | Halaman publik: beranda, peta, peringkat, perbandingan. |
| `ui-ux-pro-max` | Komponen baru, tipografi, warna, bagan. |

Skill antislop terpasang di `.claude/skills/` (dari github.com/miqdadbadjuber/anti-slop).
Hasil audit tersimpan di `anti-slop/`.

## Aturan project

- Bahasa antarmuka dan komentar kode: Indonesia. Angka pakai format Indonesia (`toLocaleString("id-ID")`, koma desimal).
- Skor kelayakhunian **tidak** dihitung di aplikasi. Angkanya hasil olahan GIS, masuk lewat `app/kelurahan-data.ts`. Yang dihitung di aplikasi hanya turunannya (rata-rata kecamatan, simulasi bobot di `/sensitivitas`).
- Tambah indikator baru berarti menyentuh empat tempat sekaligus: `gis/sql/kelurahan.sql` → `app/kelurahan-data.ts` → tipe `KelurahanProps` di `app/lib/livability.ts` → halaman/API yang menampilkannya.
- Pipeline GIS butuh ogr2ogr dari QGIS. Di laptop ini ada di `C:\Program Files\QGIS 4.2.1\bin` (bukan 3.44.15 seperti default skrip), dan perlu `PROJ_LIB` diarahkan ke `C:\Program Files\QGIS 4.2.1\share\proj`.
