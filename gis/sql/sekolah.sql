-- Titik sekolah (gabungan SD, SMP, SMA/SMK).
--
-- Kolom `kualitas` ikut dibawa. Dari 556 titik, 513 berkualitas "baik" dan rata-rata
-- cuma 3 meter dari kelurahan yang tertulis. Sisanya 35 "meragukan" (rata-rata 653 m
-- dari kelurahannya) dan 8 "fallback" (koordinatnya diturunkan dari kelurahan).
-- Untuk dua kelompok terakhir, kolom `kelurahan` lebih bisa dipercaya daripada koordinat.
SELECT nama, 'sd' AS jenis, npsn, kel AS kelurahan, kec AS kecamatan, kualitas, geom FROM titik_sd
UNION ALL
SELECT nama, 'smp', npsn, kel, kec, kualitas, geom FROM titik_smp
UNION ALL
SELECT nama, 'sma_smk', npsn, kel, kec, kualitas, geom FROM titik_sma_smk

