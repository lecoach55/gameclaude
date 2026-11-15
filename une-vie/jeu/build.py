# Construit la page publiable (fichier unique, moteur 3D intégré) : python3 build.py  -> ../build/index.html
import os
d=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(d,'index_src.html')).read()
t=open(os.path.join(d,'vendor/three.min.js')).read()
tag='<script src="vendor/three.min.js"></script>'
assert tag in s
os.makedirs(os.path.join(d,'../build'),exist_ok=True)
out=os.path.join(d,'../build/index.html')
open(out,'w').write(s.replace(tag,'<script>'+t+'</script>',1))
print(out,os.path.getsize(out))
