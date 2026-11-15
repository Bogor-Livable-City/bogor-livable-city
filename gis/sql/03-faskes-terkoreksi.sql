-- Label kelurahan tiap titik faskes diambil ulang dari lokasinya, bukan dari kolom teks lama.
-- Dipakai oleh gis/fix-label-titik.ps1.
--
-- Dua syarat, dan yang pertama paling menentukan:
--
-- 1. kualitas = 'baik'. Kolom ini datang dari gpkg dan mencatat bagaimana koordinat
--    tiap titik diperoleh. Untuk 'fallback' koordinatnya justru diturunkan DARI
--    kelurahan, jadi memakainya untuk mengoreksi kelurahan itu berputar-putar.
--    Untuk 'meragukan' koordinatnya hasil geocode yang jauh dari alamat aslinya.
--    Pada kedua kelompok itu labelnya yang lebih bisa dipercaya, bukan koordinatnya.
--
-- 2. Jarak 10 meter dari garis batas. Poligon kelurahan di public/data sudah
--    disederhanakan sekitar 3,3 meter oleh build-data.ps1, jadi titik yang menempel
--    batas belum tentu benar-benar ada di dalamnya.

SELECT f.nama,
       f.jenis,
       COALESCE(k.kelurahan, f.kelurahan) AS kelurahan,
       COALESCE(k.kecamatan, f.kecamatan) AS kecamatan,
       f.kualitas,
       f.geom
  FROM faskes f
  LEFT JOIN kelurahan k
         ON f.kualitas = 'baik'
        AND ST_Intersects(f.geom, k.geom)
        AND ST_Distance(f.geom::geography, ST_Boundary(k.geom)::geography) >= 10
