import json, numpy as np, scipy.sparse as sp
from scipy.sparse.csgraph import connected_components, dijkstra
from scipy.spatial import cKDTree
from pyproj import Transformer
T=Transformer.from_crs(4326,32748,always_xy=True)
EXCL={'motorway','motorway_link','construction','proposed','raceway'}
class Net:
    def __init__(self,path):
        d=json.load(open(path)); idx={}; xs=[]; ys=[]; E=[]
        for f in d['features']:
            if f['properties'].get('highway') in EXCL: continue
            c=f['geometry']['coordinates']; prev=None
            for lon,lat in c:
                k=(round(lon,6),round(lat,6))
                if k not in idx: idx[k]=len(idx); xs.append(lon); ys.append(lat)
                i=idx[k]
                if prev is not None and prev!=i: E.append((prev,i))
                prev=i
        X,Y=T.transform(np.array(xs),np.array(ys)); self.xy=np.c_[X,Y]; n=len(X)
        E=np.array(E); w=np.hypot(*(self.xy[E[:,0]]-self.xy[E[:,1]]).T)
        A=sp.coo_matrix((w,(E[:,0],E[:,1])),shape=(n,n)).tocsr(); A=A.minimum(A.T) if False else A
        A=(A+A.T).tocsr(); A.data=A.data/ (1)  # duplicate edges would double; fix below
        # rebuild without double counting duplicates: use minimum over duplicates
        B=sp.coo_matrix((w,(E[:,0],E[:,1])),shape=(n,n)).tocsr()   # sums duplicates
        cnt=sp.coo_matrix((np.ones(len(w)),(E[:,0],E[:,1])),shape=(n,n)).tocsr()
        B=B.multiply(1/np.maximum(cnt.toarray() if n<3000 else 1,1)) if False else B
        self.n=n; self.nedges=len(E); self.E=E; self.w=w
        # symmetric graph with min weight per pair
        import pandas as pd
        df=pd.DataFrame({'a':np.minimum(E[:,0],E[:,1]),'b':np.maximum(E[:,0],E[:,1]),'w':w}).groupby(['a','b']).w.min().reset_index()
        G=sp.coo_matrix((np.r_[df.w,df.w],(np.r_[df.a,df.b],np.r_[df.b,df.a])),shape=(n,n)).tocsr()
        nc,lab=connected_components(G,directed=False); big=np.bincount(lab).argmax(); self.lcc=np.where(lab==big)[0]
        self.G=G; self.share_lcc=len(self.lcc)/n; self.ncomp=nc
        self.tree=cKDTree(self.xy[self.lcc])
    def snap(self,pts):
        d,i=self.tree.query(pts); return self.lcc[i],d
    def dist_from(self,fac_xy):
        """network distance (m) from each graph node to nearest facility (incl. snap offsets)"""
        nodes,sd=self.snap(fac_xy); F=len(nodes); n=self.n
        rows=np.r_[np.arange(n,n+F),nodes]; cols=np.r_[nodes,np.arange(n,n+F)]; ww=np.r_[sd,sd]
        add=sp.coo_matrix((ww,(rows,cols)),shape=(n+F,n+F)).tocsr()
        G=sp.bmat([[self.G,None],[None,sp.csr_matrix((F,F))]]).tocsr()+add
        d=dijkstra(G,directed=False,indices=np.arange(n,n+F),min_only=True)
        return d[:n]
    def dist_to_points(self,fac_xy,pts):
        dn=self.dist_from(fac_xy); nodes,sd=self.snap(pts); return dn[nodes]+sd
