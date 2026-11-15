# Titik meragukan — sudah diperbaiki

Diperbarui 15 November 2026. Semua koordinat di sini sudah final dan siap diterapkan ke
`faskes/sekolah.geojson` — tidak ada lagi baris yang menunggu keputusan.

Dari 37 titik semula: **34 dipakai**, 3 dihapus.

| Status | Jumlah | Arti |
|---|---|---|
| dipakai | 27 | Koordinat diganti dengan hasil Google Maps. Label kelurahan dan kecamatan tetap. |
| dipakai + label diubah | 7 | Koordinat diganti, dan label wilayahnya ikut dikoreksi. |

## Label yang ikut berubah

Baris berikut koordinatnya pindah ke tempat yang benar, dan karena itu **label wilayahnya
tidak lagi cocok**. Yang dicetak tebal harus diubah di geojson, bukan hanya koordinatnya.
Perhatikan kolom kecamatan: 4 baris berpindah kecamatan, dan itu memengaruhi agregasi
per kecamatan kalau skor kelayakhunianmu memakainya.

| Nama | Kelurahan: dari → jadi | Kecamatan: dari → jadi | Dasar |
|---|---|---|---|
| Klinik Gigiku Sehat | Bantarjati → **Tegal Gundil** | Bogor Utara (tetap) | alamat Google: …Tegal Gundil, Kec. Bogor Utara |
| SD CAUSA PRIMA | Cilendek Barat → **Cilendek Timur** | Bogor Barat (tetap) | alamat Google: …Cilendek Tim., Kec. Bogor Bar. |
| SMK PUTRA HARAPAN BOGOR | Pamoyanan → **Sindang Barang** | Bogor Selatan → **Bogor Barat** | alamat Google: …Sindangbarang, Kec. Bogor Bar. |
| SMKS BUDI DARMA | Kedung Waringin → **Tanah Baru** | Tanah Sareal → **Bogor Utara** | alamat Google: …Tanah Baru, Kec. Bogor Utara |
| SMKS PGRI 4 KOTA BOGOR | Baranangsiang → **Cimahpar** | Bogor Timur → **Bogor Utara** | alamat Google: …Cimahpar, Kec. Bogor Utara |
| SMKS YZA 3 BOGOR | Kebon Kalapa → **Menteng** | Bogor Tengah → **Bogor Barat** | alamat Google: …Menteng, Kec. Bogor Bar. |
| SMP YASIH | Baranangsiang → **Katulampa** | Bogor Timur (tetap) | alamat Google: …Katulampa, Kec. Bogor Tim. |

## Semua titik final

| Nama | Jenis | Koordinat lama | **Koordinat final** | Geser | Kelurahan final | Kecamatan final | Nama hasil Google | Status | Peta |
|---|---|---|---|---|---|---|---|---|---|
| Pelita Sehat | klinik | -6.581878, 106.815564 | **-6.5630929, 106.8226383** | 2230 m | Tanah Baru | Bogor Utara | Pelita Sehat Clinic | dipakai | [pin](https://www.google.com/maps?q=-6.5630929,106.8226383) |
| SD AMAL KASIH | sd | -6.597525, 106.830483 | **-6.5974636, 106.8305761** | 12 m | Katulampa | Bogor Timur | Amal Kasih Elementary School | dipakai | [pin](https://www.google.com/maps?q=-6.5974636,106.8305761) |
| SD IT ZAID BIN TSABIT | sd | -6.528200, 106.770200 | **-6.5452407, 106.7677312** | 1914 m | Curug | Bogor Barat | SDIT ZAID BIN TSABIT | dipakai | [pin](https://www.google.com/maps?q=-6.5452407,106.7677312) |
| SD KREATIVA | sd | -6.566000, 106.782800 | **-6.5545917, 106.7953005** | 1875 m | Sukaresmi | Tanah Sareal | SD Kreativa | dipakai | [pin](https://www.google.com/maps?q=-6.5545917,106.7953005) |
| SD Kinderfield Bogor | sd | -6.671294, 106.843034 | **-6.6229901, 106.8113174** | 6413 m | Batutulis | Bogor Selatan | Kinderfield-Highfield School Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.6229901,106.8113174) |
| SD N KEDUNG BADAK 2 | sd | -6.550000, 106.806900 | **-6.5644129, 106.8066555** | 1603 m | Kedung Badak | Tanah Sareal | SDN KEDUNG BADAK 2 | dipakai | [pin](https://www.google.com/maps?q=-6.5644129,106.8066555) |
| SD NEGERI CIMAHPAR 4 | sd | -6.566100, 106.824700 | **-6.5661387, 106.8246844** | 5 m | Cimahpar | Bogor Utara | SDN CIMAHPAR 4 | dipakai | [pin](https://www.google.com/maps?q=-6.5661387,106.8246844) |
| SD NEGERI KAMPUNG SAWAH | sd | -6.599300, 106.820000 | **-6.5992923, 106.8200840** | 9 m | Tanah Baru | Bogor Utara | Sdn Kp. Sawah | dipakai | [pin](https://www.google.com/maps?q=-6.5992923,106.820084) |
| SD SENTANA MONTESORI SCHOOL | sd | -6.555500, 106.799900 | **-6.5710488, 106.8023979** | 1751 m | Tanah Sareal | Tanah Sareal | Sentana Montessori School | dipakai | [pin](https://www.google.com/maps?q=-6.5710488,106.8023979) |
| SDIT SHOLAHUDDIN | sd | -6.617216, 106.794044 | **-6.6020168, 106.7801159** | 2285 m | Pasir Kuda | Bogor Barat | SDIT Sholahuddin | dipakai | [pin](https://www.google.com/maps?q=-6.6020168,106.7801159) |
| SDS BINA TUNAS CEMERLANG | sd | -6.560500, 106.782900 | **-6.5812961, 106.7945696** | 2647 m | Kebon Pedes | Tanah Sareal | School Bina Tunas Cemerlang | dipakai | [pin](https://www.google.com/maps?q=-6.5812961,106.7945696) |
| SMAS MUHAMMADIYAH | sma_smk | -6.588100, 106.788300 | **-6.6109301, 106.7976126** | 2739 m | Empang | Bogor Selatan | SMP Muhammadiyah Kota Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.6109301,106.7976126) |
| SMK ALQI PROFESI BOGOR | sma_smk | -6.591100, 106.810800 | **-6.5504064, 106.8185376** | 4605 m | Ciparigi | Bogor Utara | SMK ALQI Profesi Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5504064,106.8185376) |
| SMK MODERN AL - ALAWIYAH BOGOR | sma_smk | -6.526854, 106.777742 | **-6.5284481, 106.7867274** | 1008 m | Kencana | Tanah Sareal | Ponpes Modern Al - Alawiyah | dipakai | [pin](https://www.google.com/maps?q=-6.5284481,106.7867274) |
| SMK NUSANTARA KOTA BOGOR | sma_smk | -6.583780, 106.816691 | **-6.5538558, 106.8267749** | 3509 m | Ciluar | Bogor Utara | SMK Nusantara Kota Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5538558,106.8267749) |
| SMK PLUS DAWATUL QURAN BOGOR | sma_smk | -6.564140, 106.763799 | **-6.5908039, 106.7794529** | 3432 m | Gunung Batu | Bogor Barat | SMP - SMK PLUS DA'WATUL QUR'AN | dipakai | [pin](https://www.google.com/maps?q=-6.5908039,106.7794529) |
| SMK TAMANSISWA BOGOR | sma_smk | -6.591685, 106.809113 | **-6.5830732, 106.7881347** | 2507 m | Ciwaringin | Bogor Tengah | PERGURUAN TAMANSISWA CABANG BOGOR | dipakai | [pin](https://www.google.com/maps?q=-6.5830732,106.7881347) |
| SMKS INFOKOM BOGOR | sma_smk | -6.597300, 106.779300 | **-6.5806046, 106.7672270** | 2286 m | Sindang Barang | Bogor Barat | SMK Infokom Kota Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5806046,106.767227) |
| SMKS TUNAS BANGSA SEJAHTERA | sma_smk | -6.551600, 106.741900 | **-6.5632570, 106.7495937** | 1550 m | Bubulak | Bogor Barat | School SMK Tunas Bangsa Sejahtera | dipakai | [pin](https://www.google.com/maps?q=-6.563257,106.7495937) |
| SMP AMAL KASIH | smp | -6.597525, 106.830608 | **-6.5974636, 106.8305761** | 8 m | Katulampa | Bogor Timur | Amal Kasih Elementary School | dipakai | [pin](https://www.google.com/maps?q=-6.5974636,106.8305761) |
| SMP ISLAM DA WATUL QURAN | smp | -6.579200, 106.779600 | **-6.5908039, 106.7794529** | 1290 m | Gunung Batu | Bogor Barat | SMP - SMK PLUS DA'WATUL QUR'AN | dipakai | [pin](https://www.google.com/maps?q=-6.5908039,106.7794529) |
| SMP KREATIVA | smp | -6.528804, 106.790029 | **-6.5243639, 106.7668203** | 2611 m | Kayu Manis | Tanah Sareal | SMP Kreativa Bogor | dipakai | [pin](https://www.google.com/maps?q=-6.5243639,106.7668203) |
| SMP MODERN AL- ALAWIYAH | smp | -6.564579, 106.789560 | **-6.5284048, 106.7865572** | 4036 m | Kencana | Tanah Sareal | SMP Modern Al Alawiyah | dipakai | [pin](https://www.google.com/maps?q=-6.5284048,106.7865572) |
| SMP MUTIARA KARTINI | smp | -6.586500, 106.809700 | **-6.5758692, 106.7905445** | 2424 m | Ciwaringin | Bogor Tengah | SMP Mutiara Kartini | dipakai | [pin](https://www.google.com/maps?q=-6.5758692,106.7905445) |
| SMP PANDUTAMA | smp | -6.578900, 106.818400 | **-6.5708311, 106.8086430** | 1402 m | Bantarjati | Bogor Utara | Smp Pandutama | dipakai | [pin](https://www.google.com/maps?q=-6.5708311,106.808643) |
| SMP TARUNA BANGSA | smp | -6.598400, 106.775000 | **-6.6030295, 106.7853000** | 1249 m | Pasir Kuda | Bogor Barat | Smp Taruna Bangsa | dipakai | [pin](https://www.google.com/maps?q=-6.6030295,106.7853) |
| SMP WINDIAN NUGRAHA | smp | -6.550200, 106.772000 | **-6.5700931, 106.7686781** | 2242 m | Cilendek Barat | Bogor Barat | SMK Windian Nugraha | dipakai | [pin](https://www.google.com/maps?q=-6.5700931,106.7686781) |
| Klinik Gigiku Sehat | klinik | -6.577594, 106.818309 | **-6.5774077, 106.8182280** | 23 m | **Tegal Gundil** | Bogor Utara | Klinik Gigiku Sehat Bogor | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.5774077,106.818228) |
| SD CAUSA PRIMA | sd | -6.571100, 106.777500 | **-6.5710490, 106.7774599** | 7 m | **Cilendek Timur** | Bogor Barat | TK & SD Sekolah Causa Prima Bogor | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.571049,106.7774599) |
| SMK PUTRA HARAPAN BOGOR | sma_smk | -6.649745, 106.797441 | **-6.5736177, 106.7572510** | 9558 m | **Sindang Barang** | **Bogor Barat** | SMK Putra harapan, Bogor | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.5736177,106.757251) |
| SMKS BUDI DARMA | sma_smk | -6.589300, 106.818500 | **-6.5892726, 106.8184679** | 5 m | **Tanah Baru** | **Bogor Utara** | SMK BUDI DARMA | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.5892726,106.8184679) |
| SMKS PGRI 4 KOTA BOGOR | sma_smk | -6.587900, 106.832700 | **-6.5878867, 106.8326197** | 9 m | **Cimahpar** | **Bogor Utara** | SMK PGRI 4 BOGOR | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.5878867,106.8326197) |
| SMKS YZA 3 BOGOR | sma_smk | -6.651700, 106.845500 | **-6.5875906, 106.7837793** | 9864 m | **Menteng** | **Bogor Barat** | Sekolah Menengah Kejuruan YZA 3 Bogor | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.5875906,106.7837793) |
| SMP YASIH | smp | -6.613315, 106.829777 | **-6.6131591, 106.8298061** | 18 m | **Katulampa** | Bogor Timur | SMA Yasih | dipakai + label diubah | [pin](https://www.google.com/maps?q=-6.6131591,106.8298061) |

## Dihapus dari dataset

3 baris dikeluarkan atas keputusanmu. Dicatat di sini supaya jejaknya ada kalau nanti mau ditinjau ulang.

| Nama | Jenis | Kelurahan tertulis | Koordinat lama | Alasan |
|---|---|---|---|---|
| SMKS TARUNA BANGSA 1 BOGOR | sma_smk | Pasir Kuda | -6.598000, 106.773200 | Alamat Google di Jl. Mekar Jaya, Mekarjaya, Kec. Ciomas, Kabupaten Bogor — di luar Kota Bogor. |
| SMKS TARUNA BANGSA 2 BOGOR | sma_smk | Pasir Kuda | -6.598400, 106.775000 | Alamat Google di Jl. Mekar Jaya, Mekarjaya, Kec. Ciomas, Kabupaten Bogor — di luar Kota Bogor (satu entri dengan Taruna Bangsa 1). |
| SMP PGRI 14 | smp | Margajaya | -6.559800, 106.746100 | Alamat Google di Jl. Pasar Dramaga, Kec. Dramaga, Kabupaten Bogor — di luar Kota Bogor. |

## Setelah ini

Kolom "Kelurahan final" di sini dibaca dari alamat Google, bukan dari uji titik-dalam-poligon.
Setelah koordinat dan label diterapkan, jalankan ulang `node gis/buat-laporan-titik.js` supaya
`kualitas` tiap titik ikut diperbarui dan uji poligon mengonfirmasi hasilnya terhadap
`public/data/kelurahan.geojson`.

Presisi koordinat Google tidak seragam: beberapa entri alamatnya tanpa nama jalan
(Cera Dental Care hanya menyebut RT/RW), jadi titiknya bisa meleset puluhan meter.
Itu masih jauh lebih baik daripada titik mewakili kelurahan yang gesernya ratusan meter,
tapi bukan hasil survei lapangan.
