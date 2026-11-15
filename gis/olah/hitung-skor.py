"""Menghitung skor dimensi, skor_livable, kelas, dan peringkat.

Rumusnya mengikuti score_v3.py dari folder prototipe: min-max tiap indikator
(dibalik untuk yang negatif), dijumlahkan dalam dimensi, lalu di-min-max lagi.
skor_livable adalah min-max dari jumlah enam skor dimensi.

Pakai:  python hitung-skor.py <indikator.csv> <titik_faskes.csv> <titik_sekolah.csv> <keluaran.csv>

Empat dimensi lain (Sosial, Ekonomi, Transportasi, Lingkungan) diambil apa adanya
dari gpkg karena tidak bergantung titik fasilitas.
"""
import sys, os, re
import numpy as np, pandas as pd

GPKG = os.environ.get("GPKG_CSV")
if not GPKG:
    sys.exit("set GPKG_CSV ke folder hasil ekspor tabel gpkg")
fileInd, fileFaskes, fileSekolah, fileKeluar = sys.argv[1:5]

baca = lambda n: pd.read_csv(os.path.join(GPKG, n + ".csv"), dtype={"kode": str})
Kg, Pg = baca("1_kesehatan"), baca("2_pendidikan")
Sg, Eg, Tg, Lg = baca("3_sosial_kependudukan"), baca("4_ekonomi"), baca("5_transportasi"), baca("6_lingkungan")
Lv = baca("7_livable")

norm = lambda s: re.sub(r"[^A-Z]", "", str(s).upper())

# Kunci kecamatan+kelurahan dengan pencocokan mirip, sama seperti build_v2.py.
import difflib, shapely
from shapely import wkt
from shapely.geometry import Point
from netlib import T

BL = os.environ.get("BL_DIR")
if not BL:
    sys.exit("set BL_DIR ke folder 'Bogor Liveable City'")
fix = lambda g: g if g.is_valid else shapely.make_valid(g)
ll2utm = lambda g: shapely.transform(g, lambda a: np.c_[T.transform(a[:, 1], a[:, 0])])
kdp = pd.read_csv(os.path.join(BL, "dataset", "peta_tingkat_persentase_penduduk_dengan_tingkat_kesejahteraan.csv"),
                  usecols=["geom", "kode_desa1", "nama_desa_", "nama_kecam"])
kdp["kode"] = kdp.kode_desa1.astype(str)
kdp["geom_u"] = [fix(ll2utm(wkt.loads(t))) for t in kdp.geom]
kdp = kdp.sort_values("kode").reset_index(drop=True)
geoms = list(kdp.geom_u)
pohon = shapely.STRtree(geoms)
kdkey = {(r.nama_kecam.title() + "|" + norm(r.nama_desa_)): r.kode for r in kdp.itertuples()}

def cari_kode(kec, kel):
    k = str(kec) + "|" + norm(kel)
    if k in kdkey:
        return kdkey[k]
    c = [x for x in kdkey if x.startswith(str(kec) + "|")]
    m = difflib.get_close_matches(k, c, n=1, cutoff=0.6)
    return kdkey[m[0]] if m else None

ind = pd.read_csv(fileInd, dtype={"kode": str}).set_index("kode")

def hitung(path, kolom_g):
    """Jumlah fasilitas per kelurahan.

    Kalau berkas punya kolom catatan_akurasi (berkas asli), titik bertanda
    "perlu dicek" dipindah ke kelurahan tempat koordinatnya jatuh, persis seperti
    build_v3.py. Berkas titik hasil koreksi kita tidak punya kolom itu, karena
    labelnya sudah diperbaiki manual, jadi cukup dibaca apa adanya.
    """
    d = pd.read_csv(path)
    kode = [cari_kode(r.kec, r.kel) for r in d.itertuples()]
    if "catatan_akurasi" in d.columns:
        tanda = d.catatan_akurasi.astype(str).str.startswith("perlu dicek").values
        x, y = T.transform(d.lon.values, d.lat.values)
        for i in range(len(d)):
            if not tanda[i]:
                continue
            pt = Point(x[i], y[i])
            kena = [j for j in pohon.query(pt) if geoms[j].contains(pt)]
            if kena:
                kode[i] = kdp.kode.iloc[int(kena[0])]
    d["kode"] = kode
    if d.kode.isna().any():
        sys.exit("label kelurahan tidak dikenal: " + ", ".join(sorted(set(d[d.kode.isna()].kel))[:5]))
    c = d.groupby(["kode", "g"]).size().unstack(fill_value=0)
    return c.reindex(Kg.sort_values("kode").kode).fillna(0).astype(int)[kolom_g]

Kg = Kg.sort_values("kode").reset_index(drop=True)
Pg = Pg.sort_values("kode").reset_index(drop=True)
nF = hitung(fileFaskes, ["puskesmas", "klinik", "rs"])
nS = hitung(fileSekolah, ["SD", "SMP", "SMA"])

d = pd.DataFrame({"kode": Kg.kode.values, "kelurahan": Kg.kelurahan.values, "kecamatan": Kg.kecamatan.values,
                  "penduduk": Kg.penduduk.values, "luas_km2": Kg.luas_km2.values}).set_index("kode")
for c in ("puskesmas", "klinik", "rs"):
    d["n_" + c] = nF[c].values
for c in ("SD", "SMP", "SMA"):
    d["n_" + c] = nS[c].values

mmv = lambda s: (s - s.min()) / (s.max() - s.min())
for c in ("jarak_puskesmas", "jarak_klinik", "jarak_rs", "jarak_SD", "jarak_SMP", "jarak_SMA",
          "cakupan_puskesmas", "cakupan_klinik", "cakupan_rs"):
    d[c] = ind[c].reindex(d.index).values

d["K1"] = d[["cakupan_puskesmas", "cakupan_klinik", "cakupan_rs"]].mean(axis=1)
d["K2"] = pd.concat([mmv(d.jarak_puskesmas), mmv(d.jarak_klinik), mmv(d.jarak_rs)], axis=1).mean(axis=1)
d["P1"] = (d.n_SD + d.n_SMP + d.n_SMA) / d.penduduk * 10000
d["P2"] = d[["jarak_SD", "jarak_SMP", "jarak_SMA"]].mean(axis=1)
# empat dimensi yang tidak tersentuh titik fasilitas
ambil = lambda T, c: pd.Series(T.set_index("kode")[c]).reindex(d.index).values
d["S1"] = ambil(Sg, "S1_kepadatan_jiwa_km2"); d["S2"] = ambil(Sg, "S2_kriminalitas_per_10rb")
d["E1"] = ambil(Eg, "E1_kawasan_perdagangan_pct"); d["E2"] = ambil(Eg, "E2_kawasan_industri_pct")
d["T1"] = ambil(Tg, "T1_badan_jalan_pct"); d["T2"] = ambil(Tg, "T2_kerapatan_jalan_osm_km_km2")
d["L1"] = ambil(Lg, "L1_vegetasi_pct"); d["L2"] = ambil(Lg, "L2_vegetasi_m2_per_jiwa")

def mm(s, inv=False):
    s = pd.Series(s, dtype=float); r = s.max() - s.min()
    if r == 0:
        return pd.Series(0.0, index=s.index)
    x = (s - s.min()) / r
    return 1 - x if inv else x

CLS = ["Sangat Tidak Layak Huni", "Tidak Layak Huni", "Cukup Layak Huni", "Layak Huni", "Sangat Layak Huni"]
SPEC = {"kesehatan": [("K1", False), ("K2", True)], "pendidikan": [("P1", False), ("P2", True)],
        "sosial": [("S1", True), ("S2", True)], "ekonomi": [("E1", False), ("E2", False)],
        "transportasi": [("T1", False), ("T2", False)], "lingkungan": [("L1", False), ("L2", False)]}

D = pd.DataFrame({k: mm(sum(mm(d[c], inv) for c, inv in inds)) for k, inds in SPEC.items()})
tot = D.sum(axis=1)
liv = mm(tot)
for k in D:
    d["skor_" + k] = D[k].values
d["total_6_dimensi"] = tot.values
d["skor_livable"] = liv.values
d["kelas"] = pd.cut(liv, [-1e-9, .2, .4, .6, .8, 1 + 1e-9], labels=CLS).astype(str).values
d["peringkat"] = liv.rank(ascending=False, method="min").astype(int).values

d.reset_index().to_csv(fileKeluar, index=False)
print("tersimpan:", fileKeluar)

# bandingkan ke gpkg
print("\nbanding ke gpkg (selisih maks):")
for nama, kolom, T, kg in (("skor_kesehatan", "skor_dimensi", Kg, "skor_kesehatan"),
                           ("skor_pendidikan", "skor_dimensi", Pg, "skor_pendidikan"),
                           ("skor_sosial", "skor_dimensi", Sg, "skor_sosial_kependudukan"),
                           ("skor_ekonomi", "skor_dimensi", Eg, "skor_ekonomi"),
                           ("skor_transportasi", "skor_dimensi", Tg, "skor_transportasi"),
                           ("skor_lingkungan", "skor_dimensi", Lg, "skor_lingkungan")):
    y = pd.Series(T.set_index("kode")[kolom]).reindex(d.index)
    print("  " + nama.ljust(19) + f"{(d[nama] - y).abs().max():.6f}")
ylv = Lv.set_index("kode")
print("  skor_livable       " + f"{(d.skor_livable - ylv.skor_livable.reindex(d.index)).abs().max():.6f}")
beda = int((d.peringkat.values != ylv.peringkat.reindex(d.index).values).sum())
print("  peringkat berbeda  " + str(beda) + "/68")
print("\nsebaran kelas:")
print(d.kelas.value_counts().reindex(CLS).to_string())
