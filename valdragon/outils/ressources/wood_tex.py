# Bois de planches procédural (diffuse + normal), raccordable, pour les accessoires du décor
import numpy as np
from PIL import Image
from scipy import ndimage
N=512
def pnoise(n,fx,fy,seed,oct=4,pers=.5):
    r=np.random.default_rng(seed);out=np.zeros((n,n));amp=1;tot=0
    for o in range(oct):
        gx,gy=fx*2**o,fy*2**o;g=r.random((gy,gx));g=np.pad(g,((0,1),(0,1)),mode='wrap')
        z=ndimage.zoom(g,((n+n/gy)/(gy+1),(n+n/gx)/(gx+1)),order=3,mode='grid-wrap')[:n,:n]
        out+=z*amp;tot+=amp;amp*=pers
    out/=tot;return (out-out.min())/(out.max()-out.min()+1e-9)
yy,xx=np.mgrid[0:N,0:N]/N
planks=6;pid=np.floor(xx*planks).astype(int);fu=xx*planks-pid
r=np.random.default_rng(5);off=r.random(planks);tone=.85+.3*r.random(planks)
# veines : bruit étiré le long de y, décalé par planche
grain=pnoise(N,32,2,11,4,.55);warp=pnoise(N,4,1,12,3)
rings=np.sin((xx*planks*7+warp*3+off[pid]*10)*np.pi*2+grain*4)*.5+.5
knots=np.zeros((N,N))
gap=np.clip(np.minimum(fu,1-fu)/.025,0,1)
end=(np.abs(((yy+off[pid]*.7)%1)-.5)>.495)  # joints de bout
base=np.array([.42,.27,.15])
L=(.55+.35*rings*.5+.25*grain)*tone[pid]*(1-knots*.4)
d=base[None,None,:]*L[...,None]*(.25+.75*gap[...,None])*(1-end[...,None]*.6)
d*= (.85+.3*pnoise(N,4,4,15,4))[...,None]
h=(.5+.25*rings+.2*grain)*gap*(1-end*.8)-knots*.2
gx=(np.roll(h,-1,1)-np.roll(h,1,1))*5;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*5;l=np.sqrt(gx*gx+gy*gy+1)
n=np.stack([-gx/l*.5+.5,-gy/l*.5+.5,1/l*.5+.5],-1)
Image.fromarray((np.clip(d/np.max(d)*.9,0,1)*255).astype(np.uint8)).save('tex/wood_d.jpg',quality=78)
Image.fromarray((n*255).astype(np.uint8)).save('tex/wood_n.jpg',quality=80)
print('ok')
