"""Teinte et saturation moyennes des pixels « verts » (herbe, feuillage) d'une capture — critère de la revue artistique du 16/11
(cible « maquette réaliste » : teinte 78-92°, saturation ≤ 0,45). Usage : python3 palette.py capture.png [autre.png …]"""
import sys,colorsys
from PIL import Image
for f in sys.argv[1:]:
    im=Image.open(f).convert('RGB');w,h=im.size;im=im.crop((0,int(h*0.18),w,int(h*0.86))).resize((w//4,int(h*0.68)//4))
    n=0;hs=ss=sl=0.0;toits_bleus=0;tot=0
    for r,g,b in (im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata()):
        H,S,V=colorsys.rgb_to_hsv(r/255,g/255,b/255);tot+=1
        if 50/360<=H<=160/360 and S>0.15 and V>0.12:n+=1;hs+=H*360;ss+=S;sl+=colorsys.rgb_to_hls(r/255,g/255,b/255)[2]
        if 200/360<=H<=235/360 and S>0.35 and V>0.25:toits_bleus+=1
    print(f"{f}: verts {100*n/tot:.0f} % · teinte {hs/max(n,1):.0f}° · saturation {ss/max(n,1):.2f} (TSV ; TSL {sl/max(n,1):.2f}) · bleu saturé {100*toits_bleus/tot:.1f} % des pixels")
