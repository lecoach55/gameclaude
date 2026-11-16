# Luminance avant/après de captures du même nom : python3 lum3d.py dossier_avant dossier_apres
# (moyenne Rec.709 de la bande de jeu, puis des seuls pixels éclairés > 3 = « couloirs visibles »)
import sys,glob,os
from PIL import Image
import numpy as np
def lum(p):
    a=np.asarray(Image.open(p).convert('RGB')).astype(float);Y=.2126*a[...,0]+.7152*a[...,1]+.0722*a[...,2]
    H,W=Y.shape;yy,xx=np.mgrid[0:H,0:W];band=(yy>H*.12)&(yy<H*.85);v=band&(Y>3);return round(Y[band].mean(),1),round(Y[v].mean(),1)
for f in sorted(os.listdir(sys.argv[1])):
    print(f'{f:20s} avant {lum(sys.argv[1]+"/"+f)}  après {lum(sys.argv[2]+"/"+f)}')
