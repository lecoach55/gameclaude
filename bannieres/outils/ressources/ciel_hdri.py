# Ciel d'ambiance tiré d'un HDRI Poly Haven (CC0) → jeu/tex3d/ciel.jpg (équirectangulaire 1024×512, LDR linéaire / ECH)
# python3 ciel_hdri.py [id_polyhaven] [azimut_soleil_u] ; défaut kloppenheim_06_puresky, soleil tourné vers la lumière du jeu.
# Le soleil est écrêté (la lumière directionnelle du jeu le remplace) et l'hémisphère bas devient un sol brun-vert (rebond chaud).
# Dans le jeu (rendu3d.js, envHDRI) : texture sRGB décodée en linéaire × ECH_CIEL → PMREM (éclairage d'ambiance + reflets) ;
# la moitié haute sert aussi de ciel peint derrière les villes et les champs de bataille.
import sys,os,json,urllib.request,cv2,numpy as np
ID=sys.argv[1] if len(sys.argv)>1 else 'kloppenheim_06_puresky'
U_SOLEIL=float(sys.argv[2]) if len(sys.argv)>2 else .914   # direction de la lumière du soir (rendu3d.js AMB.dir) en u équirectangulaire three.js
ECH=4.0       # valeur linéaire max après écrêtage (doit égaler ECH_CIEL dans rendu3d.js)
BRUT='/home/claude/ph_hdri';os.makedirs(BRUT,exist_ok=True);src=f'{BRUT}/{ID}.hdr'
if not os.path.exists(src):
    o=urllib.request.build_opener();o.addheaders=[('User-Agent','bannieres-asset-tool/1.0')];urllib.request.install_opener(o)
    f=json.load(urllib.request.urlopen('https://api.polyhaven.com/files/'+ID,timeout=60));urllib.request.urlretrieve(f['hdri']['1k']['hdr']['url'],src)
a=cv2.imread(src,cv2.IMREAD_ANYDEPTH|cv2.IMREAD_COLOR)[:,:,::-1].astype(np.float32);H,W=a.shape[:2]
L=a.mean(2);sy,sx=np.unravel_index(L.argmax(),L.shape)
a=np.roll(a,int(round(U_SOLEIL*W))-sx,axis=1)                         # soleil du HDRI placé du côté de la lumière du jeu
lum=a.mean(2,keepdims=True);a=np.where(lum>ECH,a*ECH/np.maximum(lum,1e-6),a)  # écrêtage doux du disque solaire
y=(np.arange(H)[:,None,None]+.5)/H                                     # 0 = zénith, 1 = nadir
sol=np.array([.20,.18,.12],np.float32)*np.mean(a[int(H*.40):int(H*.5)])/.6
k=np.clip((y-.5)/.06,0,1)                                              # sous l'horizon : sol brun-vert, transition en 3°
a=a*(1-k)+sol*k
out=np.clip(a/ECH,0,1)**(1/2.2)                                        # encodage gamma simple (décodé en sRGB par three.js)
im=(out*255+.5).astype(np.uint8)[:,:,::-1]
dst=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../jeu/tex3d/ciel.jpg')
cv2.imwrite(dst,cv2.resize(im,(1024,512),interpolation=cv2.INTER_AREA),[cv2.IMWRITE_JPEG_QUALITY,88])
print(ID,'soleil',sx,sy,'→ u',U_SOLEIL,'max',float(L.max()),'écrit',dst,os.path.getsize(dst),'octets')
