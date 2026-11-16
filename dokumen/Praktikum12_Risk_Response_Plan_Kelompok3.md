# Praktikum Lanjutan: Risk Response Planning dan Risk Management Plan

Mata kuliah Manajemen Proyek Teknologi Informasi (MPTI) · Pertemuan 12
Kelompok A1_Kelompok 3_Liveable City · Disusun 16 November 2026

---

## B.4 Identitas dan sumber proyek

| Isian | Jawaban |
|---|---|
| Proyek / kelas / kelompok | Bogor Livable City: Sistem Informasi Geografis Analisis Kelayakhunian Wilayah Kota Bogor · MPTI · A1_Kelompok 3_Liveable City |
| Anggota kelompok dan NIM | M. Karel Putra Shelvion (Project Manager), Vezajiva Arieesta Maheswari (System Analyst), Muhamad Zaidan (GIS Developer), Radithya Dhiyaurrahman (Back End Programmer), Nur Izza Yarismen (Front End Programmer). NIM diisi saat pengumpulan. |
| Risk Register sebelumnya | `Risk_Register_Kelompok3_Merged.docx`, hasil Praktikum Pertemuan 11, versi 9 November 2026. Berisi 14 risiko (R01–R14), 8 kategori, komposisi 6 High / 7 Medium / 1 Low. |
| Dokumen sumber yang digunakan | Project Charter; Dokumen Scope; WBS Dictionary; Schedule; Cost Plan; PRD Bogor Liveable City v2.1 (25 Oktober 2026); serta bukti pelaksanaan proyek 12–16 November 2026: `gis/metodologi-skor.md`, `gis/koreksi-titik.csv`, `gis/titik-meragukan-final.md`, `gis/titik-fallback-final.md`, `PERUBAHAN.md`, dan riwayat commit cabang `master` (2c9134c sampai 8f34f08). |

**Catatan posisi dokumen.** Register awal disusun 9 November 2026. Kertas kerja ini disusun 16 November 2026, yaitu pada tanggal Final Product Demonstration. Dalam rentang satu minggu tersebut sebagian risiko telah berubah statusnya dari "mungkin terjadi" menjadi "sudah terjadi dan tercatat buktinya". Perubahan itu ditulis pada kolom Catatan perubahan di Tahap 1 dan tidak menimpa penilaian awal.

---

## Kertas Kerja Tahap 1 — Review Risk Register awal

Seluruh 14 Risk ID dipertahankan. Skor awal tidak diubah. Kolom terakhir mencatat apa yang berubah sejak register disusun, beserta sumber buktinya.

| Risk ID | Risk Event / Impact (ringkas) | Skor awal | Level awal | Risk Owner | Catatan perubahan / sumber |
|---|---|---|---|---|---|
| R01 | Penyelesaian MVP melampaui baseline 16 November 2026 → demo final tertunda atau sebagian FR dikurangi | 4 × 5 = 20 | High | Project Manager | **Sudah terjadi.** Pada 16 November 2026 aplikasi belum terbit ke publik; deployment belum dijalankan. Fitur peta, indeks, peringkat, dan perbandingan berjalan di lingkungan lokal. Sumber: status repositori per 16 November 2026. |
| R02 | Indikator pengganti tidak lengkap atau tidak terverifikasi untuk 68 kelurahan → acceptance criteria WP 1.3.4 gagal, formula harus dirumuskan ulang | 4 × 4 = 16 | High | GIS Developer | **Sudah terjadi dan sudah ditangani.** Tiga CSV peta tematik ternyata berisi data identik sehingga indikator air bersih dan lama sekolah tidak dapat dipakai, dan data ekonomi SIMDATA hanya mencakup sekitar 20 dari 68 kelurahan. Formula final memakai 12 indikator pengganti, seluruhnya terisi untuk 68 kelurahan. Sumber: `gis/metodologi-skor.md`. |
| R03 | Join atribut dan harmonisasi CRS gagal sebagian karena beda penamaan, geometri tidak valid, atau beda referensi batas | 4 × 3 = 12 | Medium | GIS Developer | **Sudah terjadi dan sudah ditangani.** 56 titik fasilitas memiliki label kelurahan yang bertentangan dengan koordinatnya; 32 titik berkoordinat turunan, 24 klinik di antaranya menempati hanya 13 koordinat. Ditemukan pula varian penamaan "Kebon Kalapa" berbanding "Kebon Kelapa". Sumber: `gis/koreksi-titik.csv`, `gis/label-ragu.csv`. |
| R04 | Rantai pekerjaan backend terhenti bila anggota tidak tersedia → seluruh WP front end tertahan | 4 × 4 = 16 | High | Project Manager | **Terjadi sebagian dalam bentuk lain.** Rantai backend tidak terhenti, tetapi beban justru bertambah: perhitungan ulang indeks yang semula milik GIS Developer diambil alih Back End Programmer pada 15 November 2026. Konsentrasi beban pada satu orang terbukti nyata. Sumber: `PERUBAHAN.md` bagian 3. |
| R05 | Kapasitas pengerjaan antarmuka menurun karena rangkap peran UI/UX dan Front End | 4 × 3 = 12 | Medium | Project Manager | Belum terjadi sebagai keterlambatan terukur. Pekerjaan antarmuka peta, legenda, dan panel layer selesai pada 15–16 November 2026. |
| R06 | Kebutuhan hosting melampaui alokasi, atau pos layanan peta berbayar tidak terpakai | 3 × 3 = 9 | Medium | Project Manager | **Berubah menjadi lebih ringan.** Keputusan arsitektur menetapkan aplikasi tidak memerlukan basis data saat berjalan, sehingga kebutuhan hosting turun drastis dan dapat ditampung paket gratis. Pos layanan peta berbayar Rp1.500.000 memang tidak terpakai. Sumber: keputusan tim 16 November 2026. |
| R07 | Penambahan atau penajaman kebutuhan muncul setelah pembangunan berjalan → rework dan jadwal bergeser | 3 × 4 = 12 | Medium | System Analyst | **Sudah terjadi.** Permintaan penyesuaian tampilan peta, simbol, dan legenda muncul berulang pada 15–16 November 2026 setelah modul peta dinyatakan selesai. Sumber: riwayat commit `d53cbf7` dan `8f34f08`. |
| R08 | Endpoint penyajian layer spasial tidak memenuhi ambang 500 ms → acceptance criteria D4 gagal | 4 × 3 = 12 | Medium | Back End Programmer | **Sudah terjadi.** Berkas `kelurahan.geojson` berukuran sekitar 1,4 MB dan pemuatan kanvas peta memerlukan beberapa detik pada build produksi lokal. Simplifikasi geometri 0,00003 derajat sudah diterapkan di pipeline, namun ambang 500 ms belum diuji formal. Sumber: pengamatan build produksi 16 November 2026. |
| R09 | Defect kritis atau kesalahan perhitungan skor tidak terdeteksi sebelum demo final | 4 × 4 = 16 | High | Project Manager | **Sudah terjadi sebagian dan sudah ditangani.** Ditemukan dua cacat yang lolos sampai tahap akhir: fitur Point dan GeometryCollection terselip pada `jalan.geojson` sehingga Leaflet menggambar marker rusak, dan titik fasilitas tertimbun poligon karena berbagi z-index dengan pane choropleth. Keduanya diperbaiki 16 November 2026. Sumber: commit `8f34f08`. |
| R10 | Hasil skoring dinilai tidak merepresentasikan kondisi nyata → kredibilitas dipertanyakan, formula dihitung ulang | 3 × 4 = 12 | Medium | System Analyst | **Sebagian tertangani, sebagian masih terbuka.** Metodologi kini terdokumentasi dan dapat direproduksi dengan selisih 0,000000 terhadap sumbernya. Namun bobot dan ambang kelas tetap ditetapkan tim sendiri, dan ditemukan bahwa `industri_pct` diperlakukan positif, yang masih perlu dipertanggungjawabkan. Sumber: `gis/metodologi-skor.md`. |
| R11 | Aplikasi belum stabil diakses publik saat demo → acceptance criteria URL aktif tidak terpenuhi | 3 × 5 = 15 | High | Back End Programmer | **Sedang terjadi.** Pada 16 November 2026 deployment belum dijalankan. Hambatannya bukan teknis: build produksi lolos 89 halaman tanpa galat dan aplikasi tidak memerlukan basis data, tetapi repositori berada di akun GitHub pihak lain sehingga Vercel belum memperoleh akses. |
| R12 | Penyedia basemap membatasi kuota atau mengubah ketentuan → peta dasar gagal dimuat | 2 × 2 = 4 | Low | Front End Programmer | **Sudah terjadi dan sudah ditangani.** CARTO menutup basemap gratisnya; seluruh permintaan tile dibalas gambar "API key required" berukuran 2.049 byte. Basemap dipindahkan ke Esri pada 16 November 2026. Penilaian awal P=2 terbukti terlalu rendah. Sumber: commit `d53cbf7`. |
| R13 | Kredensial database atau endpoint API terekspos → basis data dapat diakses pihak tidak berwenang | 3 × 4 = 12 | Medium | Back End Programmer | **Eksposur berkurang karena keputusan arsitektur.** Aplikasi yang akan terbit tidak terhubung ke basis data, tidak memiliki variabel rahasia, dan modul admin dibatalkan. Kredensial PostGIS yang ada hanya untuk lingkungan lokal dan sudah ditandai terbuka secara sengaja di `gis/sql/00-setup-db.sql`. |
| R14 | Pekerjaan tambahan menyita kapasitas sehingga fitur wajib tertunda atau baseline tidak sesuai | 4 × 4 = 16 | High | System Analyst | **Sudah terjadi, lalu diselesaikan dengan pengurangan lingkup.** Dashboard admin terbangun sebagai tampilan tanpa fungsi, 800 baris pada enam halaman. Pada 16 November 2026 tim memutuskan modul admin tidak dilanjutkan. Asisten AI juga tidak dibangun. Sumber: keputusan tim 16 November 2026. |

---

## Kertas Kerja Tahap 2 — Pemilihan strategi respons dan alasan

| Risk ID | Strategi | Justifikasi berdasarkan penyebab, dampak, dan prioritas |
|---|---|---|
| R01 | Mitigate | Penyebabnya selisih struktural antara akumulasi durasi WBS dan jendela proyek; itu tidak dapat dihilangkan tanpa membatalkan proyek, sehingga Avoid tidak relevan. Yang dapat dikurangi adalah dampaknya, dengan menetapkan subset fitur wajib yang harus siap dan menyelesaikannya lebih dulu. Prioritas tertinggi (skor 20) menuntut respons aktif segera. |
| R02 | Mitigate | Ketersediaan data sekunder di luar kendali tim, tetapi dampaknya dapat ditekan dengan memilih indikator pengganti yang terisi penuh untuk 68 kelurahan dan mendokumentasikan dasar penggantiannya. Transfer tidak mungkin karena tidak ada pihak lain yang menanggung konsekuensinya. |
| R03 | Mitigate | Penyebabnya kualitas data masukan, yang dapat diperbaiki lewat pemeriksaan sistematis sebelum data dipakai. Avoid berarti membuang dataset, yang akan menghapus fitur utama. Dampaknya terbatas pada waktu pembersihan, sehingga Mitigate paling sepadan. |
| R04 | Mitigate | Konsentrasi beban tidak bisa dihindari pada tim lima orang dengan satu orang berlatar backend. Yang dapat dikurangi adalah ketergantungan tacit, melalui dokumentasi skrip dan prosedur yang dapat dijalankan ulang orang lain. |
| R05 | Accept | Dampaknya penyesuaian jadwal terbatas, bukan kegagalan deliverable, dan sebagian pekerjaan desain dapat dibantu System Analyst yang juga tercatat pada peran UI/UX. Biaya menambah orang melebihi manfaatnya pada sisa waktu proyek. Diterima dengan pemantauan. |
| R06 | Accept | Setelah arsitektur ditetapkan tanpa basis data runtime, kebutuhan hosting turun ke tingkat yang ditanggung paket gratis. Risiko tersisa berupa realokasi anggaran internal, yang berada dalam kewenangan tim dan tidak mendesak. |
| R07 | Mitigate | Perubahan kebutuhan tidak dapat dilarang karena Scrum memang membuka ruang penyesuaian tiap sprint review. Yang dapat dikurangi adalah dampaknya, dengan membekukan daftar fitur wajib dan memperlakukan permintaan baru sebagai backlog berprioritas lebih rendah. |
| R08 | Mitigate | Penyebabnya ukuran payload, yang dapat diturunkan secara teknis lewat simplifikasi geometri dan penyajian berkas statis. Accept tidak memadai karena ambang 500 ms adalah acceptance criteria tertulis pada WP 1.4.2. |
| R09 | Mitigate | Tim tidak memiliki peran QA tersendiri dan itu tidak dapat diubah pada sisa waktu, sehingga Avoid tidak tersedia. Kemungkinan lolosnya cacat diturunkan dengan pemeriksaan terprogram atas data dan tampilan, bukan mengandalkan pengujian manual di ujung jadwal. |
| R10 | Mitigate | Validasi eksternal penuh terhadap kondisi lapangan berada di luar lingkup karena survei primer dikecualikan. Yang dapat dilakukan adalah membuat metodologi dapat ditelusuri dan diuji ulang, sehingga angka dapat dipertanggungjawabkan meski bukan hasil validasi lapangan. |
| R11 | Mitigate | Penyebab teknis deployment sudah dihilangkan dengan arsitektur tanpa basis data, sehingga tinggal hambatan akses repositori. Itu dapat ditekan dengan menyiapkan jalur cadangan berupa fork ke akun yang dikuasai tim. |
| R12 | Avoid | Ketergantungan pada penyedia tile gratis yang berada di luar kendali tim dapat dihilangkan sepenuhnya dengan berpindah ke penyedia lain yang sudah dipakai proyek ini untuk mode satelit. Penyebabnya hilang, bukan sekadar berkurang. |
| R13 | Avoid | Eksposur kredensial dapat dihilangkan dengan tidak menghubungkan aplikasi publik ke basis data sama sekali dan membatalkan modul admin. Setelah keputusan itu, tidak ada kredensial maupun endpoint tulis yang terbit ke publik. |
| R14 | Avoid | Penyebabnya pekerjaan tambahan yang tidak ada di WBS. Dengan mengeluarkan dashboard admin dan asisten AI dari lingkup rilis, pemicunya dihapus, bukan dikurangi. Ini keputusan lingkup, bukan mitigasi teknis. |

**Catatan.** Tidak ada risiko yang diberi strategi Transfer. Proyek ini tidak memiliki vendor, kontrak, maupun pihak ketiga yang dapat menanggung sebagian konsekuensi, sehingga Transfer tidak tersedia secara nyata. Tidak ada pula yang diberi Escalate pada tahap perencanaan; eskalasi diatur sebagai mekanisme dalam Risk Management Plan, bukan sebagai strategi tetap per risiko.

---

## Kertas Kerja Tahap 3 — Tindakan preventif, trigger, dan kontingensi

| Risk ID | Preventive / planned response | Risk Trigger | Contingency / fallback |
|---|---|---|---|
| R01 | Tetapkan daftar fitur wajib rilis (peta choropleth, peringkat, perbandingan, profil kelurahan) dan selesaikan lebih dulu; pantau sisa pekerjaan terhadap tanggal 16 November setiap dua hari | Masih ada fitur wajib berstatus belum selesai pada H-3 dari Final Demonstration | Demo dijalankan dengan fitur wajib saja; fitur sisanya dinyatakan terbuka dan dilaporkan ke sponsor sebagai lingkup lanjutan |
| R02 | Uji keterisian setiap indikator untuk seluruh 68 kelurahan sebelum formula dikunci; catat dasar penggantian tiap indikator di dokumen metodologi | Ditemukan indikator dengan nilai kosong pada satu kelurahan atau lebih | Indikator tersebut dikeluarkan dari formula dan dimensi dihitung ulang dengan indikator tersisa; perubahan dicatat di dokumen metodologi |
| R03 | Jalankan uji titik-dalam-poligon untuk seluruh titik fasilitas terhadap batas kelurahan sebelum data dipakai menghitung indikator; samakan penamaan kelurahan antar sumber | Ditemukan titik yang label kelurahannya berbeda dari hasil uji poligon | Titik bermasalah didaftar terpisah dan diperiksa manual ke sumber aslinya; indikator tidak dihitung sebelum daftar itu nol atau tersisa kasus yang sudah dijelaskan |
| R04 | Tulis setiap langkah pengolahan sebagai skrip yang dapat dijalankan ulang, disertai urutan menjalankannya di `gis/README.md`; hindari langkah manual yang hanya diketahui satu orang | Satu anggota tidak dapat dihubungi lebih dari dua hari pada pekan berjalan | Anggota lain menjalankan skrip yang sama mengikuti README; bila hasilnya berbeda, pekerjaan dihentikan dan dibahas di rapat tim |
| R05 | Pisahkan pekerjaan desain dan implementasi antarmuka menjadi daftar tugas terpisah supaya dapat dikerjakan bergantian; System Analyst membantu bagian desain | Pekerjaan antarmuka tertinggal lebih dari tiga hari dari rencana sprint | Fitur tampilan nonwajib ditunda ke backlog; rilis memakai tampilan sederhana yang sudah berfungsi |
| R06 | Pantau tagihan dan kuota layanan hosting setiap pekan; pilih paket gratis selama kebutuhan masih tertampung | Pemakaian mencapai 80 persen kuota paket gratis | Tinjau ulang kebutuhan sumber daya; ajukan realokasi dari pos layanan peta yang tidak terpakai sebelum melampaui anggaran |
| R07 | Bekukan daftar fitur wajib rilis dan catat setiap permintaan baru sebagai backlog dengan prioritas eksplisit; sampaikan konsekuensi jadwalnya saat permintaan diajukan | Muncul permintaan perubahan pada fitur yang sudah dinyatakan selesai | Permintaan dianalisis dampaknya terhadap tanggal rilis; bila mengancam fitur wajib, dijadwalkan setelah demo final |
| R08 | Sederhanakan geometri poligon sebelum ekspor; sajikan layer sebagai berkas statis, bukan lewat basis data; ukur waktu muat peta pada build produksi | Waktu muat kanvas peta melebihi 500 ms pada pengukuran build produksi | Turunkan tingkat detail geometri atau pecah layer per kecamatan; bila masih gagal, nyatakan ambang 500 ms sebagai acceptance criteria yang belum terpenuhi dan laporkan ke sponsor |
| R09 | Verifikasi hasil perhitungan dengan pemeriksaan terprogram, bukan pengamatan visual: bandingkan hasil ulang terhadap sumbernya dan periksa keutuhan data tiap kali berkas berubah | Ditemukan satu cacat kritis atau selisih angka di luar batas pembulatan pada pemeriksaan | Perbaikan didahulukan di atas pekerjaan fitur; hasil perbaikan diuji ulang dengan pemeriksaan yang sama sebelum dilanjutkan |
| R10 | Dokumentasikan seluruh rantai perhitungan sampai dapat direproduksi angka per angka; nyatakan secara terbuka bagian mana yang merupakan keputusan tim, termasuk bobot dan arah tiap indikator | Muncul pertanyaan atas hasil skoring yang tidak dapat dijawab dengan dokumen yang ada | Sajikan dokumen metodologi sebagai dasar jawaban; bila pertanyaannya menyangkut arah indikator, tunjukkan hasil uji sensitivitas bobot sebagai pembanding |
| R11 | Pastikan aplikasi tidak memerlukan basis data maupun variabel rahasia saat berjalan; jalankan build produksi sampai lolos sebelum mencoba deployment | Build produksi gagal, atau akses repositori belum diperoleh pada H-1 | Fork repositori ke akun yang dikuasai tim dan terbitkan dari sana; bila tetap gagal, demo dijalankan dari build produksi lokal dan dinyatakan apa adanya |
| R12 | Gunakan penyedia tile yang sudah dipakai proyek untuk mode lain dan tidak memerlukan kunci; sediakan lebih dari satu pilihan basemap di antarmuka | Tile gagal dimuat atau dibalas gambar pemberitahuan oleh penyedia | Ganti URL penyedia tile pada konfigurasi basemap; pengguna dapat memilih mode lain yang masih berfungsi sementara perbaikan berjalan |
| R13 | Jangan hubungkan aplikasi publik ke basis data; jangan simpan kredensial di repositori; batalkan modul yang memerlukan autentikasi bila tidak akan diselesaikan | Ditemukan kredensial, token, atau endpoint tulis pada berkas yang akan diterbitkan | Cabut dan ganti kredensial yang terekspos, hapus dari riwayat repositori, lalu periksa ulang seluruh berkas sebelum terbit |
| R14 | Bandingkan daftar kebutuhan PRD terhadap WBS setiap kali PRD diperbarui; tandai kebutuhan yang tidak memiliki work package sebagai belum berbaseline | PRD bertambah kebutuhan tanpa pembaruan WBS, jadwal, atau anggaran | Kebutuhan tambahan dinyatakan di luar lingkup rilis dan dicatat sebagai pekerjaan lanjutan; baseline tidak diubah mendekati tanggal demo |

---

## Kertas Kerja Tahap 4 — Penugasan, waktu, dan bukti respons

| Risk ID | Risk Owner | Action Owner | Jadwal / frekuensi review | Output / evidence |
|---|---|---|---|---|
| R01 | Project Manager | Seluruh pemilik work package | Setiap dua hari sampai 16 November 2026 | Daftar fitur wajib berstatus selesai; catatan rapat harian |
| R02 | GIS Developer | GIS Developer dan Back End Programmer | Sebelum formula dikunci, lalu setiap perubahan dataset | Dokumen metodologi dan tabel keterisian indikator per kelurahan |
| R03 | GIS Developer | Back End Programmer | Setiap kali berkas titik diperbarui | `gis/koreksi-titik.csv`, `gis/label-ragu.csv`, keluaran uji titik-dalam-poligon |
| R04 | Project Manager | Back End Programmer dan GIS Developer | Mingguan | Skrip pengolahan yang dapat dijalankan ulang dan urutan menjalankannya di `gis/README.md` |
| R05 | Project Manager | Front End Programmer dan System Analyst | Setiap sprint review | Papan tugas antarmuka dengan status desain dan implementasi terpisah |
| R06 | Project Manager | Back End Programmer | Mingguan | Tangkapan layar pemakaian kuota dan catatan biaya |
| R07 | System Analyst | Project Manager | Setiap permintaan perubahan masuk | Daftar fitur wajib yang dibekukan dan catatan backlog permintaan baru |
| R08 | Back End Programmer | Back End Programmer | Setiap kali data spasial diekspor ulang | Ukuran berkas keluaran dan hasil pengukuran waktu muat pada build produksi |
| R09 | Project Manager | Back End Programmer dan GIS Developer | Setiap kali berkas data atau tampilan berubah | Catatan hasil pemeriksaan keutuhan data dan perbandingan hasil reproduksi |
| R10 | System Analyst | GIS Developer dan Back End Programmer | Sebelum demo dan saat metodologi berubah | `gis/metodologi-skor.md` beserta tabel selisih hasil reproduksi |
| R11 | Back End Programmer | Back End Programmer | Harian menjelang demo | Keluaran build produksi dan URL aplikasi yang aktif |
| R12 | Front End Programmer | Front End Programmer | Saat keluhan tampilan peta muncul | Hasil uji permintaan tile dan konfigurasi basemap pada repositori |
| R13 | Back End Programmer | Back End Programmer | Sebelum setiap penerbitan | Hasil penelusuran kredensial pada berkas yang akan terbit |
| R14 | System Analyst | Project Manager | Setiap PRD diperbarui | Tabel perbandingan kebutuhan PRD terhadap work package WBS |

---

## Kertas Kerja Tahap 5 — Estimasi residual risk dan secondary risk

Angka P dan I residual di bawah ini adalah **estimasi perencanaan dengan asumsi tindakan respons berhasil**, bukan hasil monitoring. Untuk risiko yang sudah terjadi, estimasi dibuat atas kondisi setelah penanganan dilakukan, dan dasarnya disebutkan.

| Risk ID | Skor awal | P residual | I residual | P × I | Level residual | Alasan perubahan / secondary risk |
|---|---|---|---|---|---|---|
| R01 | 20 | 4 | 3 | 12 | Medium | P tetap 4 karena keterlambatan sudah terjadi, bukan kemungkinan. I turun ke 3 karena fitur wajib sudah berfungsi sehingga yang tertunda adalah penerbitan, bukan hasil kerjanya. **Secondary risk:** memangkas lingkup demi tanggal dapat membuat fitur yang dikorbankan tidak pernah dikerjakan. |
| R02 | 16 | 2 | 3 | 6 | Medium | P turun karena indikator pengganti sudah terbukti terisi penuh untuk 68 kelurahan. I tetap 3 karena indikator pengganti bukan indikator acuan jurnal, sehingga perbandingan dengan literatur tetap terbatas. **Secondary risk:** pemakaian proksi dapat menimbulkan pertanyaan validitas yang baru. |
| R03 | 12 | 2 | 2 | 4 | Low | Pemeriksaan titik-dalam-poligon kini berjalan otomatis setiap berkas berubah, sehingga kasus serupa terdeteksi sebelum dipakai. Sisa 11 titik yang labelnya bertentangan seluruhnya berkualitas baik dan menempel garis batas. **Secondary risk:** koreksi manual memakai alamat pihak ketiga, yang akurasinya tidak seragam. |
| R04 | 16 | 3 | 3 | 9 | Medium | P turun karena langkah pengolahan sudah berupa skrip berdokumentasi yang dapat dijalankan anggota lain. I turun karena kegagalan satu orang kini menunda, bukan menghentikan. **Secondary risk:** dokumentasi dapat tertinggal dari kode bila tidak ikut diperbarui. |
| R05 | 12 | 3 | 2 | 6 | Medium | P turun sedikit karena pemisahan tugas desain dan implementasi baru berjalan sebagian. I turun karena fitur antarmuka wajib sudah selesai. |
| R06 | 9 | 2 | 2 | 4 | Low | Arsitektur tanpa basis data runtime membuat kebutuhan hosting tertampung paket gratis, sehingga pemicu utamanya hilang. |
| R07 | 12 | 3 | 3 | 9 | Medium | P tetap 3 karena permintaan perubahan masih muncul sampai hari terakhir. I turun karena daftar fitur wajib sudah dibekukan sehingga permintaan baru tidak lagi menggeser rilis. |
| R08 | 12 | 3 | 3 | 9 | Medium | Penurunan terbatas. Simplifikasi geometri sudah diterapkan dan layer disajikan statis, tetapi ambang 500 ms belum diuji formal dan berkas kelurahan masih sekitar 1,4 MB. **Secondary risk:** simplifikasi geometri menggeser batas sekitar 3,3 meter, yang pada kasus titik di tepi batas dapat mengubah hasil uji titik-dalam-poligon. |
| R09 | 16 | 3 | 3 | 9 | Medium | P turun karena pemeriksaan kini terprogram dan dijalankan tiap perubahan. I turun karena cacat yang ditemukan sejauh ini bersifat tampilan dan data, bukan kesalahan perhitungan skor. Tidak turun lebih jauh karena tim tetap tidak memiliki peran QA tersendiri. |
| R10 | 12 | 2 | 3 | 6 | Medium | P turun karena metodologi sudah dapat direproduksi angka per angka dan tertulis. I tetap 3 karena bobot dan arah indikator masih keputusan tim. **Secondary risk:** dokumentasi yang terbuka justru memudahkan penguji menemukan keputusan yang dapat diperdebatkan, misalnya `industri_pct` yang diperlakukan positif. |
| R11 | 15 | 3 | 4 | 12 | Medium | P tetap 3 karena hambatan akses repositori belum selesai. I turun dari 5 ke 4 karena tersedia dua jalur cadangan: fork ke akun sendiri, atau demo dari build produksi lokal yang sudah terbukti lolos. **Secondary risk:** penerbitan lewat fork memisahkan situs dari repositori kelompok, sehingga pembaruan berikutnya tidak otomatis ikut terbit. |
| R12 | 4 | 1 | 2 | 2 | Low | Ketergantungan pada penyedia yang menutup layanannya sudah dihapus; penyedia pengganti sudah dipakai proyek ini untuk mode satelit. I tetap 2 karena penggantian penyedia tetap berupa perubahan konfigurasi singkat. |
| R13 | 12 | 1 | 3 | 3 | Low | Aplikasi yang terbit tidak terhubung basis data, tidak memiliki variabel rahasia, dan modul admin dibatalkan, sehingga permukaan serangnya hampir nol. I tetap 3 karena insiden pada aplikasi publik tetap berdampak pada penerimaan. |
| R14 | 16 | 2 | 3 | 6 | Medium | Pemicunya dihapus dengan mengeluarkan dashboard admin dan asisten AI dari lingkup rilis. I tetap 3 karena selisih antara PRD dan WBS masih tercatat dan perlu dijelaskan pada laporan. **Secondary risk:** halaman admin yang terlanjur dibangun masih ada di repositori dan dapat disangka fitur yang berfungsi. |

**Ringkasan pergeseran level.** Sebelum respons: 6 High, 7 Medium, 1 Low. Setelah respons (estimasi): 0 High, 10 Medium, 4 Low. Tidak ada risiko yang diturunkan ke Low tanpa penyebabnya benar-benar hilang.

---

## Kertas Kerja Tahap 6 — Risk Management Plan tingkat proyek

| Komponen | Uraian kebijakan / rencana proyek kelompok |
|---|---|
| Tujuan dan ruang lingkup | Mengelola risiko ancaman pada proyek Bogor Livable City sejak perencanaan 24 Agustus 2026 sampai Final Product Demonstration dan serah terima. Mencakup jadwal, lingkup fitur, ketersediaan dan kualitas data spasial, kapasitas tim, biaya infrastruktur, mutu hasil, keamanan, serta penerimaan sponsor. Tidak mencakup risiko peluang. |
| Metode identifikasi, analisis, dan respons | Identifikasi dari telaah Project Charter, Dokumen Scope, WBS Dictionary, Schedule, Cost Plan, dan PRD, ditambah observasi langsung saat pengolahan data. Analisis kualitatif dengan Probability dan Impact 1–5. Respons dipilih dari lima strategi ancaman: Avoid, Mitigate, Transfer, Accept, Escalate. Setiap risiko ditelusuri dari penyebab, bukan langsung ke tindakan. |
| Skala P/I dan ambang prioritas | P dan I pada skala 1–5. Risk Score = P × I, rentang 1–25. Level: Low 1–5, Medium 6–14, High 15–25. Urutan prioritas High, Medium, Low; pada skor sama, risiko yang mengancam tanggal demo didahulukan. |
| Peran dan tanggung jawab | Project Manager memimpin review risiko dan memutuskan prioritas lintas pekerjaan. Risk Owner memantau kondisi satu risiko, memastikan respons berjalan, dan melaporkan perubahan eksposur. Action Owner mengerjakan tindakan dan melaporkan hasilnya; satu risiko dapat memiliki lebih dari satu Action Owner. Pada tim lima orang, satu orang dapat memegang kedua peran untuk risiko berbeda, tetapi tanggung jawabnya tetap dibedakan. Sponsor memutuskan hal di luar kewenangan tim, terutama perubahan baseline dan lingkup. |
| Aturan penanganan risiko High / Medium / Low | **High** wajib memiliki strategi, tindakan preventif, trigger terukur, kontingensi, Action Owner, dan checkpoint bertanggal; ditinjau setiap review. **Medium** wajib memiliki keputusan strategi dan minimal satu tindakan; detailnya dinilai dari perbandingan biaya dan manfaat. **Low** boleh diterima, tetapi tetap wajib memiliki alasan tertulis, trigger, dan jadwal pemantauan. Seluruh 14 risiko memiliki keputusan respons; intensitas tindakan mengikuti prioritas. |
| Jadwal dan pemicu review | Review terjadwal setiap akhir sprint. Review tambahan dijalankan segera saat salah satu terjadi: trigger suatu risiko tercapai, muncul risiko baru, skor berubah, PRD atau baseline diperbarui, atau suatu risiko berubah menjadi issue. Menjelang Final Demonstration, review harian untuk risiko berlevel High. |
| Komunikasi, eskalasi, dan otorisasi | Status risiko dibahas pada rapat tim dan dicatat pada papan kerja kelompok. Risk Owner melaporkan perubahan eksposur kepada Project Manager. Eskalasi ke sponsor dilakukan bila risiko berada di luar kewenangan tim, mengancam milestone 16 November 2026, atau memerlukan perubahan baseline, anggaran, maupun pengurangan fitur wajib. Keputusan pengurangan lingkup hanya sah bila disetujui sponsor dan dicatat. |
| Dokumen, penyimpanan, dan pengendalian versi | Risk Register, Risk Response Plan, dokumen metodologi, serta bukti tindakan disimpan di repositori proyek sehingga setiap perubahan terekam beserta tanggal dan pelakunya. Setiap revisi dokumen diberi tanggal dan penanggung jawab. Data hasil olahan tidak ditimpa tanpa keterangan; perubahan dicatat pada dokumen perubahan proyek. |
| Cara monitoring efektivitas respons | Respons dinilai efektif bila tindakan dijalankan sesuai jadwal, trigger benar-benar dipantau, dan skor residual dapat dibuktikan turun berdasarkan bukti, bukan asumsi. Setiap risiko memiliki bentuk bukti yang ditetapkan di Tahap 4. Bukti yang dapat diperiksa ulang secara terprogram didahulukan daripada pengamatan visual. Secondary risk dan issue yang muncul dicatat sebagai baris baru, bukan diselipkan ke risiko lama. |

---

## Pemeriksaan mandiri

- [x] Seluruh 14 Risk ID memiliki strategi respons yang beralasan. Jumlah melebihi minimal 12 karena seluruh ID dari praktikum sebelumnya dipertahankan.
- [x] Tindakan, trigger, contingency, PIC, jadwal, dan bukti sudah cukup spesifik. Trigger dinyatakan dengan ambang atau waktu yang dapat diamati, bukan rumusan umum.
- [x] Estimasi residual tidak dicampur dengan hasil monitoring aktual. Angka residual ditandai sebagai estimasi perencanaan; kondisi yang sudah terjadi dicatat terpisah pada kolom Catatan perubahan di Tahap 1.
- [x] Risk Management Plan mengatur keseluruhan proyek, bukan mengulang Risk Register. Tabel Tahap 6 berisi aturan lintas risiko tanpa menyebut tindakan untuk satu Risk ID tertentu.

---

## Refleksi kelompok

**Risiko mana yang paling sulit diputuskan responsnya, dan mengapa?**

R01 dan R11. Keduanya sulit karena pada saat kertas kerja ini disusun keduanya sudah berubah dari risiko menjadi kenyataan, sehingga pilihan strategi tidak lagi berupa pencegahan.

Pada R01 pilihannya antara Mitigate dan Escalate. Mitigate dipilih karena masih ada yang dapat dikendalikan tim, yaitu memastikan fitur wajib berfungsi lebih dulu. Namun keputusan apakah tanggal 16 November boleh dilewati atau lingkup yang dipotong bukan kewenangan tim, sehingga bagian itu tetap harus diajukan ke sponsor.

R11 sulit karena penyebab yang semula diperkirakan, yaitu kerumitan teknis deployment WebGIS dengan ekstensi spasial, ternyata bukan penghambat sebenarnya. Keputusan arsitektur yang menghilangkan kebutuhan basis data saat aplikasi berjalan membuat sisi teknisnya justru sederhana. Penghambat yang muncul adalah hal administratif yang tidak pernah masuk register: repositori berada di akun pihak lain sehingga layanan hosting belum memperoleh akses. Ini menunjukkan penilaian penyebab pada praktikum sebelumnya belum lengkap.

**Apakah respons menimbulkan secondary risk?**

Ya, dan beberapa di antaranya penting. Tiga yang paling perlu dipantau:

Pertama, simplifikasi geometri untuk menekan ukuran berkas pada R08 menggeser batas poligon sekitar 3,3 meter. Pergeseran itu kecil, tetapi untuk titik fasilitas yang berada tepat di tepi batas kelurahan, hasil uji titik-dalam-poligon dapat berubah. Tersisa 11 titik dalam kondisi seperti itu.

Kedua, respons R13 dan R14 berupa pembatalan modul admin memang menghapus eksposur keamanan, tetapi halaman admin yang terlanjur dibangun masih ada di repositori sebagai tampilan tanpa fungsi. Siapa pun yang membukanya dapat menyangka fitur itu berfungsi.

Ketiga, jalur cadangan R11 berupa fork repositori ke akun sendiri akan membuat situs yang terbit mengikuti salinan, bukan repositori kelompok. Pembaruan dari anggota lain tidak akan otomatis ikut terbit.

**Pelajaran dari selisih antara penilaian awal dan kenyataan**

R12 dinilai Low dengan P=2 karena layanan tile publik untuk penggunaan akademik berskala kecil dianggap jarang dibatasi. Kenyataannya penyedia menutup layanan gratisnya secara menyeluruh, bukan membatasi kuota pemakai tertentu. Penilaian awal mengukur kemungkinan tim terkena pembatasan, bukan kemungkinan penyedia mengubah model layanannya. Untuk risiko ketergantungan pihak ketiga, kedua hal itu perlu dinilai terpisah.

Sebaliknya R03 yang dinilai Medium ternyata berdampak jauh lebih besar dari perkiraan. Yang ditemukan bukan sekadar ketidakseragaman penamaan, melainkan 32 titik yang koordinatnya diturunkan dari kelurahan dan karenanya tidak pernah mewakili lokasi sebenarnya. Perbaikannya menghabiskan waktu beberapa hari dan mengubah peringkat 47 dari 68 kelurahan.

**Bagaimana AI digunakan**

AI digunakan untuk tiga hal: memeriksa kelengkapan dan konsistensi antartabel kertas kerja, membantu merapikan rumusan kalimat tindakan dan trigger agar dapat diamati, serta membantu menelusuri bukti pelaksanaan dari berkas proyek dan riwayat perubahan repositori.

Pemilihan strategi, penilaian P dan I residual, penetapan Risk Owner dan Action Owner, serta keputusan lingkup seperti pembatalan modul admin merupakan keputusan kelompok. Seluruh angka dan bukti yang dikutip berasal dari berkas proyek yang dapat diperiksa, bukan simulasi.
