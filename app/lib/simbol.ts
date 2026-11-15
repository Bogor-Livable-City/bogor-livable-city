// Simbol titik fasilitas, mengikuti panduan_desain_legenda_webgis.md.
// Dipakai bersama oleh peta (leaflet-map.tsx) dan legenda (peta/page.tsx),
// supaya warna dan ukurannya tidak pernah berbeda antara keduanya.

export type SimbolTitik = {
  label: string;
  warna: string;
  path: string; // isi <svg viewBox="0 0 24 24">
};

// Semua jenis dibedakan oleh warna dan ikon saja, ukurannya seragam.
export const UKURAN_PETA = 22;
export const UKURAN_LEGENDA = 20;

// Palang medis dengan ketebalan berbeda per jenjang layanan.
const PALANG_TEBAL = "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z";
const PALANG = "M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z";
const PALANG_TIPIS = "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z";

export const SIMBOL_FASKES: Record<string, SimbolTitik> = {
  rs: { label: "Rumah Sakit", warna: "#D32F2F", path: PALANG_TEBAL },
  puskesmas: { label: "Puskesmas", warna: "#2E7D32", path: PALANG },
  klinik: { label: "Klinik", warna: "#00838F", path: PALANG_TIPIS },
};

// Ketiga jenjang memakai topi toga; yang membedakan warnanya.
const TOGA = "M12 4 2 9l10 5 8-4v5h2V9zM6 13v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4l-6 3z";

export const SIMBOL_SEKOLAH: Record<string, SimbolTitik> = {
  sd: { label: "SD", warna: "#E65100", path: TOGA },
  smp: { label: "SMP", warna: "#1565C0", path: TOGA },
  sma_smk: { label: "SMA/SMK", warna: "#455A64", path: TOGA },
};

export function badgeHtml(s: SimbolTitik, ukuran = UKURAN_PETA) {
  return (
    `<span class="titik-badge" style="--titik-warna:${s.warna};width:${ukuran}px;height:${ukuran}px">` +
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${s.path}"/></svg></span>`
  );
}
