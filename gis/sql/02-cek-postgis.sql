-- Pemeriksaan isi database setelah impor (WBS 1.4.1).
--   psql -U ruang_bogor -d ruang_bogor -f gis/sql/02-cek-postgis.sql
--
-- Semua baris harus berstatus OK. Luas total 111,38 km2 adalah luas Kota Bogor
-- yang dipakai sebagai patokan sejak pipeline GeoJSON, jadi kalau angka itu
-- meleset berarti ada geometri yang hilang atau terpotong waktu impor.

WITH cek(urutan, pemeriksaan, lulus, nilai) AS (
  SELECT 1, 'kelurahan 68 baris',        count(*) = 68,   count(*)::text FROM kelurahan
  UNION ALL
  SELECT 2, 'kecamatan 6 baris',         count(*) = 6,    count(*)::text FROM kecamatan
  UNION ALL
  SELECT 3, 'faskes 119 titik',          count(*) = 119,  count(*)::text FROM faskes
  UNION ALL
  SELECT 4, 'sekolah 553 titik',         count(*) = 553,  count(*)::text FROM sekolah
  UNION ALL
  SELECT 5, 'jalan 4.236 ruas',          count(*) = 4236, count(*)::text FROM jalan
  UNION ALL
  SELECT 6, 'jangkauan faskes 4 poligon', count(*) = 4,   count(*)::text FROM jangkauan_faskes
  UNION ALL
  SELECT 7, 'semua layer EPSG:4326',
         count(*) FILTER (WHERE srid <> 4326) = 0,
         count(*) FILTER (WHERE srid <> 4326)::text || ' layer meleset'
    FROM geometry_columns WHERE f_table_schema = 'public'
  UNION ALL
  SELECT 8, 'geometri kelurahan valid',
         count(*) FILTER (WHERE NOT ST_IsValid(geom)) = 0,
         count(*) FILTER (WHERE NOT ST_IsValid(geom))::text || ' geometri rusak'
    FROM kelurahan
  UNION ALL
  SELECT 9, 'luas total 111,38 km2',
         abs(sum(ST_Area(geom::geography)) / 1e6 - 111.38) < 0.5,
         round((sum(ST_Area(geom::geography)) / 1e6)::numeric, 2)::text || ' km2'
    FROM kelurahan
  UNION ALL
  SELECT 10, 'indeks spasial terpasang',
         count(*) = 6, count(*)::text || ' dari 6'
    FROM pg_indexes
   WHERE schemaname = 'public' AND indexdef ILIKE '%USING gist%'
)
SELECT pemeriksaan,
       nilai,
       CASE WHEN lulus THEN 'OK' ELSE 'GAGAL' END AS status
  FROM cek
 ORDER BY urutan;
