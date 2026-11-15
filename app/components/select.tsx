"use client";

// Pengganti <select> bawaan: daftar pilihan yang membuka dengan animasi.
// Ditulis sendiri supaya tidak menambah dependensi hanya untuk satu kontrol.

import { useEffect, useRef, useState } from "react";

export type OpsiSelect = { value: string; label: string };

export function SelectAnimasi({
  value,
  options,
  onChange,
  label,
  id,
}: {
  value: string;
  options: OpsiSelect[];
  onChange: (value: string) => void;
  label: string;
  id?: string;
}) {
  const [buka, setBuka] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  const tombol = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buka) return;
    const luar = (e: MouseEvent) => {
      if (!wadah.current?.contains(e.target as Node)) setBuka(false);
    };
    const tombolEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setBuka(false);
      tombol.current?.focus();
    };
    document.addEventListener("mousedown", luar);
    document.addEventListener("keydown", tombolEsc);
    return () => {
      document.removeEventListener("mousedown", luar);
      document.removeEventListener("keydown", tombolEsc);
    };
  }, [buka]);

  const terpilih = options.find((o) => o.value === value);

  return (
    <div className="aselect" ref={wadah} data-buka={buka}>
      <button
        type="button"
        id={id}
        ref={tombol}
        className="aselect-tombol"
        aria-haspopup="listbox"
        aria-expanded={buka}
        aria-label={label}
        onClick={() => setBuka((b) => !b)}
      >
        <span>{terpilih?.label ?? value}</span>
        <i aria-hidden="true" />
      </button>
      <div className="aselect-panel" role="listbox" aria-label={label} hidden={!buka}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="option"
            aria-selected={o.value === value}
            className={o.value === value ? "terpilih" : ""}
            onClick={() => {
              onChange(o.value);
              setBuka(false);
              tombol.current?.focus();
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
