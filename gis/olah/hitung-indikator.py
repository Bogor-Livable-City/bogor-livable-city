"""Menghitung ulang jarak_* dan cakupan_* dengan metode asli dari build_v2.py.

Titik sampel: kisi 75 m di area permukiman tiap kelurahan (25 m kalau titiknya
kurang dari lima). Jarak diukur lewat jaringan jalan OSM, lalu dirata-rata atas
seluruh titik kisi di kelurahan itu. Cakupan adalah persentase titik kisi yang
jaraknya masuk radius.

Pakai:  python hitung-indikator.py <faskes.csv> <sekolah.csv> <keluaran.csv>

Berkas titik harus punya kolom g, lon, lat. Nilai g: puskesmas/klinik/rs untuk
faskes, SD/SMP/SMA untuk sekolah.
"""
import sys, os, json
import numpy as np, pandas as pd, shapely
from shapely import wkt
from shapely.ops import unary_union
from netlib import Net, T

BL = os.environ.get("BL_DIR")
if not BL:
    sys.exit("set BL_DIR ke folder 'Bogor Liveable City'")
DATASET = os.path.join(BL, "dataset")
OSM = os.path.join(BL, "hasil_prototipe", "data_input", "jalan_osm_bogor.geojson")

fileFaskes, fileSekolah, fileKeluar = sys.argv[1], sys.argv[2], sys.argv[3]

fix = lambda g: g if g.is_valid else shapely.make_valid(g)
# WKT di berkas ini berurutan (lat lon), jadi dibalik sebelum diproyeksikan
ll2utm = lambda g: shapely.transform(g, lambda a: np.c_[T.transform(a[:, 1], a[:, 0])])

# ---------- kelurahan
kd = pd.read_csv(os.path.join(DATASET, "peta_tingkat_persentase_penduduk_dengan_tingkat_kesejahteraan.csv"),
                 usecols=["geom", "kode_desa1", "nama_desa_", "nama_kecam"])
kd["kode"] = kd.kode_desa1.astype(str)
kd["geom_u"] = [fix(ll2utm(wkt.loads(s))) for s in kd.geom]
kd = kd.sort_values("kode").reset_index(drop=True)
print("kelurahan:", len(kd), "| luas total km2:", round(sum(g.area for g in kd.geom_u) / 1e6, 2))

# ---------- jaringan jalan
N = Net(OSM)
print("graf: simpul", N.n, "sisi", N.nedges, "komponen", N.ncomp, "LCC", round(N.share_lcc, 4))

# ---------- kisi titik permukiman
pm = pd.read_csv(os.path.join(DATASET, "PEMUKIMAN_AR_25K.csv"), usecols=["geom"])
pmg = [fix(ll2utm(wkt.loads(s))) for s in pm.geom]
pm_tree = shapely.STRtree(pmg)
pts, kel_idx = [], []
for i, g in enumerate(kd.geom_u):
    parts = [fix(pmg[j].intersection(g)) for j in pm_tree.query(g)]
    parts = [p for p in parts if not p.is_empty]
    area = unary_union(parts) if parts else g
    step = 75
    minx, miny, maxx, maxy = area.bounds
    gx, gy = np.meshgrid(np.arange(minx + step / 2, maxx, step), np.arange(miny + step / 2, maxy, step))
    gx, gy = gx.ravel(), gy.ravel()
    m = shapely.contains_xy(area, gx, gy)
    if m.sum() < 5:
        step = 25
        gx, gy = np.meshgrid(np.arange(minx + step / 2, maxx, step), np.arange(miny + step / 2, maxy, step))
        gx, gy = gx.ravel(), gy.ravel()
        m = shapely.contains_xy(area, gx, gy)
    if m.sum() == 0:
        p = area.representative_point()
        gx, gy, m = np.array([p.x]), np.array([p.y]), np.array([True])
    pts.append(np.c_[gx[m], gy[m]])
    kel_idx += [i] * int(m.sum())
P = np.vstack(pts)
K = np.array(kel_idx)
bc = np.bincount(K, minlength=len(kd))
print("titik kisi:", len(P), "| per kelurahan min/median/maks:", bc.min(), int(np.median(bc)), bc.max())

snapP, snapPd = N.snap(P)
print("jarak snap titik kisi ke jalan: median", round(float(np.median(snapPd))),
      "p95", round(float(np.percentile(snapPd, 95))), "maks", round(float(snapPd.max())))

# ---------- titik fasilitas
def muat(path):
    d = pd.read_csv(path)
    x, y = T.transform(d.lon.values, d.lat.values)
    d["x"], d["y"] = x, y
    return d

F = muat(fileFaskes)
SC = muat(fileSekolah)
print("faskes:", len(F), dict(F.g.value_counts()), "| sekolah:", len(SC), dict(SC.g.value_counts()))

# ---------- jarak dan cakupan
RAD = {"puskesmas": 2000, "klinik": 1000, "rs": 5000, "SD": 3000, "SMP": 3000, "SMA": 3000}
DIST = {}
for g in ("puskesmas", "klinik", "rs"):
    DIST[g] = N.dist_from(F[F.g == g][["x", "y"]].values)[snapP] + snapPd
for g in ("SD", "SMP", "SMA"):
    DIST[g] = N.dist_from(SC[SC.g == g][["x", "y"]].values)[snapP] + snapPd

def agg(d, R):
    df = pd.DataFrame({"k": K, "d": d, "c": (d <= R).astype(float)}).groupby("k").agg(
        jarak=("d", "mean"), cakupan=("c", "mean"))
    return df.jarak.values, df.cakupan.values * 100

O = pd.DataFrame({"kode": kd.kode, "kelurahan": kd.nama_desa_, "kecamatan": kd.nama_kecam})
for g in DIST:
    O["jarak_" + g], O["cakupan_" + g] = agg(DIST[g], RAD[g])

# jumlah fasilitas spasial, dipakai kalau berkas titik tidak membawa kolom kel
O.to_csv(fileKeluar, index=False)
print("tersimpan:", fileKeluar)
print(O[["jarak_puskesmas", "jarak_klinik", "jarak_rs", "jarak_SD", "jarak_SMP", "jarak_SMA"]].describe().T.round(1).to_string())
