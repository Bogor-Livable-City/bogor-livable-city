-- WBS 1.3.3 — Analisis overlay kesesuaian penggunaan lahan terhadap pola ruang.
--
-- Membandingkan kondisi lapangan (Penggunaan Lahan Kota Bogor 2023) dengan
-- rencana peruntukan (Pola Ruang RTRW Kota Bogor 2021), lalu meringkasnya per
-- kelurahan. Dijalankan oleh gis/build-kesesuaian.ps1 setelah kedua dataset
-- dimuat dan disamakan proyeksinya ke UTM 48S (EPSG:32748).
--
-- Dua angka yang dihasilkan tiap kelurahan:
--   kesesuaian_pct        — persen luas yang pemakaiannya sesuai rencana.
--   pelanggaran_lindung_pct — persen kawasan lindung (RTH, sempadan sungai,
--                           badan air, pelestarian alam) yang terlanjur terbangun.
--                           Ini indikator tekanan ruang, bukan sekadar ketidaksesuaian.
--
-- Luas dihitung dalam meter persegi pada EPSG:32748, bukan derajat, supaya
-- angkanya bisa dijumlahkan.

WITH
-- Tiap potongan irisan lahan x pola ruang dipotong lagi oleh batas kelurahan,
-- supaya luasnya tidak bocor ke kelurahan tetangga.
potongan AS (
  SELECT
    k.kode,
    i.zona,
    i.lahan,
    ST_Area(ST_Intersection(i.geom, k.geom)) AS luas_m2
  FROM irisan i
  JOIN kel k ON k.fid IN (
    SELECT id FROM rtree_kel_geom r
    WHERE r.maxx >= ST_MinX(i.geom) AND r.minx <= ST_MaxX(i.geom)
      AND r.maxy >= ST_MinY(i.geom) AND r.miny <= ST_MaxY(i.geom))
  WHERE ST_Intersects(i.geom, k.geom)
),
-- Matriks kesesuaian: untuk tiap zona rencana, kelas lahan apa yang dianggap sesuai.
-- 'transport' (jalan, rel, utilitas) dianggap sesuai di semua zona terbangun karena
-- setiap peruntukan membutuhkan akses.
dinilai AS (
  SELECT
    kode,
    luas_m2,
    zona,
    lahan,
    CASE
      WHEN zona = 'Kawasan Perumahan'
        THEN lahan IN ('huni', 'fasum', 'transport')
      WHEN zona = 'Kawasan Perdagangan dan Jasa'
        THEN lahan IN ('niaga', 'huni', 'fasum', 'transport')
      WHEN zona = 'Kawasan Campuran'
        THEN lahan IN ('huni', 'niaga', 'fasum', 'transport')
      WHEN zona = 'Kawasan Peruntukan Industri'
        THEN lahan IN ('industri', 'transport')
      WHEN zona = 'Kawasan Perkantoran'
        THEN lahan IN ('fasum', 'niaga', 'transport')
      WHEN zona IN ('Kawasan Fasilitas Umum dan Fasilitas Sosial',
                    'Kawasan Pertahanan dan Keamanan')
        THEN lahan IN ('fasum', 'transport')
      WHEN zona = 'Kawasan Infrastruktur Perkotaan'
        THEN lahan IN ('fasum', 'industri', 'transport')
      WHEN zona IN ('Kawasan Transportasi', 'Badan Jalan')
        THEN lahan IN ('transport', 'fasum')
      WHEN zona = 'Kawasan Pariwisata'
        THEN lahan IN ('vegetasi', 'fasum', 'niaga')
      WHEN zona = 'Kawasan Peternakan'
        THEN lahan IN ('vegetasi', 'fasum')
      WHEN zona = 'Kawasan Tanaman Pangan'
        THEN lahan = 'vegetasi'
      WHEN zona IN ('Ruang Terbuka Hijau', 'Sempadan Sungai',
                    'Kawasan Sekitar Danau atau Waduk', 'Kawasan Pelestarian Alam')
        THEN lahan IN ('vegetasi', 'air')
      WHEN zona = 'Badan Air'
        THEN lahan = 'air'
      ELSE 0
    END AS sesuai
  FROM potongan
)
SELECT
  kode,
  round(sum(luas_m2) / 1e6, 4)                                            AS luas_terpetakan_km2,
  round(100.0 * sum(CASE WHEN sesuai THEN luas_m2 ELSE 0 END)
        / nullif(sum(luas_m2), 0), 2)                                     AS kesesuaian_pct,
  round(100.0 * sum(CASE WHEN zona IN ('Ruang Terbuka Hijau', 'Sempadan Sungai',
                                       'Badan Air', 'Kawasan Sekitar Danau atau Waduk',
                                       'Kawasan Pelestarian Alam')
                          AND lahan IN ('huni', 'niaga', 'industri', 'fasum')
                         THEN luas_m2 ELSE 0 END)
        / nullif(sum(CASE WHEN zona IN ('Ruang Terbuka Hijau', 'Sempadan Sungai',
                                        'Badan Air', 'Kawasan Sekitar Danau atau Waduk',
                                        'Kawasan Pelestarian Alam')
                          THEN luas_m2 ELSE 0 END), 0), 2)                AS pelanggaran_lindung_pct
FROM dinilai
GROUP BY kode
ORDER BY kesesuaian_pct DESC
