# Perubahan task pada A1_Kelompok 3_Liveable City.mpp

Daftar suntingan supaya daftar task cocok dengan pekerjaan yang benar-benar
dikerjakan. Rentang tanggal 24 Agustus sampai 13 November 2026, kalender, dan
daftar sumber daya tidak berubah.

Sebagian besar baris cukup diganti namanya, bukan dihapus lalu dibuat ulang.
Mengganti nama membuat tautan antartask (predecessor) dan penugasan sumber
dayanya ikut terbawa, jadi jadwalnya tidak berantakan.

Nomor ID di bawah mengikuti penomoran pada berkas aslinya.

## Sprint 1, Analisis Kebutuhan dan Desain Sistem

Total 12 hari dan tetap 12 hari.

| ID | Tindakan | Isi |
|---|---|---|
| 4 | tetap | Sprint Planning |
| 5 | durasi | Elisitasi Kebutuhan & Penyusunan PRD, 1 hari jadi **2 hari** |
| 6 | nama, durasi | jadi **Perumusan formula dan pembobotan indeks kelayakhunian**, 1 hari jadi **2 hari** |
| 7 | nama, sumber daya | jadi **Penetapan 12 indikator beserta sumber datanya**, durasi 2 hari tetap, tambahkan GIS Developer |
| 8 | nama | jadi **Perancangan skema data spasial dan struktur GeoJSON**, durasi 2 hari tetap |
| 9 | nama, durasi | jadi **Desain antarmuka dan alur halaman**, 4 hari jadi **2 hari** |
| 10 | tetap | Sprint Review |

ID 7 semula Pemodelan Sistem (UML) dan ID 9 semula prototipe Figma. Tidak ada
jejak keduanya di repositori, jadi kuganti dengan pekerjaan yang buktinya ada.
Kalau kalian memang membuat UML atau prototipe Figma, biarkan saja nama aslinya
dan cukup sesuaikan durasinya.

## Sprint 2, Pengolahan Data Spasial

Total 12,25 hari dan tetap 12,25 hari.

| ID | Tindakan | Isi |
|---|---|---|
| 12 | tetap | Sprint Planning |
| 13 | nama | jadi **Harmonisasi CRS dan topologi dataset spasial**, durasi 2 hari tetap |
| 14 | nama | jadi **Penggantian indikator yang datanya tidak dapat dipakai**, durasi 2 hari tetap |
| 15 | nama, durasi | jadi **Perhitungan tutupan vegetasi dan cakupan layanan faskes**, 5 hari jadi **3 hari** |
| 16 | nama | jadi **Agregasi indikator ke level kelurahan**, durasi 3 hari tetap |
| baru | tambah | **Koreksi koordinat titik fasilitas dan uji titik-dalam-poligon**, 2 hari, GIS Developer dan BE Programmer, sisipkan setelah ID 16 |
| 17 | tetap | Sprint Review |

ID 14 semula Analisis Spasial Buffer Jangkauan Faskes. Berkas hasilnya ada di
repositori tetapi sudah tidak dipanggil aplikasi, digantikan indikator cakupan
yang dihitung dari grid permukiman. ID 15 semula Analisis Overlay Kesesuaian
Penggunaan Lahan vs Pola Ruang, dan tidak ada jejaknya pada data akhir.

Task baru itu pekerjaan nyata di luar rencana: 56 titik fasilitas berlabel
kelurahan yang bertentangan dengan koordinatnya, 69 titik diperiksa manual, 64
koordinat diganti, 4 dihapus.

## Sprint 3, Basis Data dan Backend

Total 7,25 hari dan tetap 7,25 hari. Tidak ada durasi yang berubah.

| ID | Tindakan | Isi |
|---|---|---|
| 19 | tetap | Sprint Planning |
| 20 | nama | jadi **Setup PostGIS dan impor layer GeoJSON di luar aplikasi**, 1 hari |
| 21 | nama | jadi **Endpoint pembacaan wilayah, peringkat, dan perbandingan**, 2 hari |
| 22 | nama | jadi **Pipeline perhitungan indeks dengan skrip Python di luar aplikasi**, 2 hari |
| 23 | nama | jadi **Ekspor GeoJSON statis dan simplifikasi geometri**, 2 hari |
| 24 | tetap | Sprint Review |

ID 22 semula Implementasi Business Logic Kalkulasi Livability Index. Skornya
tidak pernah dihitung di dalam aplikasi; angkanya hasil pengolahan di luar
aplikasi yang masuk sebagai data statis. Kata "di luar aplikasi" pada ID 20 dan
22 sengaja ditulis supaya tidak tertukar dengan basis data saat berjalan, yang
memang tidak ada.

## Sprint 4, Front End WebGIS

Total 15,25 hari jadi 19,25 hari, masih di dalam jendela 19,625 hari. Kelima
task lama dipendekkan dari 3 hari ke 2 hari untuk memberi ruang empat task baru.

| ID | Tindakan | Isi |
|---|---|---|
| 26 | tetap | Sprint Planning |
| 27 | nama, durasi | jadi **Setup layout dan integrasi Leaflet**, 3 hari jadi **2 hari** |
| 28 | nama, durasi | jadi **Kontrol layer tematik dan pemilih basemap**, 3 hari jadi **2 hari** |
| 29 | nama, durasi | jadi **Rendering choropleth indeks kelayakhunian**, 3 hari jadi **2 hari** |
| 30 | nama, durasi | jadi **Filter, pencarian, dan interaksi klik wilayah**, 3 hari jadi **2 hari** |
| 31 | nama, durasi | jadi **Halaman peringkat dan perbandingan wilayah**, 3 hari jadi **2 hari** |
| baru | tambah | **Peta 3D ekstrusi berbasis kanvas**, 3 hari, FE Programmer |
| baru | tambah | **Halaman profil wilayah, statistik, dan metodologi**, 2 hari, FE Programmer |
| baru | tambah | **Halaman asisten Tanya Bogor**, 2 hari, BE Programmer dan FE Programmer |
| baru | tambah | **Dashboard admin, dikeluarkan dari lingkup rilis**, 2 hari, FE Programmer |
| 32 | tetap | Sprint Review |

Keempat task baru disisipkan setelah ID 31 dan sebelum Sprint Review.

Dashboard admin sengaja dimasukkan walaupun akhirnya dibatalkan. Pekerjaannya
nyata, enam halaman, dan menyita kapasitas tim menjelang demo. Menghapusnya akan
membuat Sprint 4 terlihat lebih ringan daripada kenyataannya. Kalau menurut
kalian lebih rapi tanpa itu, tinggal dihapus dan sisa durasinya dibagi ke task
lain.

## Sprint 5, Pengujian, Deployment, dan Penutupan

Total tetap. Tidak ada durasi yang berubah.

| ID | Tindakan | Isi |
|---|---|---|
| 34 | tetap | Sprint Planning |
| 35 | nama, sumber daya | jadi **Pengujian fungsional dan akurasi data spasial**, 2 hari tetap, ganti Project Manager menjadi System Analyst dan BE Programmer |
| baru | tambah | **Perbaikan cacat kritis sebelum demonstrasi**, 1 hari, BE Programmer dan FE Programmer, sisipkan setelah ID 35 |
| 36 | nama | jadi **Deployment aplikasi ke Vercel**, 1 hari tetap |
| baru | tambah | **Final Product Demonstration**, milestone 0 hari, Project Manager, sisipkan setelah deployment |
| 37 | tetap | Penyusunan Laporan Akhir, 7 hari, tetap berjalan paralel tanpa predecessor |
| 38 | tetap | Sprint Review |

Dua task baru itu pekerjaan nyata: dua cacat kritis ditemukan dan diperbaiki
sehari sebelum demo, dan demonstrasi memang jadi titik yang menentukan karena
aplikasinya belum terbit ke publik pada hari itu.

## Ringkasan jumlah

| Sprint | Ganti nama | Ubah durasi | Task baru |
|---|---|---|---|
| 1 | 4 | 3 | 0 |
| 2 | 4 | 1 | 1 |
| 3 | 4 | 0 | 0 |
| 4 | 5 | 5 | 4 |
| 5 | 2 | 0 | 2 |
| Total | 19 | 9 | 7 |

Tidak ada task yang perlu dihapus.

## Cara menambah task di MS Project

Klik kanan baris Sprint Review pada sprint yang bersangkutan, pilih Insert Task,
lalu ketik namanya. Pastikan outline level-nya sama dengan task lain di sprint
itu; kalau meleset, pakai tombol Indent atau Outdent pada tab Task. Isi kolom
Duration, lalu kolom Resource Names. Tautan ke task sebelumnya akan terbentuk
sendiri bila kalian memakai Link Tasks, atau isi kolom Predecessors secara
manual dengan ID task di atasnya.
