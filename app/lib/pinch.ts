"use client";

// Cubitan dua jari untuk satu elemen peta saja.
//
// Handler sentuh milik React dipasang sebagai listener pasif, sehingga
// preventDefault di dalamnya diabaikan dan browser tetap men-zoom seluruh
// halaman. Karena itu listener di sini dipasang langsung ke elemennya dengan
// passive: false.

import { useEffect, useRef, type RefObject } from "react";

function jarakDuaJari(t: TouchList): number {
  return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
}

export function usePinchZoom(
  ref: RefObject<HTMLElement | null>,
  // rasio = jarak sekarang dibagi jarak saat cubitan dimulai.
  terapkan: (rasio: number, nilaiAwal: number) => void,
  ambilNilai: () => number
) {
  // Disimpan di ref supaya listener tidak dipasang ulang tiap render.
  const fn = useRef({ terapkan, ambilNilai });
  fn.current = { terapkan, ambilNilai };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let awal: { jarak: number; nilai: number } | null = null;

    const mulai = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      awal = { jarak: jarakDuaJari(e.touches), nilai: fn.current.ambilNilai() };
    };

    const gerak = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !awal) return;
      e.preventDefault();
      const jarak = jarakDuaJari(e.touches);
      if (awal.jarak > 0) fn.current.terapkan(jarak / awal.jarak, awal.nilai);
    };

    const selesai = (e: TouchEvent) => {
      if (e.touches.length < 2) awal = null;
    };

    el.addEventListener("touchstart", mulai, { passive: false });
    el.addEventListener("touchmove", gerak, { passive: false });
    el.addEventListener("touchend", selesai);
    el.addEventListener("touchcancel", selesai);
    return () => {
      el.removeEventListener("touchstart", mulai);
      el.removeEventListener("touchmove", gerak);
      el.removeEventListener("touchend", selesai);
      el.removeEventListener("touchcancel", selesai);
    };
  }, [ref]);
}
