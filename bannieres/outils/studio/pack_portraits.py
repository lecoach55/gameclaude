# Assemble les portraits rendus (portraits.py) en jeu/portraits3d.js : python3 pack_portraits.py dossier
import base64,io,json,sys,os
from PIL import Image,ImageEnhance
D=sys.argv[1];OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../jeu/portraits3d.js')
out={}
for c in ['chevalier','clerc','rodeur','druide','chevmort','necromancien','barbare','chaman']:
    out[c]=[]
    for i in range(4):
        im=Image.open(f'{D}/{c}_{i}.png').convert('RGBA').resize((96,96),Image.LANCZOS)
        r,g,b,a=im.split();rgb=ImageEnhance.Contrast(Image.merge('RGB',(r,g,b))).enhance(1.08);im=Image.merge('RGBA',(*rgb.split(),a))
        bf=io.BytesIO();im.save(bf,'WEBP',quality=84,method=6);out[c].append('data:image/webp;base64,'+base64.b64encode(bf.getvalue()).decode())
s="'use strict';\n/* Portraits des héros rendus en 3D (outils/studio/portraits.py : personnages Mixamo de Valdragon). */\nvar POR3D="+json.dumps(out,separators=(',',':'))+";\n"
open(OUT,'w').write(s);print(len(s)//1024,'Kio')
