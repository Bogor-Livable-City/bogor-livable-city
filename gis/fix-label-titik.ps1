<#
  Ruang Bogor — benahi label kelurahan pada titik faskes & sekolah

  Tiap titik di faskes.geojson dan sekolah.geojson membawa dua keterangan lokasi:
  koordinatnya sendiri dan kolom teks `kelurahan`. Untuk 51 titik keduanya
  bertentangan. Skrip ini mengambil ulang label dari koordinatnya.

  Titik yang kurang dari 10 meter dari garis batas tidak disentuh, karena peta dasar
  RBI 1:25.000 tidak cukup teliti untuk memutuskan di jarak segitu. Titik seperti itu
  masuk ke gis/label-ragu.csv untuk dicek manual oleh GIS Developer.

  Jalankan SETELAH build-data.ps1 dan build-postgis.ps1, karena skrip ini membaca
  geometri dari database:
    .\gis\build-postgis.ps1
    .\gis\fix-label-titik.ps1

  Lalu impor ulang supaya database ikut terbarui:
    .\gis\build-postgis.ps1
#>
param(
  [string]$DbHost  = "localhost",
  [int]$DbPort     = 5432,
  [string]$DbName  = "ruang_bogor",
  [string]$DbUser  = "ruang_bogor",
  [string]$DbPass  = "ruang_bogor",
  [string]$Out     = (Join-Path $PSScriptRoot "..\public\data"),
  [string]$QgisBin = "C:\Program Files\QGIS 4.2.1\bin"
)
$ErrorActionPreference = "Stop"

$ogr = Join-Path $QgisBin "ogr2ogr.exe"
if (-not (Test-Path $ogr)) { throw "ogr2ogr tidak ditemukan di $QgisBin" }

$env:PROJ_LIB  = Join-Path $QgisBin "..\share\proj"
$env:GDAL_DATA = Join-Path $QgisBin "..\share\gdal"

$pg  = "PG:host=$DbHost port=$DbPort dbname=$DbName user=$DbUser password=$DbPass"
$sql = Join-Path $PSScriptRoot "sql"

foreach ($nama in @("faskes", "sekolah")) {
  $dst = Join-Path $Out "$nama.geojson"
  $tmp = "$dst.baru"
  if (Test-Path $tmp) { Remove-Item $tmp }

  & $ogr -f "GeoJSON" $tmp $pg `
    -sql "@$(Join-Path $sql "03-$nama-terkoreksi.sql")" `
    -nln $nama `
    -t_srs "EPSG:4326" `
    -lco "RFC7946=YES" `
    -lco "WRITE_NAME=NO"
  if ($LASTEXITCODE -ne 0) { throw "Gagal mengekspor $nama" }

  # Tukar hanya setelah ekspor berhasil, supaya file lama tidak hilang kalau gagal di tengah.
  Move-Item -Force $tmp $dst
  "{0,-10} {1,6:N0} KB" -f "$nama.geojson", ((Get-Item $dst).Length / 1KB)
}

$ragu = Join-Path $PSScriptRoot "label-ragu.csv"
if (Test-Path $ragu) { Remove-Item $ragu }
& $ogr -f "CSV" $ragu $pg -sql "@$(Join-Path $sql "03-label-ragu.sql")"
if ($LASTEXITCODE -ne 0) { throw "Gagal membuat daftar label ragu" }
"{0,-10} {1,6:N0} baris untuk dicek manual" -f "label-ragu.csv", ((Get-Content $ragu).Count - 1)

"Selesai. Impor ulang databasenya: .\gis\build-postgis.ps1"
