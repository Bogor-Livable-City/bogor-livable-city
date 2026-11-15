-- Titik yang label kelurahannya bertentangan dengan koordinatnya, tapi tidak dikoreksi
-- otomatis. Daftar ini dikirim ke GIS Developer untuk dicek ke sumber aslinya.
--
-- Kolom `kualitas` menjelaskan kenapa tidak dikoreksi:
--   meragukan  koordinatnya hasil geocode yang jauh dari alamat aslinya
--   fallback   koordinatnya diturunkan dari kelurahan, jadi tidak bisa jadi bukti
--   baik       koordinatnya terpercaya, tapi titiknya menempel garis batas

WITH titik AS (
  SELECT 'faskes' AS layer, f.nama, f.kelurahan AS label_lama, f.kualitas, f.geom FROM faskes f
  UNION ALL
  SELECT 'sekolah', s.nama, s.kelurahan, s.kualitas, s.geom FROM sekolah s
),
dinilai AS (
  SELECT t.layer,
         t.nama,
         t.label_lama,
         t.kualitas,
         (SELECT k.kelurahan FROM kelurahan k ORDER BY t.geom <-> k.geom LIMIT 1) AS label_terdekat,
         (SELECT k.kelurahan FROM kelurahan k WHERE ST_Intersects(t.geom, k.geom) LIMIT 1) AS label_memuat,
         (SELECT round(ST_Distance(t.geom::geography, ST_Boundary(k.geom)::geography)::numeric, 1)
            FROM kelurahan k ORDER BY t.geom <-> k.geom LIMIT 1) AS jarak_batas_m
    FROM titik t
)
SELECT layer,
       nama,
       label_lama,
       label_terdekat AS label_menurut_koordinat,
       kualitas,
       jarak_batas_m,
       CASE WHEN kualitas <> 'baik' THEN 'koordinatnya tidak bisa dipercaya, label dipertahankan'
            WHEN label_memuat IS NULL THEN 'koordinat baik tapi jatuh di luar semua batas'
            ELSE 'koordinat baik tapi menempel garis batas' END AS catatan
  FROM dinilai
 WHERE lower(btrim(label_lama)) <> lower(btrim(label_terdekat))
   AND (kualitas <> 'baik' OR label_memuat IS NULL OR jarak_batas_m < 10)
 ORDER BY kualitas, layer, jarak_batas_m;
