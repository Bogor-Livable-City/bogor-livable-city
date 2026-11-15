-- Titik fasilitas kesehatan (gabungan Puskesmas, Klinik, Rumah Sakit).
--
-- Kolom `kualitas` ikut dibawa karena 26 dari 120 titik koordinatnya bukan hasil
-- survei: "fallback" artinya koordinatnya diturunkan dari kelurahan, "meragukan"
-- artinya hasil geocode yang jauh dari alamatnya. Untuk titik seperti itu kolom
-- `kelurahan` lebih bisa dipercaya daripada koordinatnya.
SELECT nama, 'puskesmas' AS jenis, kel AS kelurahan, kec AS kecamatan, kualitas, geom FROM titik_puskesmas
UNION ALL
SELECT nama, 'klinik', kel, kec, kualitas, geom FROM titik_klinik
UNION ALL
SELECT nama, 'rs', kel, kec, kualitas, geom FROM titik_rs

