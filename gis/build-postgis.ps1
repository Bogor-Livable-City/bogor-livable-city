<#
  Ruang Bogor — impor layer GeoJSON ke PostGIS (WBS 1.4.1)
  Memuat 6 layer dari public/data/ ke database PostgreSQL/PostGIS, EPSG:4326.

  Siapkan dulu databasenya (sekali saja, butuh password superuser):
    psql -U postgres -f gis/sql/00-setup-db.sql

  Pemakaian (PowerShell):
    .\gis\build-postgis.ps1
    .\gis\build-postgis.ps1 -DbHost "localhost" -DbPort 5433

  Butuh QGIS (ogr2ogr dengan driver PostgreSQL) — di laptop ini: C:\Program Files\QGIS 4.2.1\bin
#>
param(
  [string]$DbHost   = "localhost",
  [int]$DbPort      = 5432,
  [string]$DbName   = "ruang_bogor",
  [string]$DbUser   = "ruang_bogor",
  [string]$DbPass   = "ruang_bogor",
  [string]$DataDir  = (Join-Path $PSScriptRoot "..\public\data"),
  [string]$QgisBin  = "C:\Program Files\QGIS 4.2.1\bin"
)
$ErrorActionPreference = "Stop"

$ogr = Join-Path $QgisBin "ogr2ogr.exe"
if (-not (Test-Path $ogr)) { throw "ogr2ogr tidak ditemukan di $QgisBin" }

# ogr2ogr memanggil PROJ sendiri; tanpa dua variabel ini dia gagal baca database proyeksi.
$env:PROJ_LIB  = Join-Path $QgisBin "..\share\proj"
$env:GDAL_DATA = Join-Path $QgisBin "..\share\gdal"

$pg = "PG:host=$DbHost port=$DbPort dbname=$DbName user=$DbUser password=$DbPass"

# Nama tabel sengaja dibedakan dari nama file: JANGKAUAN_PUSKESMAS_RUMAHSAKIT terlalu panjang
# dan huruf besar bikin setiap query harus pakai tanda kutip.
$layers = @(
  @{ File = "kelurahan.geojson";                       Table = "kelurahan"        },
  @{ File = "kecamatan.geojson";                       Table = "kecamatan"        },
  @{ File = "faskes.geojson";                          Table = "faskes"           },
  @{ File = "sekolah.geojson";                         Table = "sekolah"          },
  @{ File = "jalan.geojson";                           Table = "jalan"            },
  @{ File = "JANGKAUAN_PUSKESMAS_RUMAHSAKIT.geojson";  Table = "jangkauan_faskes" }
)

foreach ($l in $layers) {
  $src = Join-Path $DataDir $l.File
  if (-not (Test-Path $src)) { throw "Layer tidak ada: $src" }

  & $ogr -f "PostgreSQL" $pg $src `
    -nln $l.Table `
    -t_srs "EPSG:4326" `
    -lco "GEOMETRY_NAME=geom" `
    -lco "FID=id" `
    -lco "SPATIAL_INDEX=GIST" `
    -overwrite
  if ($LASTEXITCODE -ne 0) { throw "Gagal mengimpor $($l.Table)" }

  "{0,-20} <- {1}" -f $l.Table, $l.File
}

"Selesai. Cek isinya: psql -U $DbUser -d $DbName -f gis/sql/02-cek-postgis.sql"
