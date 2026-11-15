# Titik fallback — sudah diperbaiki

Diperbarui 15 November 2026. Semua koordinat di sini sudah final dan siap diterapkan ke
`faskes/sekolah.geojson` — tidak ada lagi baris yang menunggu keputusan.

Dari 32 titik semula: **31 dipakai**, 1 dihapus.

| Status | Jumlah | Arti |
|---|---|---|
| dipakai | 27 | Koordinat diganti dengan hasil Google Maps. Label kelurahan dan kecamatan tetap. |
| dipakai + label diubah | 3 | Koordinat diganti, dan label wilayahnya ikut dikoreksi. |
| dipertahankan | 1 | Koordinat lama sengaja dipakai terus — lihat catatan di bawah tabel. |

## Label yang ikut berubah

Baris berikut koordinatnya pindah ke tempat yang benar, dan karena itu **label wilayahnya
tidak lagi cocok**. Yang dicetak tebal harus diubah di geojson, bukan hanya koordinatnya.
Perhatikan kolom kecamatan: 3 baris berpindah kecamatan, dan itu memengaruhi agregasi
per kecamatan kalau skor kelayakhunianmu memakainya.

| Nama | Kelurahan: dari → jadi | Kecamatan: dari → jadi | Dasar |
|---|---|---|---|
| KLINIK DR LINDASARI | Batutulis → **Sukasari** | Bogor Selatan → **Bogor Timur** | alamat Google: …Sukasari, Kec. Bogor Tim. |
| Klinik Mata dr Hasri Ainun Habibie | Kedung Badak → **Kebon Kelapa** | Tanah Sareal → **Bogor Tengah** | alamat Google: …Kebon Kelapa, Bogor Tengah |
| SD IT AL MANSYUR | Menteng → **Sindangsari** | Bogor Barat → **Bogor Timur** | koordinat dari pencarianmu sendiri atas Yayasan Zelani Al-Mansyur |

## Semua titik final

| Nama | Jenis | Koordinat lama | **Koordinat final** | Geser | Kelurahan final | Kecamatan final | Nama hasil Google | Status | Peta |
|---|---|---|---|---|---|---|---|---|---|
| Cera Dental Care | klinik | -6.575495, 106.807323 | **-6.5813043, 106.8087025** | 664 m | Bantarjati | Bogor Utara | Cera Dental Care | dipakai | [pin](https://www.google.com/maps?q=-6.5813043,106.8087025) |
| Fbc Estetika & Laser Center | klinik | -6.579918, 106.815316 | **-6.5814102, 106.8136537** | 247 m | Tegal Gundil | Bogor Utara | FBC Estetika & Laser Center Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5814102,106.8136537) |
| KLINIK BIDAN JUANG | klinik | -6.669271, 106.838667 | **-6.6690352, 106.8394721** | 93 m | Bojongkerta | Bogor Selatan | Praktek Mandiri Bidan R Juang Putri S, S.Tr.Keb., Bdn | dipakai | [pin](https://www.google.com/maps?q=-6.6690352,106.8394721) |
| KLINIK NURHAYATI | klinik | -6.621947, 106.807871 | **-6.6270462, 106.8100037** | 614 m | Batutulis | Bogor Selatan | Klinik Nurhayati | dipakai | [pin](https://www.google.com/maps?q=-6.6270462,106.8100037) |
| KLINIK TJANG DEN TAL | klinik | -6.621947, 106.807871 | **-6.6192908, 106.8133147** | 670 m | Batutulis | Bogor Selatan | Tjang Dental Care \| Dokter Gigi Umum & Spesialis | dipakai | [pin](https://www.google.com/maps?q=-6.6192908,106.8133147) |
| KLINIK UTAMA MATA PURNAMA | klinik | -6.546441, 106.776886 | **-6.5543105, 106.7821157** | 1049 m | Cibadak | Tanah Sareal | Klinik Utama Mata Purnama | dipakai | [pin](https://www.google.com/maps?q=-6.5543105,106.7821157) |
| Klinik Medika | klinik | -6.575495, 106.807323 | **-6.5809525, 106.8082744** | 616 m | Bantarjati | Bogor Utara | Dokter 24 Jam Klinik Medika Bangbarung | dipakai | [pin](https://www.google.com/maps?q=-6.5809525,106.8082744) |
| Klinik Medikids By MHDC Bogor | klinik | -6.546441, 106.776886 | **-6.5566728, 106.7824395** | 1293 m | Cibadak | Tanah Sareal | Klinik Gigi & Vaksin Medikids Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5566728,106.7824395) |
| Klinik Utama Beyoutiful by dr Tompi Bogor | klinik | -6.579918, 106.815316 | **-6.5816629, 106.8139095** | 249 m | Tegal Gundil | Bogor Utara | Beyoutiful By Dr Tompi Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5816629,106.8139095) |
| Klinik Utama Bidakara Medical center | klinik | -6.575495, 106.807323 | **-6.5812848, 106.8094750** | 686 m | Bantarjati | Bogor Utara | Klinik Utama Bidakara Medical Center Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5812848,106.809475) |
| Klinik Utama Cikal Mulia Bogor | klinik | -6.579918, 106.815316 | **-6.5746560, 106.8174937** | 633 m | Tegal Gundil | Bogor Utara | KLINIK CIKAL MULIA CABANG BOGOR (Klinik Bersalin 24 Jam) | dipakai | [pin](https://www.google.com/maps?q=-6.574656,106.8174937) |
| Klinik Utama Cura Medika Indonesia | klinik | -6.609971, 106.814221 | **-6.6057572, 106.8085190** | 785 m | Baranangsiang | Bogor Timur | CURA MEDIKA (KLINIK FISIOTERAPI, REHAB MEDIK, SPORT MEDICINE) | dipakai | [pin](https://www.google.com/maps?q=-6.6057572,106.808519) |
| Klinik Utama M3 | klinik | -6.597935, 106.810895 | **-6.6027546, 106.8072727** | 669 m | Tegallega | Bogor Tengah | Klinik Utama M3 | dipakai | [pin](https://www.google.com/maps?q=-6.6027546,106.8072727) |
| Klinik Utama No Rawat Inap Prodia | klinik | -6.586223, 106.798406 | **-6.5841989, 106.7971169** | 266 m | Sempur | Bogor Tengah | Prodia Bogor - Sudirman | dipakai | [pin](https://www.google.com/maps?q=-6.5841989,106.7971169) |
| Klinik Utama Satu Dental By Drg Indah Ekasari Sp Ort | klinik | -6.609971, 106.814221 | **-6.6163880, 106.8143140** | 714 m | Baranangsiang | Bogor Timur | Satu Dental Bogor Pajajaran | dipakai | [pin](https://www.google.com/maps?q=-6.616388,106.814314) |
| Klinik Utama ZAP Bogor | klinik | -6.579918, 106.815316 | **-6.5813101, 106.8122395** | 373 m | Tegal Gundil | Bogor Utara | ZAP Clinic- Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5813101,106.8122395) |
| New LNA Skin Health Clinic | klinik | -6.575495, 106.807323 | **-6.5814978, 106.8087450** | 686 m | Bantarjati | Bogor Utara | New LNA Skin Health Clinic | dipakai | [pin](https://www.google.com/maps?q=-6.5814978,106.808745) |
| Pelita Sehat Pomad | klinik | -6.558349, 106.818281 | **-6.5478175, 106.8235653** | 1308 m | Cibuluh | Bogor Utara | KLINIK PELITA SEHAT POMAD | dipakai | [pin](https://www.google.com/maps?q=-6.5478175,106.8235653) |
| Prodia Health Care Bogor | klinik | -6.609971, 106.814221 | **-6.6154627, 106.8145702** | 612 m | Baranangsiang | Bogor Timur | Prodia Bogor - Pajajaran | dipakai | [pin](https://www.google.com/maps?q=-6.6154627,106.8145702) |
| RS Ibu dan Anak Sawojajar | rs | -6.588899, 106.794514 | **-6.5884670, 106.7935180** | 120 m | Pabaton | Bogor Tengah | RSKIA Sawojajar | dipakai | [pin](https://www.google.com/maps?q=-6.588467,106.793518) |
| SDIT BINA INSAN MANDIRI | sd | -6.570007, 106.766988 | **-6.5663492, 106.7687444** | 451 m | Cilendek Barat | Bogor Barat | SDIT Bina Insan Mandiri - Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5663492,106.7687444) |
| SMA BINA INSAN MANDIRI | sma_smk | -6.570007, 106.766988 | **-6.5662186, 106.7687547** | 464 m | Cilendek Barat | Bogor Barat | Ponpes Al Ihsan Baron Bogor & SMP - SMA Bina Insan Mandiri Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5662186,106.7687547) |
| SMK KESATUAN | sma_smk | -6.609971, 106.814221 | **-6.6137915, 106.8118035** | 502 m | Baranangsiang | Bogor Timur | SEKOLAH KESATUAN BOGOR | dipakai | [pin](https://www.google.com/maps?q=-6.6137915,106.8118035) |
| SMP Al-Azhar Syifa Budi Kota Bogor - BNR | smp | -6.640143, 106.790018 | **-6.6387273, 106.7918163** | 253 m | Mulyaharja | Bogor Selatan | Sekolah Al-Azhar Syifa Budi Kota Bogor-BNR | dipakai | [pin](https://www.google.com/maps?q=-6.6387273,106.7918163) |
| SMP HIGHFIELD | smp | -6.621947, 106.807871 | **-6.6229901, 106.8113174** | 398 m | Batutulis | Bogor Selatan | Kinderfield-Highfield School Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.6229901,106.8113174) |
| Sekolah Dasar Nizhamia Indonesia | sd | -6.559288, 106.769909 | **-6.5586935, 106.7704612** | 90 m | Curug Mekar | Bogor Barat | Nizhamia Indigenous Indonesian School | dipakai | [pin](https://www.google.com/maps?q=-6.5586935,106.7704612) |
| UPTD Puskesmas Sindangbarang | puskesmas | -6.574978, 106.758370 | **-6.5782608, 106.7622127** | 560 m | Sindang Barang | Bogor Barat | Puskesmas Sindangbarang | dipakai | [pin](https://www.google.com/maps?q=-6.5782608,106.7622127) |
| KLINIK DR LINDASARI | klinik | -6.621947, 106.807871 | **-6.6204457, 106.8153048** | 838 m | **Sukasari** | **Bogor Timur** | dr. Dewi Lindasari | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.6204457,106.8153048) |
| Klinik Mata dr Hasri Ainun Habibie | klinik | -6.563051, 106.798318 | **-6.5805304, 106.7787998** | 2903 m | **Kebon Kelapa** | **Bogor Tengah** | Klinik Mata dr. Hasri Ainun Habibie | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.5805304,106.7787998) |
| SD IT AL MANSYUR | sd | -6.581794, 106.781395 | **-6.6511821, 106.8454713** | 10470 m | **Sindangsari** | **Bogor Timur** | YAYASAN ZELANI AL-MANSYUR | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.651182107835164,106.84547132430559) |
| SEKOLAH MENENGAH ATAS NEGERI 11 BOGOR | sma_smk | -6.527083, 106.770782 | **-6.5270830, 106.7707820** | — | Kayu Manis | Tanah Sareal | — | dipertahankan | [pin](https://www.google.com/maps?q=-6.527083,106.770782) |

### Catatan titik yang dipertahankan

- **SEKOLAH MENENGAH ATAS NEGERI 11 BOGOR** — Sekolahnya masih dibangun dan belum ada di Google Maps, jadi titik mewakili Kayu Manis tetap nilai terbaik yang tersedia. Label kelurahan terkonfirmasi benar lewat pemberitaan Januari 2026.

## Dihapus dari dataset

1 baris dikeluarkan atas keputusanmu. Dicatat di sini supaya jejaknya ada kalau nanti mau ditinjau ulang.

| Nama | Jenis | Kelurahan tertulis | Koordinat lama | Alasan |
|---|---|---|---|---|
| Klinik Dokter Gigi | klinik | Ranggamekar | -6.624496, 106.802435 | Nama terlalu umum dan tidak ada tempat bernama ini di Ranggamekar. Google hanya menawarkan klinik gigi lain (OMDC, FDC, Teman Dental, Rumah Gigi Sehat). |

## Setelah ini

Kolom "Kelurahan final" di sini dibaca dari alamat Google, bukan dari uji titik-dalam-poligon.
Setelah koordinat dan label diterapkan, jalankan ulang `node gis/buat-laporan-titik.js` supaya
`kualitas` tiap titik ikut diperbarui dan uji poligon mengonfirmasi hasilnya terhadap
`public/data/kelurahan.geojson`.

Presisi koordinat Google tidak seragam: beberapa entri alamatnya tanpa nama jalan
(Cera Dental Care hanya menyebut RT/RW), jadi titiknya bisa meleset puluhan meter.
Itu masih jauh lebih baik daripada titik mewakili kelurahan yang gesernya ratusan meter,
tapi bukan hasil survei lapangan.
