-- Membuat database dan role untuk Ruang Bogor (WBS 1.4.1 Setup PostgreSQL/PostGIS).
--
-- Jalankan sekali sebagai superuser, dari akar project:
--   psql -U postgres -f gis/sql/00-setup-db.sql
--
-- Password di bawah hanya untuk database lokal di laptop pengembang, dan sengaja
-- ditulis terbuka supaya satu kelompok bisa menyalakan database yang sama persis.
-- Ganti sebelum dipakai di server mana pun.
--
-- Kalau dijalankan dua kali, psql akan bilang "already exists" lalu melanjutkan.
-- Itu wajar dan tidak merusak apa-apa.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ruang_bogor') THEN
    CREATE ROLE ruang_bogor LOGIN PASSWORD 'ruang_bogor';
  END IF;
END
$$;

CREATE DATABASE ruang_bogor OWNER ruang_bogor;

\connect ruang_bogor

CREATE EXTENSION IF NOT EXISTS postgis;

-- ogr2ogr membuat tabelnya sendiri saat impor, jadi role ini butuh hak tulis di schema public.
ALTER SCHEMA public OWNER TO ruang_bogor;

SELECT 'database siap' AS status, postgis_version() AS versi_postgis;
