# Parois rocheuses (cavernes, givre) à partir de rock_wall_12 (Poly Haven, CC0) : grandes pierres, fissures sombres au lieu de joints clairs
import numpy as np
from PIL import Image
from scipy import ndimage
Image.MAX_IMAGE_PIXELS=None
SRC='/home/claude/assets/ph';N=768
def pnoise(n,freq,seed,octaves=5,pers=.5):
    r=np.random.default_rng(seed);out=np.zeros((n,n));amp=1;tot=0
    for o in range(octaves):
        f=freq*2**o;g=r.random((f,f));g=np.pad(g,((0,1),(0,1)),mode='wrap')
        z=ndimage.zoom(g,(n+n/f)/(f+1),order=3,mode='grid-wrap')[:n,:n];out+=z*amp;tot+=amp;amp*=pers
    out/=tot;return (out-out.min())/(out.max()-out.min()+1e-9)
def soft(m,lo,hi):return np.clip((m-lo)/(hi-lo),0,1)
def normal(h,s):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*s;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*s;l=np.sqrt(gx*gx+gy*gy+1)
    return np.stack([-gx/l*.5+.5,-gy/l*.5+.5,1/l*.5+.5],-1)
def grade(c,tint,sat,gain,gamma=1.):
    L=(c*[.3,.59,.11]).sum(-1,keepdims=True);c=L+(c-L)*sat;return np.clip((c*tint*gain)**gamma,0,1)
d=Image.open(f'{SRC}/rock_wall_12/rock_wall_12_diff_4k.jpg').convert('RGB')
hh=Image.open(f'{SRC}/rock_wall_12/rock_wall_12_disp_4k.png');hh=hh.convert('I;16') if hh.mode not in('L','I;16') else hh
W,H=d.size
# on agrandit un quart de la texture : pierres deux fois plus grandes (texture qui reste raccordable : on miroite le quart)
dq=np.asarray(d.resize((N,N),Image.LANCZOS),dtype=np.float32)/255
hq=np.asarray(Image.fromarray(np.asarray(hh,dtype=np.float32)).resize((N,N),Image.BILINEAR),dtype=np.float32)
def tile4(a):return np.concatenate([np.concatenate([a,a[:,::-1]],1),np.concatenate([a[::-1],a[::-1,::-1]],1)],0)
hq=(hq-hq.min())/(hq.max()-hq.min()+1e-9)
mort=soft(1-hq,.5,.78)[...,None]          # joints (creux)
rock=ndimage.gaussian_filter(dq,(3,3,0))   # couleur de pierre adoucie
base=dq*(1-mort)+rock*.28*mort             # joints -> fissures sombres
var=pnoise(N,3,501,4)[...,None]
def save(name,c,h,s):
    Image.fromarray((np.clip(c,0,1)*255).astype(np.uint8)).save(f'tex/{name}_d.jpg',quality=82,optimize=True)
    Image.fromarray((normal(h,s)*255).astype(np.uint8)).save(f'tex/{name}_n.jpg',quality=84,optimize=True)
h2=hq*.75+ndimage.gaussian_filter(pnoise(N,12,502,3),1)*.25
c=grade(base,(1.04,.95,.84),.7,.95)*(.8+.4*var)
wet=soft(pnoise(N,5,503,4),.62,.85)[...,None];c=c*(1-wet*.35)
save('cav_w',c,h2,11)
gy=np.roll(h2,1,0)-np.roll(h2,-1,0);ledge=soft(ndimage.gaussian_filter(gy,2),.002,.012)[...,None]
c=grade(base,(.84,.94,1.12),.38,1.0)*(.85+.3*var);c=c*(1-ledge*.4)+np.array([.82,.9,.98])*ledge*.45
save('frost_w',c,h2,11)
print('ok')
# cavernes : pierres brutes irrégulières (rustic_stone_wall), roche brune humide, mousse dans les creux
d2=np.asarray(Image.open(f'{SRC}/rustic_stone_wall/rustic_stone_wall_diff_4k.jpg').convert('RGB').resize((N,N),Image.LANCZOS),dtype=np.float32)/255
h3=Image.open(f'{SRC}/rustic_stone_wall/rustic_stone_wall_disp_4k.png');h3=h3.convert('I;16') if h3.mode not in('L','I;16') else h3
h3=np.asarray(Image.fromarray(np.asarray(h3,dtype=np.float32)).resize((N,N),Image.BILINEAR),dtype=np.float32);h3=(h3-h3.min())/(h3.max()-h3.min()+1e-9)
creux=soft(1-h3,.55,.85)[...,None]
moss=(soft(pnoise(N,4,511,4),.55,.8)[...,None]*creux)
c=grade(d2,(1.0,.93,.82),.62,.9)*(.82+.36*var)
c=c*(1-creux*.45)
c=c*(1-moss*.6)+c*np.array([.5,.62,.4])*moss*.6
wet=soft(pnoise(N,5,512,4),.6,.85)[...,None];c=c*(1-wet*.3)
save('cav_w',c,h3,10)
print('cav ok')
