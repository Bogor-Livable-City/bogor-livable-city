-- Sama seperti 03-faskes-terkoreksi.sql, untuk layer sekolah.
-- Penjelasan kedua syaratnya ada di file itu.

SELECT s.nama,
       s.jenis,
       s.npsn,
       COALESCE(k.kelurahan, s.kelurahan) AS kelurahan,
       COALESCE(k.kecamatan, s.kecamatan) AS kecamatan,
       s.kualitas,
       s.geom
  FROM sekolah s
  LEFT JOIN kelurahan k
         ON s.kualitas = 'baik'
        AND ST_Intersects(s.geom, k.geom)
        AND ST_Distance(s.geom::geography, ST_Boundary(k.geom)::geography) >= 10
