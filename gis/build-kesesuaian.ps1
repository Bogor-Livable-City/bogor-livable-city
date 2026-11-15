<#
  WBS 1.3.3 — Analisis overlay kesesuaian penggunaan lahan vs pola ruang.

  Membandingkan Penggunaan Lahan Kota Bogor 2023 dengan Pola Ruang RTRW 2021,
  lalu meringkasnya jadi dua angka per kelurahan di gis/kesesuaian_kelurahan.csv.

  Pemakaian (PowerShell):
    .\gis\build-kesesuaian.ps1
    .\gis\build-kesesuaian.ps1 -Dataset "D:\...\dataset" -QgisBin "C:\Program Files\QGIS 4.2.1\bin"

  Butuh QGIS (ogr2ogr + SpatiaLite). Sekali jalan sekitar 35 menit: irisan
  19.822 x 30.476 poligon menghasilkan ~110 ribu potongan.
#>
param(
  [string]$Dataset = "C:\Users\User\Documents\IPB 2024\Semester 5\Bogor Liveable City\dataset",
  [string]$Gpkg    = "C:\Users\User\Documents\IPB 2024\Semester 5\Bogor Liveable City\hasil_prototipe\v3\livable_kelurahan_v3_lengkap.gpkg",
  [string]$Out     = (Join-Path $PSScriptRoot "kesesuaian_kelurahan.csv"),
  [string]$Work    = (Join-Path $env:TEMP "bogor-overlay"),
  [string]$QgisBin = "C:\Program Files\QGIS 4.2.1\bin"
)
$ErrorActionPreference = "Stop"
$ogr = Join-Path $QgisBin "ogr2ogr.exe"
if (-not (Test-Path $ogr)) { throw "ogr2ogr tidak ada di $QgisBin. Sesuaikan -QgisBin dengan versi QGIS yang terpasang." }

# ogr2ogr memanggil PROJ dan GDAL lewat variabel ini. Tanpa keduanya, reproyeksi
# gagal dengan "proj_create: no database context specified".
$env:PROJ_LIB  = Join-Path (Split-Path $QgisBin -Parent) "share\proj"
$env:GDAL_DATA = Join-Path (Split-Path $QgisBin -Parent) "share\gdal"
# Geometri WKT satu poligon bisa lebih dari 1 MB; batas baris bawaan CSV terlalu kecil.
$env:OGR_CSV_MAX_LINE_SIZE = "200000000"

New-Item -ItemType Directory -Force $Work | Out-Null
$db = Join-Path $Work "overlay.gpkg"
if (Test-Path $db) { Remove-Item $db }

$lahanCsv = Join-Path $Dataset "PENGGUNAAN_LAHAN_KOTA_BOGOR_TAHUN_2023.csv"
$polaCsv  = Join-Path $Dataset "POLARUANG_KOTABOGOR_2021_AR.csv"
foreach ($f in @($lahanCsv, $polaCsv, $Gpkg)) {
  if (-not (Test-Path $f)) { throw "Data sumber tidak ketemu: $f" }
}

function Run([string[]]$a) {
  & $ogr @a
  if ($LASTEXITCODE -ne 0) { throw "ogr2ogr gagal: $($a -join ' ')" }
}

"[1/5] Memuat penggunaan lahan 2023 (EPSG:32748)"
Run @("-f","GPKG",$db,$lahanCsv,
      "-oo","GEOM_POSSIBLE_NAMES=geom","-oo","KEEP_GEOM_COLUMNS=NO","-a_srs","EPSG:32748",
      "-sql","SELECT KATEGORI, SUB_KATEGO, UNSUR FROM PENGGUNAAN_LAHAN_KOTA_BOGOR_TAHUN_2023",
      "-nln","lahan","-nlt","MULTIPOLYGON")

# Pola ruang ditulis dengan urutan sumbu terbalik (lintang dulu, baru bujur), jadi
# Kota Bogor "jatuh" di koordinat -6,6 / 106,8. SwapCoords meluruskannya sebelum
# diproyeksikan. Tanpa langkah ini hasil irisan nol karena kedua layer tidak bertemu.
"[2/5] Memuat pola ruang RTRW 2021, meluruskan sumbu, reproyeksi"
Run @("-f","GPKG","-update",$db,$polaCsv,
      "-oo","GEOM_POSSIBLE_NAMES=geom","-oo","KEEP_GEOM_COLUMNS=NO","-a_srs","EPSG:4326",
      "-sql","SELECT NAMOBJ FROM POLARUANG_KOTABOGOR_2021_AR",
      "-nln","pola_raw","-nlt","MULTIPOLYGON")
Run @("-f","GPKG","-update",$db,$db,"-dialect","SQLITE",
      "-sql","SELECT ST_Transform(SetSRID(SwapCoords(geom),4326),32748) AS geom, NAMOBJ AS zona FROM pola_raw",
      "-nln","pola","-nlt","MULTIPOLYGON","-a_srs","EPSG:32748")

"[3/5] Memuat batas 68 kelurahan"
Run @("-f","GPKG","-update","-overwrite",$db,$Gpkg,"7_livable",
      "-select","kode,kecamatan,kelurahan,luas_km2","-t_srs","EPSG:32748",
      "-nln","kel","-nlt","MULTIPOLYGON")

# Irisan dicari lewat rtree bawaan GeoPackage; tanpa itu perbandingannya
# 19.822 x 30.476 pasang dan praktis tidak selesai.
"[4/5] Irisan lahan x pola ruang (lama, sekitar 30 menit)"
Run @("-f","GPKG","-update","-overwrite",$db,$db,"-nln","irisan","-nlt","MULTIPOLYGON","-a_srs","EPSG:32748",
      "-dialect","SQLITE","-sql",@"
SELECT ST_Intersection(a.geom, b.geom) AS geom, b.zona AS zona,
  CASE
    WHEN a.SUB_KATEGO = 'Permukiman'          THEN 'huni'
    WHEN a.SUB_KATEGO = 'Kawasan Perdagangan' THEN 'niaga'
    WHEN a.SUB_KATEGO = 'Kawasan Industri'    THEN 'industri'
    WHEN a.KATEGORI   = 'Vegetasi'            THEN 'vegetasi'
    WHEN a.KATEGORI   = 'Hidrografi'          THEN 'air'
    WHEN a.KATEGORI IN ('Transportasi','Utilitas') THEN 'transport'
    ELSE 'fasum'
  END AS lahan
FROM lahan a
JOIN pola b ON b.fid IN (
  SELECT id FROM rtree_pola_geom r
  WHERE r.maxx >= ST_MinX(a.geom) AND r.minx <= ST_MaxX(a.geom)
    AND r.maxy >= ST_MinY(a.geom) AND r.miny <= ST_MaxY(a.geom))
WHERE ST_Intersects(a.geom, b.geom)
"@)

"[5/5] Agregasi kesesuaian ke kelurahan"
if (Test-Path $Out) { Remove-Item $Out }
Run @("-f","CSV",$Out,$db,"-dialect","SQLITE","-sql","@$(Join-Path $PSScriptRoot 'sql\kesesuaian_lahan.sql')")

# Luas hasil agregasi harus sama dengan luas kota (111,38 km2). Selisih berarti
# ada geometri yang gagal diiris dan angkanya tidak boleh dipakai.
$luas = (Import-Csv $Out | Measure-Object luas_terpetakan_km2 -Sum).Sum
"Selesai -> $Out"
"Luas terpetakan: {0:N2} km2 (acuan 111,38 km2)" -f $luas
if ([Math]::Abs($luas - 111.38) -gt 0.5) { throw "Luas meleset dari acuan. Periksa langkah 2 (urutan sumbu) dan 4." }
