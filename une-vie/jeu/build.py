# Construit la page publiable (fichier unique, moteur 3D intégré) : python3 build.py  -> ../build/index.html
# Les matières photo (jeu/tex/*.jpg, préparées par outils/prep_tex.py) sont intégrées en data: dans PHOTO.
import os,base64,glob,json
d=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(d,'index_src.html')).read()
t=open(os.path.join(d,'vendor/three.min.js')).read()
tag='<script src="vendor/three.min.js"></script>'
assert tag in s
ph={os.path.basename(f)[:-4]:'data:image/jpeg;base64,'+base64.b64encode(open(f,'rb').read()).decode() for f in sorted(glob.glob(os.path.join(d,'tex','*.jpg')))}
ptag='/*PHOTO*/{}'
assert ptag in s
s=s.replace(ptag,json.dumps(ph),1)
os.makedirs(os.path.join(d,'../build'),exist_ok=True)
out=os.path.join(d,'../build/index.html')
open(out,'w').write(s.replace(tag,'<script>'+t+'</script>',1))
print(out,os.path.getsize(out))
